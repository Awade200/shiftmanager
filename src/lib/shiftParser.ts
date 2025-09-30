// Smart Multi-Format Shift Extraction Engine
import { OCRResult } from '@/types/shift';

export interface ShiftRow {
  day: string;
  date: string;
  clientCode: string;
  clientName: string;
  service: string;
  startTime: string;
  endTime: string;
  hours: number;
  hourlyRate?: number; // Add hourlyRate to automatically apply default rate
  sourceType: 'paste' | 'pdf' | 'ocr';
  rawLines: string[];
  hoursCorrected?: boolean;
  needsLocation?: boolean;
}

export interface ParseResult {
  shifts: ShiftRow[];
  warnings: string[];
  debugInfo: {
    totalLines: number;
    processedLines: number;
    unknownLines: string[];
    detectedFormat?: 'multi-line' | 'stacked' | 'tabular';
  };
}

// Regex patterns for token detection
const PATTERNS = {
  day: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
  date: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
  clientCode: /^CD\d{3,5}\b/i,
  clientCodeOnly: /^CD\d{3,5}$/i, // Client code on its own line
  timeRange: /\b(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\b/,
  timeRangeOnly: /^(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})$/,
  hoursQuantity: /(?:Shift|Hours?)\s+([\d.]+)/i,
  serviceWithHours: /^(.+?)\s+([\d.]+)$/, // Service description ending with hours
  trailingFloat: /\b([\d.]{1,5})\s*$/,
  serviceKeywords: /(?:Supported Living|Day Shift|Night Shift|Respite|Personal Care)/i,
  pageFooter: /^(?:Run Date:|Page|Employee No:|Total|Grand Total|Day Client Service Quantity|Employee Timesheet From Date:|Total Sleeps)/i,
  // New pattern for your format: CD code followed by service and hours
  codeServiceHours: /^(CD\d{3,5})\s+(.+?)\s+([\d.]+)$/i
};

// Normalization pipeline
function preprocessText(rawText: string): string[] {
  // Strip control characters and normalize line breaks
  let normalized = rawText
    .replace(/[\r\n\u2028\u2029]/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\u00A0/g, ' '); // Replace non-breaking spaces

  // Split into lines and further split long wrapped lines at multiple spaces
  let lines = normalized.split('\n');
  let expandedLines: string[] = [];

  for (const line of lines) {
    // Split long lines at multiple spaces (4+ spaces likely indicate column breaks)
    const segments = line.split(/\s{4,}/);
    if (segments.length > 1) {
      expandedLines.push(...segments.filter(s => s.trim()));
    } else {
      expandedLines.push(line);
    }
  }

  // Trim whitespace, drop empty lines and page footers
  return expandedLines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => !PATTERNS.pageFooter.test(line))
    .map(line => {
      // Collapse repeated spaces to single space (except in time ranges)
      return line.replace(/(\d{1,2}:\d{2})\s+[-–—]\s+(\d{1,2}:\d{2})/, '$1-$2')
                .replace(/\s+/g, ' ');
    });
}

// Convert date formats to YYYY-MM-DD
function normalizeDate(dateStr: string): string {
  const match = dateStr.match(PATTERNS.date);
  if (!match) return dateStr;

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Convert time to 24-hour format
function normalizeTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Calculate duration between times
function computeHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let start = startHour * 60 + startMin;
  let end = endHour * 60 + endMin;
  
  // Handle overnight shifts
  if (end < start) {
    end += 24 * 60;
  }
  
  return (end - start) / 60;
}

// Detect multi-line day-based format
function detectMultiLineFormat(lines: string[]): boolean {
  let dayCount = 0;
  let dateCount = 0;
  let codeOnlyCount = 0;
  let timeOnlyCount = 0;
  let serviceWithHoursCount = 0;
  
  for (const line of lines) {
    if (PATTERNS.day.test(line)) dayCount++;
    if (PATTERNS.date.test(line)) dateCount++;
    if (PATTERNS.clientCodeOnly.test(line)) codeOnlyCount++;
    if (PATTERNS.timeRangeOnly.test(line)) timeOnlyCount++;
    if (PATTERNS.serviceWithHours.test(line) && PATTERNS.serviceKeywords.test(line)) {
      serviceWithHoursCount++;
    }
  }
  
  // Multi-line format indicators:
  // - Has standalone client codes (code on its own line)
  // - Has standalone time ranges (time on its own line)
  // - Has service + hours lines
  // - Ratio of these patterns suggests 4-line shift blocks
  const hasMultiLineStructure = codeOnlyCount >= 3 && timeOnlyCount >= 3;
  const hasServiceHoursPattern = serviceWithHoursCount >= 3;
  
  return hasMultiLineStructure && hasServiceHoursPattern;
}

