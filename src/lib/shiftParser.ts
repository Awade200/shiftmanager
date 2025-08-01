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
  };
}

// Regex patterns for token detection
const PATTERNS = {
  day: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i,
  date: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
  clientCode: /^CD\d{3,5}\b/i,
  timeRange: /\b(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\b/,
  hoursQuantity: /(?:Shift|Hours?)\s+([\d.]+)/i,
  trailingFloat: /\b([\d.]{1,5})\s*$/,
  serviceKeywords: /(?:Supported Living|Day Shift|Night Shift|Respite|Personal Care)/i,
  pageFooter: /^(?:Run Date:|Page|Employee No:|Total|Grand Total)/i,
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

  return {
    shifts,
    warnings,
    debugInfo: {
      totalLines: lines.length,
      processedLines: lines.length - unknownLines.length,
      unknownLines: unknownLines.slice(0, 5) // Show first 5 for debugging
    }
  };
}

// Auto-detect format and route to appropriate parser
export function extractShiftsAuto(rawText: string, sourceType: 'paste' | 'pdf' | 'ocr'): ParseResult {
  // Simple heuristics to detect format
  const lines = preprocessText(rawText);
  
  // Count indicators of different formats
  const codeCount = lines.filter(line => PATTERNS.clientCode.test(line)).length;
  const dayCount = lines.filter(line => PATTERNS.day.test(line)).length;
  const serviceCount = lines.filter(line => PATTERNS.serviceKeywords.test(line)).length;
  
  // If we have many CD codes and service lines, likely stacked format
  if (codeCount > 0 && serviceCount > 0) {
    console.log('Detected stacked format (codes + services)');
    return parseRota(rawText, sourceType);
  }
  
  // If we have day headers, likely week-based format
  if (dayCount > 1) {
    console.log('Detected day-based format');
    return parseRota(rawText, sourceType);
  }
  
  // Check for CSV-like format (commas or tabs)
  if (rawText.includes(',') || rawText.includes('\t')) {
    console.log('Detected tabular format, preprocessing...');
    // Convert to line-based format first
    const processedText = rawText
      .replace(/[,\t]/g, '\n')
      .replace(/\n+/g, '\n');
    return parseRota(processedText, sourceType);
  }
  
  // Default to stacked parser
  console.log('Using default stacked parser');
  return parseRota(rawText, sourceType);
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
