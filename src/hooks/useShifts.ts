import { useState, useEffect } from 'react';
import { Shift, ShiftFormData, ShiftStats } from '@/types/shift';

const STORAGE_KEY = 'shift-manager-data';
const SETTINGS_KEY = 'shift-manager-settings';

interface Settings {
  defaultHourlyRate: number;
}

const defaultSettings: Settings = {
  defaultHourlyRate: 12.00
};

export const useShifts = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedShifts = localStorage.getItem(STORAGE_KEY);
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      
      if (storedShifts) {
        setShifts(JSON.parse(storedShifts));
      }
      
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save shifts to localStorage whenever shifts change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
    }
  }, [shifts, loading]);

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, loading]);

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end < start) {
      // Handle overnight shifts
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const addShift = (shiftData: ShiftFormData): Shift => {
    const duration = calculateDuration(shiftData.startTime, shiftData.endTime);
    const earnings = duration * shiftData.hourlyRate;
    
    const newShift: Shift = {
      id: crypto.randomUUID(),
      ...shiftData,
      duration,
      earnings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setShifts(prev => [...prev, newShift]);
    return newShift;
  };

  const addMultipleShifts = (shiftsData: ShiftFormData[]): Shift[] => {
    const newShifts = shiftsData.map(shiftData => {
      const duration = calculateDuration(shiftData.startTime, shiftData.endTime);
      const earnings = duration * shiftData.hourlyRate;
      
      return {
        id: crypto.randomUUID(),
        ...shiftData,
        duration,
        earnings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    setShifts(prev => [...prev, ...newShifts]);
    return newShifts;
  };

  const updateShift = (id: string, updates: Partial<ShiftFormData>): boolean => {
    setShifts(prev => prev.map(shift => {
      if (shift.id === id) {
        const updatedShift = { ...shift, ...updates };
        
        // Recalculate duration and earnings if time or rate changed
        if (updates.startTime || updates.endTime || updates.hourlyRate) {
          updatedShift.duration = calculateDuration(
            updatedShift.startTime, 
            updatedShift.endTime
          );
          updatedShift.earnings = updatedShift.duration * updatedShift.hourlyRate;
        }
        
        updatedShift.updatedAt = new Date().toISOString();
        return updatedShift;
      }
      return shift;
    }));
    return true;
  };

  const deleteShift = (id: string): boolean => {
    setShifts(prev => prev.filter(shift => shift.id !== id));
    return true;
  };

  const markShiftAsPaid = (id: string): boolean => {
    return updateShift(id, { isPaid: true });
  };

  const getShiftStats = (): ShiftStats => {
    const totalHours = shifts.reduce((sum, shift) => sum + shift.duration, 0);
    const totalEarnings = shifts.reduce((sum, shift) => sum + shift.earnings, 0);
    const paidEarnings = shifts
      .filter(shift => shift.isPaid)
      .reduce((sum, shift) => sum + shift.earnings, 0);
    const unpaidEarnings = totalEarnings - paidEarnings;
    
    return {
      totalHours,
      totalEarnings,
      paidEarnings,
      unpaidEarnings,
      totalShifts: shifts.length,
      paidShifts: shifts.filter(shift => shift.isPaid).length,
      unpaidShifts: shifts.filter(shift => !shift.isPaid).length,
    };
  };

  const exportToCSV = (): string => {
    const headers = ['Date', 'Start Time', 'End Time', 'Client', 'Location', 'Hours', 'Hourly Rate', 'Earnings', 'Paid'];
    const rows = shifts.map(shift => [
      shift.date,
      shift.startTime,
      shift.endTime,
      shift.clientName,
      shift.location || '',
      shift.duration.toFixed(2),
      `£${shift.hourlyRate.toFixed(2)}`,
      `£${shift.earnings.toFixed(2)}`,
      shift.isPaid ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    shifts,
    settings,
    loading,
    addShift,
    addMultipleShifts,
    updateShift,
    deleteShift,
    markShiftAsPaid,
    getShiftStats,
    exportToCSV,
    updateSettings,
  };
};