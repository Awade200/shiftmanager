import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImportSession, ParsedDay, DayAction } from '@/types/day';
import { ShiftRow, parseRota } from '@/lib/shiftParser';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useDayManagement } from './useDayManagement';

const TIMEZONE = 'Europe/London';

export function useUploadSession(mobileNumber?: string) {
  const [currentSession, setCurrentSession] = useState<ImportSession | null>(null);
  const [parsedDays, setParsedDays] = useState<ParsedDay[]>([]);
  const [unresolvedShifts, setUnresolvedShifts] = useState<ShiftRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { getOrCreateDay, addShiftsToDay, replaceDayShifts, calculateDuration } = useDayManagement(mobileNumber);

  // Start new upload session
  const startUploadSession = async (mobileNumber: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('import_sessions')
        .insert({
          mobile_number: mobileNumber,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCurrentSession({
        ...data,
        session_data: data.session_data as Record<string, any> || {},
        status: data.status as 'active' | 'completed' | 'cancelled'
      });
      return data.id;
    } catch (err) {
      console.error('Error starting upload session:', err);
      throw err;
    }
  };

  // Parse uploaded text/data
  const parseUploadedData = async (
    text: string, 
    mobileNumber: string,
    sessionId?: string
  ): Promise<{ parsedDays: ParsedDay[]; unresolved: ShiftRow[] }> => {
    try {
      setIsProcessing(true);

      // Parse the raw text into shift rows
      const parseResult = parseRota(text, 'paste');
      const shiftRows = parseResult.shifts;
      
      const dayGroups: Record<string, ShiftRow[]> = {};
      const unresolved: ShiftRow[] = [];

      // Group shifts by date or mark as unresolved
      shiftRows.forEach(shift => {
        if (!shift.date || !shift.startTime || !shift.endTime || !shift.clientName) {
          unresolved.push({
            day: shift.day || '',
            date: shift.date || '',
            clientCode: shift.clientCode || '',
            clientName: shift.clientName || '',
            service: shift.service || '',
            startTime: shift.startTime || '',
            endTime: shift.endTime || '',
            hours: shift.hours || 0,
            hourlyRate: shift.hourlyRate,
            sourceType: shift.sourceType,
            rawLines: shift.rawLines || [],
            hoursCorrected: shift.hoursCorrected,
            needsLocation: shift.needsLocation
          });
          return;
        }

        try {
          // Convert to day key considering timezone
          const dayKey = getDayKey(shift.date);
          if (!dayGroups[dayKey]) {
            dayGroups[dayKey] = [];
          }
          dayGroups[dayKey].push({
            day: shift.day,
            date: shift.date,
            clientCode: shift.clientCode,
            clientName: shift.clientName,
            service: shift.service,
            startTime: shift.startTime,
            endTime: shift.endTime,
            hours: shift.hours,
            hourlyRate: shift.hourlyRate,
            sourceType: shift.sourceType,
            rawLines: shift.rawLines,
            hoursCorrected: shift.hoursCorrected,
            needsLocation: shift.needsLocation
          });
        } catch (err) {
          console.error('Error processing shift date:', err);
          unresolved.push({
            day: shift.day,
            date: shift.date,
            clientCode: shift.clientCode,
            clientName: shift.clientName,
            service: shift.service,
            startTime: shift.startTime,
            endTime: shift.endTime,
            hours: shift.hours,
            hourlyRate: shift.hourlyRate,
            sourceType: shift.sourceType,
            rawLines: shift.rawLines,
            hoursCorrected: shift.hoursCorrected,
            needsLocation: shift.needsLocation
          });
        }
      });

      // Convert groups to ParsedDay objects
      const days: ParsedDay[] = Object.entries(dayGroups).map(([date, shifts]) => {
        // Sort shifts by start time before creating ParsedDay
        const sortedShifts = shifts.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        console.log(`📅 Processing day ${date} with ${shifts.length} shifts:`, shifts);
        
        const dayShifts = sortedShifts.map(shift => {
          const isValid = validateShift(shift);
          console.log(`  ✓ Shift validation:`, {
            client: shift.clientName,
            start: shift.startTime,
            end: shift.endTime,
            valid: isValid,
            errors: isValid ? [] : getShiftErrors(shift)
          });
          
          return {
            id: crypto.randomUUID(),
            start_time: shift.startTime,
            end_time: shift.endTime,
            client_name: shift.clientName,
            location: '',
            status: isValid ? 'ready' as const : 'error' as const,
            errors: getShiftErrors(shift)
          };
        });

        const totalHours = dayShifts
          .filter(s => s.status === 'ready')
          .reduce((sum, shift) => {
            return sum + calculateDuration(shift.start_time, shift.end_time);
          }, 0);

        const hasConflicts = checkInternalConflicts(dayShifts);
        const hasUnresolved = dayShifts.some(s => s.status !== 'ready');

        return {
          date,
          shifts: dayShifts,
          total_hours: totalHours,
          has_conflicts: hasConflicts,
          has_unresolved: hasUnresolved
        };
      });

      setParsedDays(days);
      setUnresolvedShifts(unresolved);

      // Update session
      if (sessionId && currentSession) {
        await updateSession(sessionId, {
          days_found: days.length,
          session_data: { 
            parsed_days: days.length,
            unresolved_count: unresolved.length 
          }
        });
      }

      return { parsedDays: days, unresolved };
    } catch (err) {
      console.error('Error parsing uploaded data:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Process day actions (merge, replace, skip)
  const processDayActions = async (
    actions: DayAction[], 
    mobileNumber: string,
    sessionId: string
  ): Promise<{ saved: number; skipped: number; errors: string[] }> => {
    try {
      setIsProcessing(true);
      
      let savedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const action of actions) {
        try {
          if (action.type === 'skip') {
            skippedCount++;
            continue;
          }

          const dayId = await getOrCreateDay(action.day_date, mobileNumber);
          
          if (action.type === 'replace') {
            if (action.shifts && action.shifts.length > 0) {
              // Sort shifts by start time before saving
              const sortedShifts = [...action.shifts].sort((a, b) => 
                a.start_time.localeCompare(b.start_time)
              );
              await replaceDayShifts(dayId, sortedShifts.map(shift => ({
                date: action.day_date,
                startTime: shift.start_time,
                endTime: shift.end_time,
                clientName: shift.client_name,
                location: shift.location,
                hourlyRate: shift.hourly_rate || 25, // Default rate
                isPaid: shift.is_paid || false
              })));
              savedCount++;
            }
          } else if (action.type === 'merge') {
            console.log(`💾 Merging shifts for day ${action.day_date}:`, {
              shiftsCount: action.shifts?.length || 0,
              shifts: action.shifts
            });
            
            if (action.shifts && action.shifts.length > 0) {
              // Sort shifts by start time before saving
              const sortedShifts = [...action.shifts].sort((a, b) => 
                a.start_time.localeCompare(b.start_time)
              );
              
              const shiftsToSave = sortedShifts.map(shift => ({
                date: action.day_date,
                startTime: shift.start_time,
                endTime: shift.end_time,
                clientName: shift.client_name,
                location: shift.location,
                hourlyRate: shift.hourly_rate || 25, // Default rate
                isPaid: shift.is_paid || false
              }));
              
              console.log(`  → Saving ${shiftsToSave.length} shifts to day ${dayId}`);
              await addShiftsToDay(dayId, shiftsToSave);
              console.log(`  ✅ Saved successfully`);
              savedCount++;
            } else {
              console.log(`  ⚠️ No shifts to merge for ${action.day_date}`);
            }
          }
        } catch (err) {
          console.error(`Error processing day ${action.day_date}:`, err);
          errors.push(`Failed to process ${action.day_date}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Update session
      await updateSession(sessionId, {
        days_saved: savedCount,
        days_skipped: skippedCount,
        status: 'completed'
      });

      return { saved: savedCount, skipped: skippedCount, errors };
    } catch (err) {
      console.error('Error processing day actions:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Update session
  const updateSession = async (sessionId: string, updates: Partial<ImportSession>) => {
    try {
      const { error } = await supabase
        .from('import_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) {
        throw error;
      }

      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      console.error('Error updating session:', err);
      throw err;
    }
  };

  // Helper functions
  const getDayKey = (dateStr: string): string => {
    const date = parseISO(dateStr);
    const zonedDate = toZonedTime(date, TIMEZONE);
    return format(zonedDate, 'yyyy-MM-dd');
  };

  const validateShift = (shift: ShiftRow): boolean => {
    return !!(shift.date && shift.startTime && shift.endTime && shift.clientName);
  };

  const getShiftErrors = (shift: ShiftRow): string[] => {
    const errors: string[] = [];
    if (!shift.date) errors.push('Missing date');
    if (!shift.startTime) errors.push('Missing start time');
    if (!shift.endTime) errors.push('Missing end time');
    if (!shift.clientName) errors.push('Missing client name');
    return errors;
  };

  const checkInternalConflicts = (shifts: Array<{ start_time: string; end_time: string }>): boolean => {
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        if (shiftsOverlap(shifts[i], shifts[j])) {
          return true;
        }
      }
    }
    return false;
  };

  const shiftsOverlap = (
    shift1: { start_time: string; end_time: string },
    shift2: { start_time: string; end_time: string }
  ): boolean => {
    const start1 = new Date(`1970-01-01T${shift1.start_time}`);
    const end1 = new Date(`1970-01-01T${shift1.end_time}`);
    const start2 = new Date(`1970-01-01T${shift2.start_time}`);
    const end2 = new Date(`1970-01-01T${shift2.end_time}`);

    // Handle overnight shifts
    if (end1 <= start1) end1.setDate(end1.getDate() + 1);
    if (end2 <= start2) end2.setDate(end2.getDate() + 1);

    return start1 < end2 && start2 < end1;
  };

  // Clear session
  const clearSession = () => {
    setCurrentSession(null);
    setParsedDays([]);
    setUnresolvedShifts([]);
  };

  return {
    currentSession,
    parsedDays,
    unresolvedShifts,
    isProcessing,
    startUploadSession,
    parseUploadedData,
    processDayActions,
    updateSession,
    clearSession
  };
}