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
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            setProgress(Math.round(info.progress * 100));
          }
        },
      });

      const text = result.data.text;
      const shifts = parseShiftText(text);
      
      return shifts;
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    } finally {
      setLoading(false);
      setProgress(0);
    }
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