import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Day, DayWithShifts, DayShift, DayStats } from '@/types/day';
import { ShiftFormData } from '@/types/shift';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Europe/London';

export function useDayManagement(mobileNumber?: string) {
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load days from database
  const loadDays = async (dateRange?: { from: Date; to: Date }) => {
    try {
      setLoading(true);
      setError(null);

      if (!mobileNumber) {
        console.log('No mobile number, skipping load');
        setDays([]);
        setLoading(false);
        return;
      }

      console.log('Loading days for mobile:', mobileNumber);
      
      let query = supabase
        .from('days')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .order('day_date', { ascending: false });

      if (dateRange) {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd');
        const toDate = format(dateRange.to, 'yyyy-MM-dd');
        query = query.gte('day_date', fromDate).lte('day_date', toDate);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setDays(data || []);
    } catch (err) {
      console.error('Error loading days:', err);
      setError(err instanceof Error ? err.message : 'Failed to load days');
    } finally {
      setLoading(false);
    }
  };

  // Get day with shifts
  const getDayWithShifts = async (dayDate: string): Promise<DayWithShifts | null> => {
    try {
      if (!mobileNumber) return null;

      let query = supabase
        .from('days')
        .select('*')
        .eq('day_date', dayDate)
        .eq('mobile_number', mobileNumber);

      const { data: dayData, error: dayError } = await query.maybeSingle();

      if (dayError) {
        throw dayError;
      }

      if (!dayData) {
        return null;
      }

      let shiftsQuery = supabase
        .from('shifts')
        .select('*')
        .eq('day_id', dayData.id)
        .eq('mobile_number', mobileNumber)
        .order('start_time');

      const { data: shiftsData, error: shiftsError } = await shiftsQuery;

      if (shiftsError) {
        throw shiftsError;
      }

      return {
        ...dayData,
        shifts: (shiftsData || []).map(shift => ({
          ...shift,
          status: shift.status as 'ready' | 'unresolved' | 'error' | 'conflict'
        }))
      };
    } catch (err) {
      console.error('Error getting day with shifts:', err);
      return null;
    }
  };

  // Create or get day
  const getOrCreateDay = async (dayDate: string, mobileNumber: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_day', {
          p_mobile_number: mobileNumber,
          p_day_date: dayDate
        });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error getting or creating day:', err);
      throw err;
    }
  };

  // Add shifts to a day
  const addShiftsToDay = async (dayId: string, shifts: ShiftFormData[]): Promise<DayShift[]> => {
    try {
      console.log(`🔄 addShiftsToDay called:`, {
        dayId,
        shiftsCount: shifts.length,
        shifts
      });
      
      const shiftsToInsert = shifts.map(shift => ({
        day_id: dayId,
        user_id: crypto.randomUUID(), // Temporary user_id
        date: shift.date,
        start_time: shift.startTime,
        end_time: shift.endTime,
        client_name: shift.clientName,
        location: shift.location || '',
        hourly_rate: shift.hourlyRate,
        duration: calculateDuration(shift.startTime, shift.endTime),
        earnings: calculateDuration(shift.startTime, shift.endTime) * shift.hourlyRate,
        is_paid: shift.isPaid,
        status: 'ready',
        shift_key: `${shift.date}_${shift.startTime}_${shift.endTime}_${shift.clientName}`,
        mobile_number: mobileNumber
      }));

      console.log(`📤 Inserting ${shiftsToInsert.length} shifts:`, shiftsToInsert);
      
      const { data, error } = await supabase
        .from('shifts')
        .insert(shiftsToInsert)
        .select();

      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }
      
      console.log(`✅ Insert successful, received ${data?.length || 0} shifts back:`, data);

      return (data || []).map(shift => ({
        ...shift,
        status: shift.status as 'ready' | 'unresolved' | 'error' | 'conflict'
      }));
    } catch (err) {
      console.error('Error adding shifts to day:', err);
      throw err;
    }
  };

  // Replace day shifts
  const replaceDayShifts = async (dayId: string, shifts: ShiftFormData[]): Promise<DayShift[]> => {
    try {
      // Delete existing shifts for the day
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('day_id', dayId);

      if (deleteError) {
        throw deleteError;
      }

      // Add new shifts
      return await addShiftsToDay(dayId, shifts);
    } catch (err) {
      console.error('Error replacing day shifts:', err);
      throw err;
    }
  };

  // Delete day
  const deleteDay = async (dayId: string): Promise<boolean> => {
    try {
      if (!mobileNumber) return false;

      let query = supabase
        .from('days')
        .delete()
        .eq('id', dayId)
        .eq('mobile_number', mobileNumber);

      const { error } = await query;

      if (error) {
        throw error;
      }

      // Update local state
      setDays(prev => prev.filter(day => day.id !== dayId));
      return true;
    } catch (err) {
      console.error('Error deleting day:', err);
      return false;
    }
  };

  // Delete all days for current account
  const deleteAllDays = async (): Promise<boolean> => {
    try {
      if (!mobileNumber) return false;

      console.log('Deleting all data for mobile:', mobileNumber);

      // First delete all shifts to avoid foreign key issues
      let shiftsQuery = supabase
        .from('shifts')
        .delete()
        .eq('mobile_number', mobileNumber);

      const { error: shiftsError } = await shiftsQuery;

      if (shiftsError) {
        console.error('Error deleting shifts:', shiftsError);
        return false;
      }

      // Then delete all days
      let daysQuery = supabase
        .from('days')
        .delete()
        .eq('mobile_number', mobileNumber);

      const { error: daysError } = await daysQuery;

      if (daysError) {
        console.error('Error deleting days:', daysError);
        return false;
      }

      // Clear local state
      setDays([]);
      return true;
    } catch (error) {
      console.error('Error deleting all data:', error);
      return false;
    }
  };

  // Calculate day statistics
  const calculateDayStats = (daysData: Day[]): DayStats => {
    const stats: DayStats = {
      total_days: daysData.length,
      total_hours: 0,
      total_earnings: 0,
      days_with_conflicts: 0,
      days_with_unresolved: 0,
      most_productive_day: null
    };

    let maxHours = 0;
    let mostProductiveDate = '';

    daysData.forEach(day => {
      stats.total_hours += day.total_hours;
      
      if (day.has_conflicts) {
        stats.days_with_conflicts++;
      }
      
      if (day.has_unresolved) {
        stats.days_with_unresolved++;
      }

      if (day.total_hours > maxHours) {
        maxHours = day.total_hours;
        mostProductiveDate = day.day_date;
      }
    });

    stats.most_productive_day = mostProductiveDate || null;
    return stats;
  };

  // Get days for a specific date range
  const getDaysInRange = (from: Date, to: Date): Day[] => {
    return days.filter(day => {
      const dayDate = parseISO(day.day_date);
      return isWithinInterval(dayDate, { start: startOfDay(from), end: endOfDay(to) });
    });
  };

  // Convert date to day key (considering timezone)
  const getDay = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const zonedDate = toZonedTime(dateObj, TIMEZONE);
    return format(zonedDate, 'yyyy-MM-dd');
  };

  // Helper function to calculate duration
  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    // Handle overnight shifts
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  // Load days on mount and when mobileNumber changes
  useEffect(() => {
    if (mobileNumber) {
      loadDays();
    }
  }, [mobileNumber]);

  const dayStats = useMemo(() => calculateDayStats(days), [days]);

  return {
    days,
    loading,
    error,
    dayStats,
    loadDays,
    getDayWithShifts,
    getOrCreateDay,
    addShiftsToDay,
    replaceDayShifts,
    deleteDay,
    deleteAllDays,
    getDaysInRange,
    getDay,
    calculateDuration
  };
}