// Parse multi-line day-based format (two-phase: clients first, then services)
function parseMultiLineFormat(rawText: string, sourceType: 'paste' | 'pdf' | 'ocr'): ParseResult {
  const lines = preprocessText(rawText);
  const shifts: ShiftRow[] = [];
  const warnings: string[] = [];
  const unknownLines: string[] = [];
  
  // Phase 1: Extract client information by day
  interface ClientEntry {
    day: string;
    date: string;
    code: string;
    name: string;
  }
  
  const clients: ClientEntry[] = [];
  let currentDay = '';
  let currentDate = '';
  let i = 0;
  
  // Find where service lines start (service lines come after all client info)
  let serviceStartIndex = -1;
  for (let idx = 0; idx < lines.length; idx++) {
    if (PATTERNS.serviceWithHours.test(lines[idx]) && PATTERNS.serviceKeywords.test(lines[idx])) {
      serviceStartIndex = idx;
      break;
    }
  }
  
  if (serviceStartIndex === -1) {
    warnings.push('Could not find service section in multi-line format');
    return { shifts: [], warnings, debugInfo: { totalLines: lines.length, processedLines: 0, unknownLines: [], detectedFormat: 'multi-line' } };
  }
  
  // Parse client section (before services start)
  for (i = 0; i < serviceStartIndex; i++) {
    const line = lines[i];
    
    // Check for day
    const dayMatch = line.match(PATTERNS.day);
    if (dayMatch) {
      currentDay = dayMatch[1];
      continue;
    }
    
    // Check for date (may include first client name)
    const dateMatch = line.match(PATTERNS.date);
    if (dateMatch) {
      currentDate = dateMatch[0];
      // Extract potential client name after date
      const afterDate = line.replace(dateMatch[0], '').trim();
      if (afterDate && !PATTERNS.clientCode.test(afterDate)) {
        // This is a client name on the date line - look for preceding code
        // The code should be on the previous line
        if (i > 0 && PATTERNS.clientCodeOnly.test(lines[i-1])) {
          clients.push({
            day: currentDay,
            date: currentDate,
            code: lines[i-1].trim(),
            name: afterDate
          });
        }
      }
      continue;
    }
    
    // Check for standalone client code
    if (PATTERNS.clientCodeOnly.test(line)) {
      // Next line might be the name (if it's not another code or date)
      if (i + 1 < serviceStartIndex) {
        const nextLine = lines[i + 1];
        if (!PATTERNS.clientCode.test(nextLine) && 
            !PATTERNS.date.test(nextLine) && 
            !PATTERNS.day.test(nextLine)) {
          clients.push({
            day: currentDay,
            date: currentDate,
            code: line.trim(),
            name: nextLine
          });
          i++; // Skip the name line
          continue;
        }
      }
      // If no name follows, we'll match it later if there's a date line
      continue;
    }
  }
  
  // Phase 2: Extract service + time pairs
  interface ServiceEntry {
    service: string;
    hours: number;
    startTime: string;
    endTime: string;
  }
  
  const services: ServiceEntry[] = [];
  
  for (i = serviceStartIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for service with hours
    const serviceMatch = line.match(PATTERNS.serviceWithHours);
    if (serviceMatch && PATTERNS.serviceKeywords.test(line)) {
      const service = serviceMatch[1].trim();
      const hours = parseFloat(serviceMatch[2]);
      
      // Next line should be time range
      if (i + 1 < lines.length) {
        const timeLine = lines[i + 1];
        const timeMatch = timeLine.match(PATTERNS.timeRangeOnly);
        if (timeMatch) {
          services.push({
            service,
            hours,
            startTime: normalizeTime(timeMatch[1]),
            endTime: normalizeTime(timeMatch[2])
          });
          i++; // Skip the time line
        }
      }
    }
  }
  
  // Phase 3: Match clients with services (in order)
  const minLength = Math.min(clients.length, services.length);
  
  if (clients.length !== services.length) {
    warnings.push(`Client count (${clients.length}) doesn't match service count (${services.length}). Some shifts may be incomplete.`);
  }
  
  for (let idx = 0; idx < minLength; idx++) {
    const client = clients[idx];
    const service = services[idx];
    
    shifts.push({
      day: client.day,
      date: normalizeDate(client.date),
      clientCode: client.code,
      clientName: client.name || 'Unknown Client',
      service: service.service,
      startTime: service.startTime,
      endTime: service.endTime,
      hours: service.hours,
      sourceType,
      rawLines: [client.day, client.date, client.code, client.name, service.service + ' ' + service.hours, `${service.startTime}-${service.endTime}`],
      hoursCorrected: false,
      needsLocation: !client.name
    });
  }
  
  // Sort shifts chronologically
  const sortedShifts = shifts.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });
  
  return {
    shifts: sortedShifts,
    warnings,
    debugInfo: {
      totalLines: lines.length,
      processedLines: lines.length - unknownLines.length,
      unknownLines: unknownLines.slice(0, 10),
      detectedFormat: 'multi-line'
    }
  };
}

