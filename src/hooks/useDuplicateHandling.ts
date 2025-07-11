import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DuplicateCheckResult, UpdateChoice, SaveSummary } from '@/types/duplicateHandling';
import { ShiftFormData } from '@/types/shift';
import { useClientProfiles } from './useClientProfiles';

export const useDuplicateHandling = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { findClientLocation } = useClientProfiles();

  const generateShiftKey = (date: string, startTime: string, endTime: string, clientName: string): string => {
    return `${date}_${startTime}_${endTime}_${clientName.toLowerCase().replace(/\s+/g, '_')}`;
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const checkForDuplicates = async (newShifts: ShiftFormData[]): Promise<DuplicateCheckResult[]> => {
    setIsProcessing(true);
    
    try {
      const results: DuplicateCheckResult[] = [];

      for (const newShift of newShifts) {
        const shiftKey = generateShiftKey(newShift.date, newShift.startTime, newShift.endTime, newShift.clientName);
        
        // Check if shift already exists
        const { data: existingShifts, error } = await supabase
          .from('shifts')
          .select('id, start_time, end_time, location')
          .eq('shift_key', shiftKey);

        if (error) {
          console.error('Error checking duplicates:', error);
          throw new Error('Failed to check for duplicates');
        }

        let status: DuplicateCheckResult['status'] = 'new';
        let existingShift = undefined;
        let conflicts = undefined;

        if (existingShifts && existingShifts.length > 0) {
          const existing = existingShifts[0];
          
          // Check if times match exactly
          if (existing.start_time === newShift.startTime && existing.end_time === newShift.endTime) {
            status = 'duplicate';
          } else {
            status = 'potential_update';
            conflicts = {
              startTime: existing.start_time !== newShift.startTime,
              endTime: existing.end_time !== newShift.endTime,
            };
          }
          
          existingShift = {
            id: existing.id,
            startTime: existing.start_time,
            endTime: existing.end_time,
            location: existing.location,
          };
        }

        // Check if location is needed
        if (!newShift.location) {
          const existingLocation = findClientLocation(newShift.clientName);
          if (!existingLocation) {
            status = 'needs_location';
          }
        }

        results.push({
          id: Math.random().toString(36).substr(2, 9),
          status,
          existingShift,
          newShift,
          conflicts,
        });
      }

      return results;
    } finally {
      setIsProcessing(false);
    }
  };

  const processShiftsWithChoices = async (
    duplicateResults: DuplicateCheckResult[],
    updateChoices: UpdateChoice[]
  ): Promise<SaveSummary> => {
    const mockUserId = '00000000-0000-0000-0000-000000000000';
    
    let newShifts = 0;
    let updatedShifts = 0;
    let skippedShifts = 0;
    let newHours = 0;
    let updatedHours = 0;
    let skippedHours = 0;

    const shiftsToInsert: any[] = [];
    const shiftsToUpdate: any[] = [];

    for (const result of duplicateResults) {
      const duration = calculateDuration(result.newShift.startTime, result.newShift.endTime);
      const earnings = duration * result.newShift.hourlyRate;

      if (result.status === 'new' || result.status === 'needs_location') {
        // New shift to insert
        shiftsToInsert.push({
          user_id: mockUserId,
          date: result.newShift.date,
          start_time: result.newShift.startTime,
          end_time: result.newShift.endTime,
          client_name: result.newShift.clientName,
          location: result.newShift.location,
          hourly_rate: result.newShift.hourlyRate,
          duration,
          earnings,
          is_paid: false,
          shift_key: generateShiftKey(result.newShift.date, result.newShift.startTime, result.newShift.endTime, result.newShift.clientName),
        });
        newShifts++;
        newHours += duration;
        
      } else if (result.status === 'duplicate') {
        // Skip duplicate
        skippedShifts++;
        skippedHours += duration;
        
      } else if (result.status === 'potential_update') {
        // Handle based on user choice
        const choice = updateChoices.find(c => c.shiftId === result.existingShift?.id);
        
        if (choice?.action === 'update' && result.existingShift) {
          shiftsToUpdate.push({
            id: result.existingShift.id,
            start_time: result.newShift.startTime,
            end_time: result.newShift.endTime,
            duration,
            earnings,
            location: result.newShift.location || result.existingShift.location,
          });
          updatedShifts++;
          updatedHours += duration;
          
        } else if (choice?.action === 'keep_both') {
          // Insert as new shift
          shiftsToInsert.push({
            user_id: mockUserId,
            date: result.newShift.date,
            start_time: result.newShift.startTime,
            end_time: result.newShift.endTime,
            client_name: result.newShift.clientName,
            location: result.newShift.location,
            hourly_rate: result.newShift.hourlyRate,
            duration,
            earnings,
            is_paid: false,
            shift_key: generateShiftKey(result.newShift.date, result.newShift.startTime, result.newShift.endTime, result.newShift.clientName) + '_' + Date.now(),
          });
          newShifts++;
          newHours += duration;
          
        } else {
          // Skip
          skippedShifts++;
          skippedHours += duration;
        }
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

    // Update existing shifts
    for (const updateData of shiftsToUpdate) {
      const { id, ...updates } = updateData;
      const { error: updateError } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw new Error(`Failed to update shift: ${updateError.message}`);
      }
    }

    const totalHours = newHours + updatedHours + skippedHours;

    return {
      newShifts,
      updatedShifts,
      skippedShifts,
      totalHours,
      newHours,
      updatedHours,
      skippedHours,
    };
  };

  return {
    checkForDuplicates,
    processShiftsWithChoices,
    isProcessing,
  };
};