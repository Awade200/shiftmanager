import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { OCRResult } from '@/types/shift';

export const useOCR = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const extractShiftsFromImage = async (file: File): Promise<OCRResult[]> => {
    setLoading(true);
    setProgress(0);

    try {
      // Use OCR for all file types (images and PDFs)
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            setProgress(Math.round(info.progress * 100));
          }
        },
      });

      const text = result.data.text;
      console.log('OCR text extracted:', text);
      
      // Try rota format first, then fall back to legacy format
      let shifts = parseRotaText(text);
      if (shifts.length === 0) {
        shifts = parseShiftText(text);
      }
      
      return shifts;
    } catch (error) {
      console.error('Extraction Error:', error);
      throw new Error('Failed to extract text from file');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const parseRotaText = (text: string): OCRResult[] => {
    const shifts: OCRResult[] = [];
    
    // Try timesheet format first (Employee Timesheet format)
    const timesheetShifts = parseTimesheetFormat(text);
    if (timesheetShifts.length > 0) {
      shifts.push(...timesheetShifts);
    }
    
    // If no timesheet format found, try original rota format
    if (shifts.length === 0) {
      // Split text into blocks (each shift should be separated by empty lines or clear breaks)
      const blocks = text.split(/\n\s*\n|\n{2,}/).filter(block => block.trim());
      
      for (const block of blocks) {
        const shift = parseRotaBlock(block);
        if (shift) {
          shifts.push(shift);
        }
      }
      
      // If no blocks found, try line by line
      if (shifts.length === 0) {
        const lines = text.split('\n').filter(line => line.trim());
        let currentShift: Partial<OCRResult> = {};
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.match(/^Day:/i)) {
            // Save previous shift if complete
            if (currentShift.date && currentShift.startTime) {
              shifts.push(currentShift as OCRResult);
            }
            currentShift = {};
            const dateMatch = trimmedLine.match(/Day:\s*\w+\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
            if (dateMatch) {
              currentShift.date = convertDateFormat(dateMatch[1]);
            }
          } else if (trimmedLine.match(/^Client:/i)) {
            const clientMatch = trimmedLine.match(/Client:\s*(.+)/i);
            if (clientMatch) {
              currentShift.clientName = clientMatch[1].trim();
            }
          } else if (trimmedLine.match(/^Service:/i)) {
            const serviceMatch = trimmedLine.match(/Service:\s*(.+)/i);
            if (serviceMatch) {
              currentShift.serviceType = serviceMatch[1].trim();
              currentShift.location = serviceMatch[1].trim(); // Use service as location too
            }
          } else if (trimmedLine.match(/^Time:/i)) {
            const timeMatch = trimmedLine.match(/Time:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i);
            if (timeMatch) {
              currentShift.startTime = normalizeTimeString(timeMatch[1]);
              currentShift.endTime = normalizeTimeString(timeMatch[2]);
            }
          } else if (trimmedLine.match(/^Quantity:/i)) {
            const quantityMatch = trimmedLine.match(/Quantity:\s*(\d+\.?\d*)/i);
            if (quantityMatch) {
              currentShift.duration = parseFloat(quantityMatch[1]);
            }
          }
        }
        
        // Add the last shift
        if (currentShift.date && currentShift.startTime) {
          shifts.push(currentShift as OCRResult);
        }
      }
    }
    
    return shifts;
  };

  const parseTimesheetFormat = (text: string): OCRResult[] => {
    const shifts: OCRResult[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (let i = 0; i < lines.length - 2; i++) {
      const currentLine = lines[i];
      const nextLine = lines[i + 1];
      const thirdLine = lines[i + 2];
      
      // Look for pattern: Day + Client/Code + Service + Quantity on one line
      // followed by Date + Name on next line
      // followed by Time range on third line
      
      // Match pattern like: "Monday CD1795 Supported Living Day Shift 12.00"
      const shiftHeaderMatch = currentLine.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+([A-Z0-9]+)\s+(.+?)\s+(\d+\.?\d*)$/i);
      
      if (shiftHeaderMatch) {
        const [, dayName, clientCode, serviceType, quantity] = shiftHeaderMatch;
        
        // Next line should have date and name: "30/06/2025 James Gladstone"
        const dateNameMatch = nextLine.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+)$/);
        
        // Third line should have time range: "08:00 - 20:00"
        const timeMatch = thirdLine.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
        
        if (dateNameMatch && timeMatch) {
          const [, dateStr, clientName] = dateNameMatch;
          const [, startTime, endTime] = timeMatch;
          
          try {
            const shift: OCRResult = {
              date: convertDateFormat(dateStr),
              startTime: normalizeTimeString(startTime),
              endTime: normalizeTimeString(endTime),
              clientName: clientName.trim(),
              location: serviceType.trim(),
              serviceType: serviceType.trim(),
              duration: parseFloat(quantity)
            };
            
            shifts.push(shift);
            i += 2; // Skip the lines we just processed
          } catch (error) {
            console.log('Error parsing timesheet entry:', error);
          }
        }
      }
    }
    
    return shifts;
  };

  const parseRotaBlock = (block: string): OCRResult | null => {
    const lines = block.split('\n').map(line => line.trim());
    const shift: Partial<OCRResult> = {};
    
    for (const line of lines) {
      if (line.match(/^Day:/i)) {
        const dateMatch = line.match(/Day:\s*\w+\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
        if (dateMatch) {
          shift.date = convertDateFormat(dateMatch[1]);
        }
      } else if (line.match(/^Client:/i)) {
        const clientMatch = line.match(/Client:\s*(.+)/i);
        if (clientMatch) {
          shift.clientName = clientMatch[1].trim();
        }
      } else if (line.match(/^Service:/i)) {
        const serviceMatch = line.match(/Service:\s*(.+)/i);
        if (serviceMatch) {
          shift.serviceType = serviceMatch[1].trim();
          shift.location = serviceMatch[1].trim();
        }
      } else if (line.match(/^Time:/i)) {
        const timeMatch = line.match(/Time:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i);
        if (timeMatch) {
          shift.startTime = normalizeTimeString(timeMatch[1]);
          shift.endTime = normalizeTimeString(timeMatch[2]);
        }
      } else if (line.match(/^Quantity:/i)) {
        const quantityMatch = line.match(/Quantity:\s*(\d+\.?\d*)/i);
        if (quantityMatch) {
          shift.duration = parseFloat(quantityMatch[1]);
        }
      }
    }
    
    // Validate required fields
    if (shift.date && shift.startTime && shift.endTime && shift.clientName) {
      return shift as OCRResult;
    }
    
    return null;
  };

  const convertDateFormat = (dateStr: string): string => {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const parseShiftText = (text: string): OCRResult[] => {
    const shifts: OCRResult[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const shift = parseShiftLine(line);
      if (shift) {
        shifts.push(shift);
      }
    }

    return shifts;
  };

  const parseShiftLine = (line: string): OCRResult | null => {
    // Remove extra whitespace and normalize
    const cleanLine = line.replace(/\s+/g, ' ').trim();
    
    // Try multiple regex patterns to match different formats
    const patterns = [
      // DD/MM/YYYY | HH:MM | HH:MM | Location
      /(\d{1,2}\/\d{1,2}\/\d{4})\s*\|\s*(\d{1,2}:\d{2})\s*\|\s*(\d{1,2}:\d{2})\s*\|\s*(.+)/,
      // DD/MM/YYYY HH:MM HH:MM Location
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(.+)/,
      // DD-MM-YYYY | HH:MM | HH:MM | Location
      /(\d{1,2}-\d{1,2}-\d{4})\s*\|\s*(\d{1,2}:\d{2})\s*\|\s*(\d{1,2}:\d{2})\s*\|\s*(.+)/,
      // DD-MM-YYYY HH:MM HH:MM Location
      /(\d{1,2}-\d{1,2}-\d{4})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(.+)/,
    ];

    for (const pattern of patterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        const [, dateStr, startTime, endTime, location] = match;
        
        // Normalize date format to YYYY-MM-DD
        const normalizedDate = normalizeDateString(dateStr);
        
        if (normalizedDate && isValidTime(startTime) && isValidTime(endTime)) {
          return {
            date: normalizedDate,
            startTime: normalizeTimeString(startTime),
            endTime: normalizeTimeString(endTime),
            clientName: location.trim(),
            location: location.trim(),
          };
        }
      }
    }

    return null;
  };

  const normalizeDateString = (dateStr: string): string | null => {
    try {
      let normalizedDate: string;
      
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (dateStr.includes('-')) {
        const [day, month, year] = dateStr.split('-');
        normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        return null;
      }

      // Validate the date
      const date = new Date(normalizedDate);
      if (isNaN(date.getTime())) {
        return null;
      }

      return normalizedDate;
    } catch {
      return null;
    }
  };

  const normalizeTimeString = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  const isValidTime = (timeStr: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  };

  return {
    extractShiftsFromImage,
    loading,
    progress,
  };
};