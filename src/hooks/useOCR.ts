import { useState } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { OCRResult } from '@/types/shift';

// Set the worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export const useOCR = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Timeout wrapper for async operations
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
      ),
    ]);
  };

  // Retry wrapper for network operations
  const withRetry = async <T,>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000
  ): Promise<T> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
    throw new Error('All retries failed');
  };

  const extractShiftsFromImage = async (file: File): Promise<string> => {
    setLoading(true);
    setProgress(0);

    try {
      let text: string;

      // Handle PDFs differently from images
      if (file.type === 'application/pdf') {
        console.log('Processing PDF file with text extraction...');
        
        // Load PDF with timeout and retry
        const arrayBuffer = await withTimeout(
          file.arrayBuffer(),
          30000,
          'PDF file read timeout - file may be too large'
        );
        
        console.log('PDF file loaded, initializing worker...');
        
        // Load PDF document with timeout and retry
        const pdf = await withTimeout(
          withRetry(async () => {
            const loadingTask = pdfjsLib.getDocument({
              data: arrayBuffer,
              useWorkerFetch: false,
              isEvalSupported: false,
              useSystemFonts: true,
            });
            return await loadingTask.promise;
          }),
          60000,
          'PDF processing timeout - document may be corrupted or too complex'
        );
        
        console.log(`PDF loaded successfully, processing ${pdf.numPages} pages...`);
        
        text = '';
        const numPages = pdf.numPages;
        
        // Process each page with timeout
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          console.log(`Processing page ${pageNum}/${numPages}...`);
          
          const page = await withTimeout(
            pdf.getPage(pageNum),
            30000,
            `Timeout loading page ${pageNum}`
          );
          
          const textContent = await withTimeout(
            page.getTextContent(),
            30000,
            `Timeout extracting text from page ${pageNum}`
          );
          
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          text += pageText + '\n';
          setProgress(Math.round((pageNum / numPages) * 100));
        }
        
        console.log('PDF text extracted successfully:', text.substring(0, 200) + '...');
        
        if (!text.trim()) {
          throw new Error('PDF appears to be empty or contains only images. Try uploading as an image instead.');
        }
      } else {
        console.log('Processing image file with OCR...');
        // Use OCR for images with timeout
        const result = await withTimeout(
          Tesseract.recognize(file, 'eng', {
            logger: (info) => {
              if (info.status === 'recognizing text') {
                setProgress(Math.round(info.progress * 100));
              }
            },
          }),
          120000,
          'OCR processing timeout - image may be too large or complex'
        );
        text = result.data.text;
        console.log('OCR text extracted:', text);
      }
      
      // Return raw text - let the main parser handle format detection
      return text;
    } catch (error) {
      console.error('Extraction Error:', error);
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error(`Processing timeout: ${error.message}`);
        } else if (error.message.includes('worker')) {
          throw new Error('PDF processing failed. Please try uploading as an image instead.');
        } else if (error.message.includes('empty')) {
          throw error;
        }
      }
      
      throw new Error('Failed to extract text from file. Please try a different file format or quality.');
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

  const parseStructuredFormat = (lines: string[]): OCRResult[] => {
    const shifts: OCRResult[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for day and date pattern: "Monday 30/06/2025"
      const dayDateMatch = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2}\/\d{1,2}\/\d{4})$/i);
      if (dayDateMatch) {
        const [, dayName, dateStr] = dayDateMatch;
        
        // Look for the next lines to complete the shift data
        let clientName = '';
        let serviceType = '';
        let startTime = '';
        let endTime = '';
        let duration = 0;
        
        // Parse the following lines
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          
          // Client pattern: "CD1795 – James Gladstone" or "CD1795 - James Gladstone"
          const clientMatch = nextLine.match(/^([A-Z0-9]+)\s*[–-]\s*(.+)$/);
          if (clientMatch && !clientName) {
            clientName = clientMatch[2].trim();
            continue;
          }
          
          // Service type pattern: Just text describing the service
          const serviceMatch = nextLine.match(/^([A-Za-z\s]+(?:Shift|Service|Support|Care|Living).*)$/);
          if (serviceMatch && !serviceType && !nextLine.match(/^\d{1,2}:\d{2}/)) {
            serviceType = serviceMatch[1].trim();
            continue;
          }
          
          // Time pattern: "08:00 - 20:00"
          const timeMatch = nextLine.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
          if (timeMatch && !startTime) {
            startTime = timeMatch[1];
            endTime = timeMatch[2];
            continue;
          }
          
          // Quantity pattern: "Quantity: 12.00"
          const quantityMatch = nextLine.match(/^Quantity:\s*(\d+\.?\d*)$/i);
          if (quantityMatch) {
            duration = parseFloat(quantityMatch[1]);
            break; // End of this shift entry
          }
        }
        
        // Create shift if we have minimum required data
        if (clientName && startTime && endTime) {
          try {
            const shift: OCRResult = {
              date: convertDateFormat(dateStr),
              startTime: normalizeTimeString(startTime),
              endTime: normalizeTimeString(endTime),
              clientName: clientName,
              location: serviceType || 'Unknown Service',
              serviceType: serviceType || 'Unknown Service',
              duration: duration || calculateDurationFromTimes(startTime, endTime)
            };
            
            shifts.push(shift);
            console.log('Added structured shift:', shift);
          } catch (error) {
            console.log('Error parsing structured shift:', error);
          }
        }
      }
    }
    
    return shifts;
  };

  const parseTimesheetFormat = (text: string): OCRResult[] => {
    const shifts: OCRResult[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('Parsing timesheet format with lines:', lines);
    console.log('Total lines to process:', lines.length);
    
    // Try specific Employee Timesheet format first
    const employeeTimesheetShifts = parseEmployeeTimesheetFormat(lines);
    if (employeeTimesheetShifts.length > 0) {
      shifts.push(...employeeTimesheetShifts);
    }
    
    // Try structured format if no Employee Timesheet format found
    if (shifts.length === 0) {
      const structuredShifts = parseStructuredFormat(lines);
      if (structuredShifts.length > 0) {
        shifts.push(...structuredShifts);
      }
    }
    
    if (shifts.length === 0) {
      // Fallback to previous parsing logic
      let currentDate = '';
      let currentService = '';
      let currentQuantity = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for day + service pattern
        const dayServiceMatch = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+([A-Z0-9]+)\s+(.+?)\s+(\d+\.?\d*)$/i);
        if (dayServiceMatch) {
          const [, dayName, clientCode, serviceType, quantity] = dayServiceMatch;
          currentService = serviceType.trim();
          currentQuantity = parseFloat(quantity);
          continue;
        }
        
        // Check for date + name + time pattern: "30/06/2025 James Gladstone 08:00 - 20:00"
        const fullEntryMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
        if (fullEntryMatch) {
          const [, dateStr, clientName, startTime, endTime] = fullEntryMatch;
          
          try {
            const shift: OCRResult = {
              date: convertDateFormat(dateStr),
              startTime: normalizeTimeString(startTime),
              endTime: normalizeTimeString(endTime),
              clientName: clientName.trim(),
              location: currentService || 'Unknown Service',
              serviceType: currentService || 'Unknown Service',
              duration: currentQuantity || calculateDurationFromTimes(startTime, endTime)
            };
            
            shifts.push(shift);
            console.log('Added shift:', shift);
          } catch (error) {
            console.log('Error parsing full entry:', error);
          }
          continue;
        }
        
        // Check for separate date line
        const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+)$/);
        if (dateMatch) {
          const [, dateStr, clientName] = dateMatch;
          currentDate = dateStr;
          
          // Look ahead for time on next line
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const timeMatch = nextLine.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
            
            if (timeMatch) {
              const [, startTime, endTime] = timeMatch;
              
              try {
                const shift: OCRResult = {
                  date: convertDateFormat(currentDate),
                  startTime: normalizeTimeString(startTime),
                  endTime: normalizeTimeString(endTime),
                  clientName: clientName.trim(),
                  location: currentService || 'Unknown Service',
                  serviceType: currentService || 'Unknown Service',
                  duration: currentQuantity || calculateDurationFromTimes(startTime, endTime)
                };
                
                shifts.push(shift);
                console.log('Added shift from separate lines:', shift);
                i++; // Skip the time line
              } catch (error) {
                console.log('Error parsing separate lines:', error);
              }
            }
          }
        }
      }
    }
    
    console.log('Parsed shifts:', shifts);
    return shifts;
  };

  const parseEmployeeTimesheetFormat = (lines: string[]): OCRResult[] => {
    const shifts: OCRResult[] = [];
    console.log('Trying Employee Timesheet format parser...');
    
    let currentDate = '';
    let currentDay = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`Processing line ${i}: "${line}"`);
      
      // Look for day pattern: "Monday" or "Tuesday" etc (on its own line or followed by client code)
      const dayMatch = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s+([A-Z0-9]+))?/i);
      if (dayMatch) {
        currentDay = dayMatch[1];
        console.log('Found day:', currentDay);
        
        // Check if next line has a date
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const dateMatch = nextLine.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (dateMatch) {
            currentDate = dateMatch[1];
            console.log('Found date:', currentDate);
            i++; // Skip the date line
          }
        }
        continue;
      }
      
      // Look for client code + service type + quantity pattern
      // "CD2328 Supported Living Day Shift 12.00"
      const clientServiceMatch = line.match(/^([A-Z0-9]+)\s+(.+?)\s+(\d+\.?\d*)$/);
      if (clientServiceMatch) {
        const [, clientCode, serviceType, quantity] = clientServiceMatch;
        console.log(`Found client service: ${clientCode}, ${serviceType}, ${quantity}`);
        
        // Look for client name and time on next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const clientTimeMatch = nextLine.match(/^(.+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
          if (clientTimeMatch) {
            const [, clientName, startTime, endTime] = clientTimeMatch;
            
            try {
              const shift: OCRResult = {
                date: convertDateFormat(currentDate),
                startTime: normalizeTimeString(startTime),
                endTime: normalizeTimeString(endTime),
                clientName: clientName.trim(),
                location: serviceType.trim(),
                serviceType: serviceType.trim(),
                duration: parseFloat(quantity)
              };
              
              shifts.push(shift);
              console.log('Added Employee Timesheet shift:', shift);
              i++; // Skip the client+time line
            } catch (error) {
              console.log('Error parsing Employee Timesheet shift:', error);
            }
          }
        }
        continue;
      }
      
      // Alternative: Look for standalone client name + time pattern
      const clientTimeMatch = line.match(/^(.+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
      if (clientTimeMatch && currentDate) {
        const [, clientName, startTime, endTime] = clientTimeMatch;
        
        // Look backwards for the most recent service info
        let serviceType = 'Supported Living Day Shift';
        let quantity = 0;
        
        for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
          const prevLine = lines[j];
          const serviceMatch = prevLine.match(/^([A-Z0-9]+)\s+(.+?)\s+(\d+\.?\d*)$/);
          if (serviceMatch) {
            serviceType = serviceMatch[2].trim();
            quantity = parseFloat(serviceMatch[3]);
            break;
          }
        }
        
        try {
          const shift: OCRResult = {
            date: convertDateFormat(currentDate),
            startTime: normalizeTimeString(startTime),
            endTime: normalizeTimeString(endTime),
            clientName: clientName.trim(),
            location: serviceType,
            serviceType: serviceType,
            duration: quantity || calculateDurationFromTimes(startTime, endTime)
          };
          
          shifts.push(shift);
          console.log('Added alternative Employee Timesheet shift:', shift);
        } catch (error) {
          console.log('Error parsing alternative Employee Timesheet shift:', error);
        }
      }
    }
    
    console.log(`Employee Timesheet parser found ${shifts.length} shifts`);
    return shifts;
  };

  const calculateDurationFromTimes = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end < start) {
      // Handle overnight shifts
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
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