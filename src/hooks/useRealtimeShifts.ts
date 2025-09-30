import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  earnings: number;
  hourly_rate: number;
  client_name: string;
  location?: string;
  status: 'ready' | 'unresolved' | 'error' | 'conflict';
  mobile_number: string;
}

interface DayData {
  date: string;
  hours: number;
  shiftCount: number;
  hasConflicts: boolean;
  hasUnresolved: boolean;
  shifts: Shift[];
}

export const useRealtimeShifts = (mobileNumber?: string, centerDate: Date = new Date()) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = useMemo(() => startOfWeek(centerDate, { weekStartsOn: 1 }), [centerDate]);
  const weekEnd = useMemo(() => endOfWeek(centerDate, { weekStartsOn: 1 }), [centerDate]);

  // Initial load
  useEffect(() => {
    if (!mobileNumber) {
      setLoading(false);
      return;
    }

    const loadShifts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (!error && data) {
        setShifts(data.map(shift => ({
          ...shift,
          duration: Number(shift.duration) || 0,
          earnings: Number(shift.earnings) || 0,
          hourly_rate: Number(shift.hourly_rate) || 0,
          status: shift.status as 'ready' | 'unresolved' | 'error' | 'conflict'
        })));
      }
      setLoading(false);
    };

    loadShifts();
  }, [mobileNumber, weekStart, weekEnd]);

  // Real-time subscription
  useEffect(() => {
    if (!mobileNumber) return;

    const channel = supabase
      .channel(`shifts:${mobileNumber}:${format(weekStart, 'yyyy-MM-dd')}-${format(weekEnd, 'yyyy-MM-dd')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: `mobile_number=eq.${mobileNumber}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newShift = payload.new as Shift;
            const shiftDate = parseISO(newShift.date);
            if (shiftDate >= weekStart && shiftDate <= weekEnd) {
              setShifts(prev => [...prev, {
                ...newShift,
                duration: Number(newShift.duration) || 0,
                earnings: Number(newShift.earnings) || 0,
                hourly_rate: Number(newShift.hourly_rate) || 0,
              }].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedShift = payload.new as Shift;
            setShifts(prev => prev.map(s => s.id === updatedShift.id ? {
              ...updatedShift,
              duration: Number(updatedShift.duration) || 0,
              earnings: Number(updatedShift.earnings) || 0,
              hourly_rate: Number(updatedShift.hourly_rate) || 0,
            } : s));
          } else if (payload.eventType === 'DELETE') {
            setShifts(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mobileNumber, weekStart, weekEnd]);

  // Compute today's shifts
  const todayShifts = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return shifts.filter(s => s.date === today);
  }, [shifts]);

  // Compute week days
  const weekDays = useMemo(() => {
    const days: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = shifts.filter(s => s.date === dateStr);
      
      days.push({
        date: dateStr,
        hours: dayShifts.reduce((sum, s) => sum + s.duration, 0),
        shiftCount: dayShifts.length,
        hasConflicts: dayShifts.some(s => s.status === 'conflict'),
        hasUnresolved: dayShifts.some(s => s.status === 'unresolved'),
        shifts: dayShifts
      });
    }
    return days;
  }, [shifts, weekStart]);

  // Compute conflicts (this week only)
  const conflicts = useMemo(() => 
    shifts.filter(s => s.status === 'conflict'),
    [shifts]
  );

  // Compute unresolved
  const unresolved = useMemo(() => 
    shifts.filter(s => s.status === 'unresolved'),
    [shifts]
  );

  // Today stats
  const todayStats = useMemo(() => ({
    hours: todayShifts.reduce((sum, s) => sum + s.duration, 0),
    shiftCount: todayShifts.length,
    earnings: todayShifts.reduce((sum, s) => sum + s.earnings, 0),
    hasConflicts: todayShifts.some(s => s.status === 'conflict'),
  }), [todayShifts]);

  // Week stats
  const weekStats = useMemo(() => ({
    hours: shifts.reduce((sum, s) => sum + s.duration, 0),
    shiftCount: shifts.length,
    earnings: shifts.reduce((sum, s) => sum + s.earnings, 0),
    conflictCount: conflicts.length,
  }), [shifts, conflicts]);

  return {
    shifts,
    todayShifts,
    weekDays,
    conflicts,
    unresolved,
    todayStats,
    weekStats,
    loading
  };
};
