import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DuplicateCheckResult, UpdateChoice, SaveSummary, WorkloadWarning } from '@/types/duplicateHandling';
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

  const analyzeWorkload = (shifts: ShiftFormData[]): WorkloadWarning[] => {
    const warnings: WorkloadWarning[] = [];
    const shiftsByDate = new Map<string, ShiftFormData[]>();
    
    // Group shifts by date
    shifts.forEach(shift => {
      if (!shiftsByDate.has(shift.date)) {
        shiftsByDate.set(shift.date, []);
      }
      shiftsByDate.get(shift.date)!.push(shift);
    });

    // Analyze each day
    shiftsByDate.forEach((dayShifts, date) => {
      const sortedShifts = dayShifts.sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      );

      let totalDayHours = 0;
      const shortShifts: string[] = [];
      const rapidTransitions: string[] = [];
      
      sortedShifts.forEach((shift, index) => {
        const duration = calculateDuration(shift.startTime, shift.endTime);
        totalDayHours += duration;
        
        // Check for short shifts (less than 1 hour)
        if (duration < 1) {
          shortShifts.push(`${shift.clientName} (${duration.toFixed(1)}h)`);
        }
        
        // Check for rapid client transitions (less than 15 mins between different clients)
        if (index > 0) {
          const prevShift = sortedShifts[index - 1];
          if (prevShift.clientName !== shift.clientName) {
            const prevEnd = new Date(`2000-01-01T${prevShift.endTime}:00`);
            const currentStart = new Date(`2000-01-01T${shift.startTime}:00`);
            const timeDiff = (currentStart.getTime() - prevEnd.getTime()) / (1000 * 60);
            
            if (timeDiff >= 0 && timeDiff < 15) {
              rapidTransitions.push(`${prevShift.clientName} → ${shift.clientName} (${timeDiff}min gap)`);
            }
          }
        }
      });

      // Generate warnings for this day
      if (shortShifts.length >= 3) {
        warnings.push({
          type: 'fragmented_schedule',
          severity: 'high',
          message: `${date}: ${shortShifts.length} very short shifts detected`,
          affectedShifts: shortShifts,
          suggestions: ['Consider combining consecutive shifts for the same client', 'Review if 30-minute shifts are practical']
        });
      } else if (shortShifts.length > 0) {
        warnings.push({
          type: 'short_shift',
          severity: shortShifts.length > 1 ? 'medium' : 'low',
          message: `${date}: ${shortShifts.length} short shift(s) under 1 hour`,
          affectedShifts: shortShifts,
          suggestions: ['Verify if travel time is accounted for', 'Consider minimum shift duration policies']
        });
      }

      if (rapidTransitions.length > 0) {
        warnings.push({
          type: 'rapid_transitions',
          severity: rapidTransitions.length > 2 ? 'high' : 'medium',
          message: `${date}: ${rapidTransitions.length} rapid client transitions with minimal travel time`,
          affectedShifts: rapidTransitions,
          suggestions: ['Add buffer time between different clients', 'Consider geographic proximity when scheduling']
        });
      }

      if (sortedShifts.length > 6) {
        warnings.push({
          type: 'intensive_day',
          severity: sortedShifts.length > 8 ? 'high' : 'medium',
          message: `${date}: ${sortedShifts.length} separate shifts in one day`,
          affectedShifts: sortedShifts.map(s => `${s.clientName} ${s.startTime}-${s.endTime}`),
          suggestions: ['Review feasibility of managing this many shifts', 'Consider consolidating similar clients/locations']
        });
      }

      if (totalDayHours > 12) {
        warnings.push({
          type: 'excessive_hours',
          severity: totalDayHours > 16 ? 'high' : 'medium',
          message: `${date}: ${totalDayHours.toFixed(1)} total hours scheduled`,
          affectedShifts: [`Total: ${totalDayHours.toFixed(1)} hours`],
          suggestions: ['Verify compliance with working time regulations', 'Ensure adequate rest periods']
        });
      }
    });

    return warnings;
  };

  const checkForDuplicates = async (newShifts: ShiftFormData[]): Promise<DuplicateCheckResult[]> => {
    setIsProcessing(true);
    
    try {
      const results: DuplicateCheckResult[] = [];
      const workloadWarnings = analyzeWorkload(newShifts);

      for (const newShift of newShifts) {
        const shiftKey = generateShiftKey(newShift.date, newShift.startTime, newShift.endTime, newShift.clientName);
        
        // Check for exact duplicates first
        const { data: exactDuplicates, error: exactError } = await supabase
          .from('shifts')
          .select('id, start_time, end_time, location, client_name')
          .eq('shift_key', shiftKey);

        if (exactError) {
          console.error('Error checking exact duplicates:', exactError);
          throw new Error('Failed to check for duplicates');
        }

        // Check for time conflicts on the same day
        const { data: conflictingShifts, error: conflictError } = await supabase
          .from('shifts')
          .select('id, start_time, end_time, location, client_name')
          .eq('date', newShift.date);

        if (conflictError) {
          console.error('Error checking time conflicts:', conflictError);
          throw new Error('Failed to check for time conflicts');
        }

        let status: DuplicateCheckResult['status'] = 'new';
        let existingShift = undefined;
        let conflicts = undefined;

        // Helper function to normalize time format (remove seconds if present)
        const normalizeTime = (time: string): string => {
          return time.length > 5 ? time.substring(0, 5) : time;
        };

        // Check for exact duplicates
        if (exactDuplicates && exactDuplicates.length > 0) {
          const existing = exactDuplicates[0];
          
          // Normalize times for comparison
          const existingStartNorm = normalizeTime(existing.start_time);
          const existingEndNorm = normalizeTime(existing.end_time);
          const newStartNorm = normalizeTime(newShift.startTime);
          const newEndNorm = normalizeTime(newShift.endTime);
          
          // Check if times match exactly
          if (existingStartNorm === newStartNorm && existingEndNorm === newEndNorm) {
            status = 'duplicate';
          } else {
            status = 'potential_update';
            conflicts = {
              startTime: existingStartNorm !== newStartNorm,
              endTime: existingEndNorm !== newEndNorm,
            };
          }
          
          existingShift = {
            id: existing.id,
            startTime: existing.start_time,
            endTime: existing.end_time,
            location: existing.location,
          };
        } else if (conflictingShifts && conflictingShifts.length > 0) {
          // Check for time overlaps
          const newStart = new Date(`2000-01-01T${newShift.startTime}:00`);
          const newEnd = new Date(`2000-01-01T${newShift.endTime}:00`);
          
          // Handle overnight shifts
          if (newEnd < newStart) {
            newEnd.setDate(newEnd.getDate() + 1);
          }

          for (const existing of conflictingShifts) {
            // Ensure existing times have seconds for Date parsing
            const existingStartTime = existing.start_time.length > 5 ? existing.start_time : existing.start_time + ':00';
            const existingEndTime = existing.end_time.length > 5 ? existing.end_time : existing.end_time + ':00';
            
            const existingStart = new Date(`2000-01-01T${existingStartTime}`);
            const existingEnd = new Date(`2000-01-01T${existingEndTime}`);
            
            // Handle overnight shifts for existing
            if (existingEnd < existingStart) {
              existingEnd.setDate(existingEnd.getDate() + 1);
            }

            // Check for overlap: new shift starts before existing ends AND new shift ends after existing starts
            const hasOverlap = newStart < existingEnd && newEnd > existingStart;
            
            if (hasOverlap) {
              status = 'potential_update';
              conflicts = {
                startTime: true,
                endTime: true,
              };
              
              existingShift = {
                id: existing.id,
                startTime: existing.start_time,
                endTime: existing.end_time,
                location: existing.location,
              };
              break; // Found a conflict, no need to check further
            }
          }
        }

        // Check if location is needed
        if (!newShift.location) {
          const existingLocation = findClientLocation(newShift.clientName);
          if (!existingLocation) {
            status = 'needs_location';
          }
        }

        // Add shift-specific workload warnings
        const shiftWarnings = workloadWarnings.filter(warning => 
          warning.affectedShifts.some(affected => 
            affected.includes(newShift.clientName) || 
            affected.includes(`${newShift.startTime}-${newShift.endTime}`)
          )
        );

        results.push({
          id: Math.random().toString(36).substr(2, 9),
          status,
          existingShift,
          newShift,
          conflicts,
          workloadWarnings: shiftWarnings.length > 0 ? shiftWarnings : undefined,
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
    
    // Collect all workload warnings
    const allWorkloadWarnings: WorkloadWarning[] = [];
    duplicateResults.forEach(result => {
      if (result.workloadWarnings) {
        allWorkloadWarnings.push(...result.workloadWarnings);
      }
    });

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
      workloadWarnings: allWorkloadWarnings,
    };
  };

  return {
    checkForDuplicates,
    processShiftsWithChoices,
    isProcessing,
  };
};