// Main parsing function with stateful model
export function parseRota(rawText: string, sourceType: 'paste' | 'pdf' | 'ocr' = 'paste'): ParseResult {
  const lines = preprocessText(rawText);
  const shifts: ShiftRow[] = [];
  const warnings: string[] = [];
  const unknownLines: string[] = [];

  // State variables
  let currentDay = '';
  let currentDate = '';
  let currentClientCode = '';
  let currentClientName = '';
  let currentService = '';
  let pendingHours: number | null = null;
  let bufferLines: string[] = [];

  function emitShift(startTime: string, endTime: string, hours?: number) {
    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);
    const computedHours = computeHours(normalizedStart, normalizedEnd);
    
    let finalHours = hours ?? pendingHours ?? computedHours;
    let hoursCorrected = false;

    // Check for significant mismatch between stated and computed hours
    if (pendingHours && Math.abs(computedHours - pendingHours) > 0.25) {
      finalHours = pendingHours; // Use the provided hours, not computed
      hoursCorrected = false;
      // Only warn if the difference is very large (over 1 hour)
      if (Math.abs(computedHours - pendingHours) > 1) {
        warnings.push(`Large time difference detected for ${currentClientName}: computed ${computedHours}h vs stated ${pendingHours}h`);
      }
    }

    shifts.push({
      day: currentDay,
      date: normalizeDate(currentDate),
      clientCode: currentClientCode,
      clientName: currentClientName,
      service: currentService || 'Shift',
      startTime: normalizedStart,
      endTime: normalizedEnd,
      hours: Math.round(finalHours * 100) / 100, // Round to 2 decimal places
      sourceType,
      rawLines: [...bufferLines],
      hoursCorrected,
      needsLocation: !currentClientName
    });

    // Reset only the shift-specific state, keep day/date for next shifts
    pendingHours = null;
    currentClientCode = '';
    currentClientName = '';
    currentService = '';
    bufferLines = [];
  }

  // Process each line
  lines.forEach((line, idx) => {
    bufferLines.push(line);
    let lineProcessed = false;

    // Check for day pattern
    const dayMatch = line.match(PATTERNS.day);
    if (dayMatch) {
      currentDay = dayMatch[1];
      lineProcessed = true;
    }

    // Check for date pattern (may include client name)
    const dateMatch = line.match(PATTERNS.date);
    if (dateMatch) {
      currentDate = dateMatch[0];
      // Extract potential client name after date
      const afterDate = line.replace(dateMatch[0], '').trim();
      if (afterDate && !PATTERNS.clientCode.test(afterDate)) {
        currentClientName = afterDate;
      }
      lineProcessed = true;
    }

    // Check for your specific format: CD code + service + hours
    const codeServiceHoursMatch = line.match(PATTERNS.codeServiceHours);
    if (codeServiceHoursMatch) {
      currentClientCode = codeServiceHoursMatch[1];
      currentService = codeServiceHoursMatch[2];
      pendingHours = parseFloat(codeServiceHoursMatch[3]);
      lineProcessed = true;
    }

    // Check for client name + time range pattern (your format's second line)
    const timeMatch = line.match(PATTERNS.timeRange);
    if (timeMatch && !codeServiceHoursMatch && !PATTERNS.clientCode.test(line)) {
      // This might be a client name + time range line
      const beforeTime = line.substring(0, line.indexOf(timeMatch[0])).trim();
      if (beforeTime && currentClientCode && !currentClientName) {
        currentClientName = beforeTime;
      }
      emitShift(timeMatch[1], timeMatch[2]);
      lineProcessed = true;
    }

    // Check for client code (fallback for other formats)
    const codeMatch = line.match(PATTERNS.clientCode);
    if (codeMatch && !codeServiceHoursMatch) {
      currentClientCode = codeMatch[0];
      // Check if client name is on the same line
      const afterCode = line.replace(codeMatch[0], '').trim();
      if (afterCode && !PATTERNS.timeRange.test(afterCode) && !PATTERNS.serviceKeywords.test(afterCode)) {
        currentClientName = afterCode;
      }
      lineProcessed = true;
    }

    // Check for service with hours (fallback)
    const serviceMatch = line.match(PATTERNS.serviceKeywords);
    const hoursMatch = line.match(PATTERNS.hoursQuantity);
    if ((serviceMatch || hoursMatch) && !codeServiceHoursMatch) {
      if (serviceMatch) {
        currentService = serviceMatch[0];
      }
      if (hoursMatch) {
        pendingHours = parseFloat(hoursMatch[1]);
      }
      
      // Check for embedded time range in same line
      const embeddedTimeMatch = line.match(PATTERNS.timeRange);
      if (embeddedTimeMatch) {
        emitShift(embeddedTimeMatch[1], embeddedTimeMatch[2]);
      }
      lineProcessed = true;
    }

    // Check for client name (if we have a client code but no name yet)
    if (!lineProcessed && currentClientCode && !currentClientName) {
      // Avoid mistaking service lines, dates, codes as names
      if (!PATTERNS.serviceKeywords.test(line) && 
          !PATTERNS.date.test(line) && 
          !PATTERNS.clientCode.test(line) &&
          !PATTERNS.day.test(line) &&
          !PATTERNS.timeRange.test(line) &&
          !PATTERNS.trailingFloat.test(line)) {
        currentClientName = line;
        lineProcessed = true;
      }
    }

    // Track unknown lines for debugging
    if (!lineProcessed && line.length > 2) {
      unknownLines.push(line);
    }
  });

  // Validate results
  if (shifts.length === 0) {
    warnings.push('No shifts detected. Please check the format and try again.');
  }

  if (unknownLines.length > lines.length * 0.5) {
    warnings.push(`Many lines could not be parsed (${unknownLines.length}/${lines.length}). Please verify the format.`);
  }

  // Sort shifts chronologically by start time
  const sortedShifts = shifts.sort((a, b) => {
    // First sort by date, then by start time
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  return {
    shifts: sortedShifts,
    warnings,
    debugInfo: {
      totalLines: lines.length,
      processedLines: lines.length - unknownLines.length,
      unknownLines: unknownLines.slice(0, 5), // Show first 5 for debugging
      detectedFormat: 'stacked'
    }
  };
}

// Auto-detect format and route to appropriate parser
export function extractShiftsAuto(rawText: string, sourceType: 'paste' | 'pdf' | 'ocr'): ParseResult {
  // Simple heuristics to detect format
  const lines = preprocessText(rawText);
  
  // Check for multi-line format first (most specific)
  const isMultiLine = detectMultiLineFormat(lines);
  if (isMultiLine) {
    console.log('✅ Detected multi-line day-based format (4-line shift blocks)');
    return parseMultiLineFormat(rawText, sourceType);
  }
  
  // Count indicators of different formats
  const codeCount = lines.filter(line => PATTERNS.clientCode.test(line)).length;
  const dayCount = lines.filter(line => PATTERNS.day.test(line)).length;
  const serviceCount = lines.filter(line => PATTERNS.serviceKeywords.test(line)).length;
  
  // If we have many CD codes and service lines, likely stacked format
  if (codeCount > 0 && serviceCount > 0) {
    console.log('Detected stacked format (codes + services)');
    const result = parseRota(rawText, sourceType);
    result.debugInfo.detectedFormat = 'stacked';
    return result;
  }
  
  // If we have day headers, likely week-based format
  if (dayCount > 1) {
    console.log('Detected day-based format');
    const result = parseRota(rawText, sourceType);
    result.debugInfo.detectedFormat = 'stacked';
    return result;
  }
  
  // Check for CSV-like format (commas or tabs)
  if (rawText.includes(',') || rawText.includes('\t')) {
    console.log('Detected tabular format, preprocessing...');
    // Convert to line-based format first
    const processedText = rawText
      .replace(/[,\t]/g, '\n')
      .replace(/\n+/g, '\n');
    const result = parseRota(processedText, sourceType);
    result.debugInfo.detectedFormat = 'tabular';
    return result;
  }
  
  // Default to stacked parser
  console.log('Using default stacked parser');
  const result = parseRota(rawText, sourceType);
  result.debugInfo.detectedFormat = 'stacked';
  return result;
}

// Convert ShiftRow to OCRResult for compatibility with existing code
export function shiftRowToOCRResult(shift: ShiftRow): OCRResult {
  return {
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    clientName: shift.clientName,
    location: '',
    serviceType: shift.service,
    duration: shift.hours
  };
}

// Batch convert multiple shifts
export function shiftsToOCRResults(shifts: ShiftRow[]): OCRResult[] {
  return shifts.map(shiftRowToOCRResult);
}
