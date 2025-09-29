import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DuplicateCheckResult, UpdateChoice, SaveSummary } from '@/types/duplicateHandling';
import { ShiftFormData } from '@/types/shift';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { parse, isAfter, isBefore, isEqual } from 'date-fns';

const TIMEZONE = 'Europe/London';

export const useConflictDetection = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse time in Europe/London timezone
  const parseTimeInTimezone = (dateStr: string, timeStr: string): Date => {
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    return toZonedTime(new Date(dateTimeStr), TIMEZONE);
  };

  // Calculate duration with minute precision
  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = parse(startTime, 'HH:mm', new Date());
    let end = parse(endTime, 'HH:mm', new Date());
    
    // Handle overnight shifts
    if (isBefore(end, start)) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  // Determine overlap type between two shifts
  const getOverlapType = (
    newStart: Date,
    newEnd: Date,
    existingStart: Date,
    existingEnd: Date
  ): 'exact' | 'partial' | 'contained' | 'contains' | null => {
    // No overlap
    if (!isAfter(newEnd, existingStart) || !isAfter(existingEnd, newStart)) {
      return null;
    }

    // Exact match
    if (isEqual(newStart, existingStart) && isEqual(newEnd, existingEnd)) {
      return 'exact';
    }

    // New shift contained within existing
    if (!isBefore(newStart, existingStart) && !isAfter(newEnd, existingEnd)) {
      return 'contained';
    }

    // New shift contains existing
    if (!isAfter(newStart, existingStart) && !isBefore(newEnd, existingEnd)) {
      return 'contains';
    }

    // Partial overlap
    return 'partial';
  };

  // Get current mobile number from session or context
  const getCurrentMobileNumber = (): string => {
    // This should be replaced with actual mobile number from authentication context
    return localStorage.getItem('currentMobileNumber') || '';
  };

  const checkForConflicts = async (newShifts: ShiftFormData[]): Promise<DuplicateCheckResult[]> => {
    setIsProcessing(true);
    
    try {
      const results: DuplicateCheckResult[] = [];
      const currentMobileNumber = getCurrentMobileNumber();

      for (const newShift of newShifts) {
        // Skip validation for invalid durations
        const duration = calculateDuration(newShift.startTime, newShift.endTime);
        if (duration <= 0) {
          continue;
        }

        // Query existing shifts for this user on the same date
        const { data: existingShifts, error } = await supabase
          .from('shifts')
          .select('id, start_time, end_time, client_name, mobile_number')
          .eq('date', newShift.date)
          .eq('mobile_number', currentMobileNumber);

        if (error) {
          console.error('Error checking conflicts:', error);
          throw new Error('Failed to check for time conflicts');
        }

        const newStart = parseTimeInTimezone(newShift.date, newShift.startTime);
        const newEnd = parseTimeInTimezone(newShift.date, newShift.endTime);

        // Handle overnight shifts
        if (isBefore(newEnd, newStart)) {
          newEnd.setDate(newEnd.getDate() + 1);
        }

        let status: DuplicateCheckResult['status'] = 'new';
        let overlapType: DuplicateCheckResult['overlapType'] = undefined;
        let conflictingShifts: DuplicateCheckResult['conflictingShifts'] = [];

        if (existingShifts && existingShifts.length > 0) {
          for (const existing of existingShifts) {
            const existingStart = parseTimeInTimezone(newShift.date, existing.start_time);
            let existingEnd = parseTimeInTimezone(newShift.date, existing.end_time);

            // Handle overnight shifts for existing
            if (isBefore(existingEnd, existingStart)) {
              existingEnd.setDate(existingEnd.getDate() + 1);
            }

            const overlap = getOverlapType(newStart, newEnd, existingStart, existingEnd);
            
            if (overlap) {
              status = overlap;
              overlapType = overlap;
              conflictingShifts.push({
                id: existing.id,
                startTime: existing.start_time,
                endTime: existing.end_time,
                clientName: existing.client_name,
              });

              // For exact matches, we only need the first one
              if (overlap === 'exact') {
                break;
              }
            }
          }
        }

        results.push({
          id: Math.random().toString(36).substr(2, 9),
          status,
          overlapType,
          newShift,
          conflictingShifts: conflictingShifts.length > 0 ? conflictingShifts : undefined,
          existingShift: conflictingShifts.length > 0 ? {
            id: conflictingShifts[0].id,
            startTime: conflictingShifts[0].startTime,
            endTime: conflictingShifts[0].endTime,
          } : undefined,
        });
      }

      return results;
    } finally {
      setIsProcessing(false);
    }
  };

  const processShiftsWithChoices = async (
    results: DuplicateCheckResult[],
    choices: UpdateChoice[]
  ): Promise<SaveSummary> => {
    const currentMobileNumber = getCurrentMobileNumber();
    const mockUserId = '00000000-0000-0000-0000-000000000000';
    
    let newShifts = 0;
    let replacedShifts = 0;
    let skippedShifts = 0;
    let splitShifts = 0;
    let newHours = 0;
    let replacedHours = 0;
    let skippedHours = 0;
    let splitHours = 0;

    const shiftsToInsert: any[] = [];
    const shiftsToDelete: string[] = [];
    
    for (const result of results) {
      const choice = choices.find(c => c.shiftId === result.id);
      const duration = calculateDuration(result.newShift.startTime, result.newShift.endTime);
      const earnings = duration * result.newShift.hourlyRate;

      if (result.status === 'new') {
        // No conflict - insert as new
        shiftsToInsert.push({
          user_id: mockUserId,
          mobile_number: currentMobileNumber,
          date: result.newShift.date,
          start_time: result.newShift.startTime,
          end_time: result.newShift.endTime,
          client_name: result.newShift.clientName,
          location: result.newShift.location,
          hourly_rate: result.newShift.hourlyRate,
          duration,
          earnings,
          is_paid: false,
          shift_key: `${result.newShift.date}_${result.newShift.startTime}_${result.newShift.endTime}_${result.newShift.clientName}`,
        });
        newShifts++;
        newHours += duration;

      } else if (choice?.action === 'replace' && result.conflictingShifts) {
        // Delete conflicting shifts and insert new one
        result.conflictingShifts.forEach(conflict => {
          shiftsToDelete.push(conflict.id);
        });
        
        shiftsToInsert.push({
          user_id: mockUserId,
          mobile_number: currentMobileNumber,
          date: result.newShift.date,
          start_time: result.newShift.startTime,
          end_time: result.newShift.endTime,
          client_name: result.newShift.clientName,
          location: result.newShift.location,
          hourly_rate: result.newShift.hourlyRate,
          duration,
          earnings,
          is_paid: false,
          shift_key: `${result.newShift.date}_${result.newShift.startTime}_${result.newShift.endTime}_${result.newShift.clientName}`,
        });
        replacedShifts++;
        replacedHours += duration;

      } else if (choice?.action === 'edit' && choice.editedShift) {
        // Use edited times
        const editedDuration = calculateDuration(choice.editedShift.startTime, choice.editedShift.endTime);
        const editedEarnings = editedDuration * result.newShift.hourlyRate;
        
        shiftsToInsert.push({
          user_id: mockUserId,
          mobile_number: currentMobileNumber,
          date: result.newShift.date,
          start_time: choice.editedShift.startTime,
          end_time: choice.editedShift.endTime,
          client_name: result.newShift.clientName,
          location: result.newShift.location,
          hourly_rate: result.newShift.hourlyRate,
          duration: editedDuration,
          earnings: editedEarnings,
          is_paid: false,
          shift_key: `${result.newShift.date}_${choice.editedShift.startTime}_${choice.editedShift.endTime}_${result.newShift.clientName}`,
        });
        newShifts++;
        newHours += editedDuration;

      } else if (choice?.action === 'split' && result.overlapType === 'partial') {
        // Auto-split logic for partial overlaps
        // This would need more sophisticated implementation based on specific overlap patterns
        splitShifts++;
        splitHours += duration;

      } else {
        // Skip
        skippedShifts++;
        skippedHours += duration;
      }
    }

    // Delete conflicting shifts first
    if (shiftsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .in('id', shiftsToDelete);

      if (deleteError) {
        throw new Error(`Failed to delete conflicting shifts: ${deleteError.message}`);
      }
    }

    // Insert new shifts
    if (shiftsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(shiftsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert shifts: ${insertError.message}`);
      }
    }

    const totalHours = newHours + replacedHours + skippedHours + splitHours;

    return {
      newShifts,
      replacedShifts,
      skippedShifts,
      splitShifts,
      totalHours,
      newHours,
      replacedHours,
      skippedHours,
      splitHours,
    };
  };

  return {
    checkForConflicts,
    processShiftsWithChoices,
    isProcessing,
  };
};