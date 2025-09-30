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

// Parse multi-line day-based format
function parseMultiLineFormat(rawText: string, sourceType: 'paste' | 'pdf' | 'ocr'): ParseResult {
  const lines = preprocessText(rawText);
  const shifts: ShiftRow[] = [];
  const warnings: string[] = [];
  const unknownLines: string[] = [];
  
  let state: 'WAITING_FOR_DAY' | 'WAITING_FOR_DATE' | 'EXPECTING_CODE' | 'EXPECTING_NAME' | 'EXPECTING_SERVICE' | 'EXPECTING_TIME' = 'WAITING_FOR_DAY';
  
  let currentDay = '';
  let currentDate = '';
  let shiftBuffer = {
    code: '',
    name: '',
    service: '',
    hours: 0,
    timeRange: ''
  };
  let bufferLines: string[] = [];
  
  function emitShift() {
    if (!shiftBuffer.code || !shiftBuffer.timeRange) {
      return; // Invalid shift, skip
    }
    
    const timeMatch = shiftBuffer.timeRange.match(PATTERNS.timeRange);
    if (!timeMatch) {
      warnings.push(`Invalid time range: ${shiftBuffer.timeRange}`);
      return;
    }
    
    const [, startTime, endTime] = timeMatch;
    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);
    const computedHours = computeHours(normalizedStart, normalizedEnd);
    
    shifts.push({
      day: currentDay,
      date: normalizeDate(currentDate),
      clientCode: shiftBuffer.code,
      clientName: shiftBuffer.name || 'Unknown Client',
      service: shiftBuffer.service || 'Shift',
      startTime: normalizedStart,
      endTime: normalizedEnd,
      hours: shiftBuffer.hours || computedHours,
      sourceType,
      rawLines: [...bufferLines],
      hoursCorrected: false,
      needsLocation: !shiftBuffer.name
    });
    
    // Reset shift buffer but keep day/date
    shiftBuffer = { code: '', name: '', service: '', hours: 0, timeRange: '' };
    bufferLines = [];
    state = 'EXPECTING_CODE';
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    bufferLines.push(line);
    let lineProcessed = false;
    
    switch (state) {
      case 'WAITING_FOR_DAY': {
        const dayMatch = line.match(PATTERNS.day);
        if (dayMatch) {
          currentDay = dayMatch[1];
          state = 'WAITING_FOR_DATE';
          lineProcessed = true;
        }
        break;
      }
      
      case 'WAITING_FOR_DATE': {
        const dateMatch = line.match(PATTERNS.date);
        if (dateMatch) {
          currentDate = dateMatch[0];
          // First client name might be on this line
          const afterDate = line.replace(dateMatch[0], '').trim();
          if (afterDate) {
            // This is likely the first client name for reference, but each shift has its own
            // We'll capture actual names per shift
          }
          state = 'EXPECTING_CODE';
          lineProcessed = true;
        }
        break;
      }
      
      case 'EXPECTING_CODE': {
        const codeMatch = line.match(PATTERNS.clientCodeOnly);
        if (codeMatch) {
          shiftBuffer.code = line.trim();
          state = 'EXPECTING_NAME';
          lineProcessed = true;
        } else {
          // Check if we're moving to next day
          const dayMatch = line.match(PATTERNS.day);
          if (dayMatch) {
            currentDay = dayMatch[1];
            state = 'WAITING_FOR_DATE';
            lineProcessed = true;
          }
        }
        break;
      }
      
      case 'EXPECTING_NAME': {
        // Next line should be client name (not a code, date, or service)
        if (!PATTERNS.clientCode.test(line) && 
            !PATTERNS.date.test(line) && 
            !PATTERNS.serviceKeywords.test(line) &&
            !PATTERNS.timeRange.test(line)) {
          shiftBuffer.name = line;
          state = 'EXPECTING_SERVICE';
          lineProcessed = true;
        } else {
          // No name found, use empty and move to service if it's a service line
          const serviceMatch = line.match(PATTERNS.serviceWithHours);
          if (serviceMatch && PATTERNS.serviceKeywords.test(line)) {
            shiftBuffer.name = '';
            shiftBuffer.service = serviceMatch[1].trim();
            shiftBuffer.hours = parseFloat(serviceMatch[2]);
            state = 'EXPECTING_TIME';
            lineProcessed = true;
          }
        }
        break;
      }
      
      case 'EXPECTING_SERVICE': {
        const serviceMatch = line.match(PATTERNS.serviceWithHours);
        if (serviceMatch && PATTERNS.serviceKeywords.test(line)) {
          shiftBuffer.service = serviceMatch[1].trim();
          shiftBuffer.hours = parseFloat(serviceMatch[2]);
          state = 'EXPECTING_TIME';
          lineProcessed = true;
        }
        break;
      }
      
      case 'EXPECTING_TIME': {
        const timeMatch = line.match(PATTERNS.timeRangeOnly);
        if (timeMatch) {
          shiftBuffer.timeRange = line;
          emitShift();
          lineProcessed = true;
        }
        break;
      }
    }
    
    if (!lineProcessed && line.length > 2) {
      unknownLines.push(line);
    }
  }
  
  // Validate results
  if (shifts.length === 0) {
    warnings.push('No shifts detected in multi-line format. Please check the format.');
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
