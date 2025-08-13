import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shift, ShiftFormData, ShiftStats } from '@/types/shift';
import { useMobileAuth } from './useMobileAuth';

const SETTINGS_KEY = 'shift-manager-settings';

interface Settings {
  defaultHourlyRate: number;
  autoSaveClientLocations: boolean;
  useAnonymization: boolean;
}

const defaultSettings: Settings = {
  defaultHourlyRate: 12.21,
  autoSaveClientLocations: true,
  useAnonymization: false,
};

export const useShifts = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useMobileAuth();

  // Load shifts from Supabase on mount
  useEffect(() => {
    if (user?.mobile_number) {
      loadShifts();
    }
    loadSettings();
  }, [user?.mobile_number]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('mobile_number', user?.mobile_number)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading shifts:', error);
        return;
      }

      // Transform database data to match Shift interface
      const transformedShifts: Shift[] = (data || []).map(shift => ({
        id: shift.id,
        date: shift.date,
        startTime: shift.start_time,
        endTime: shift.end_time,
        clientName: shift.client_name,
        location: shift.location,
        hourlyRate: Number(shift.hourly_rate),
        duration: Number(shift.duration),
        earnings: Number(shift.earnings),
        isPaid: shift.is_paid,
        createdAt: shift.created_at,
        updatedAt: shift.updated_at,
      }));

      setShifts(transformedShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end < start) {
      // Handle overnight shifts
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const generateShiftKey = (date: string, clientName: string): string => {
    return `${date}_${clientName.toLowerCase().replace(/\s+/g, '_')}`;
  };

  const addShift = async (shiftData: ShiftFormData): Promise<Shift> => {
    if (!user?.mobile_number) {
      throw new Error('User must be logged in to add shifts');
    }

    const duration = calculateDuration(shiftData.startTime, shiftData.endTime);
    const earnings = duration * shiftData.hourlyRate;

    const shiftToInsert = {
      user_id: '00000000-0000-0000-0000-000000000000', // Keep for schema compatibility
      mobile_number: user.mobile_number,
      date: shiftData.date,
      start_time: shiftData.startTime,
      end_time: shiftData.endTime,
      client_name: shiftData.clientName,
      location: shiftData.location,
      hourly_rate: shiftData.hourlyRate,
      duration,
      earnings,
      is_paid: shiftData.isPaid,
      shift_key: generateShiftKey(shiftData.date, shiftData.clientName),
    };

    const { data, error } = await supabase
      .from('shifts')
      .insert([shiftToInsert])
      .select()
      .single();

    if (error) {
      console.error('Error adding shift:', error);
      throw new Error('Failed to add shift');
    }

    const newShift: Shift = {
      id: data.id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      clientName: data.client_name,
      location: data.location,
      hourlyRate: Number(data.hourly_rate),
      duration: Number(data.duration),
      earnings: Number(data.earnings),
      isPaid: data.is_paid,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Update local state
    setShifts(prev => [newShift, ...prev]);
    return newShift;
  };

  const addMultipleShifts = async (shiftsData: ShiftFormData[]): Promise<Shift[]> => {
    if (!user?.mobile_number) {
      throw new Error('User must be logged in to add shifts');
    }

    console.log('🚀 addMultipleShifts called with data:', shiftsData);

    const shiftsToInsert = shiftsData.map((shiftData, index) => {
      console.log(`📝 Processing shift ${index + 1}:`, shiftData);
      
      const duration = calculateDuration(shiftData.startTime, shiftData.endTime);
      const earnings = duration * shiftData.hourlyRate;
      
      const insertData = {
        user_id: '00000000-0000-0000-0000-000000000000', // Keep for schema compatibility
        mobile_number: user.mobile_number,
        date: shiftData.date,
        start_time: shiftData.startTime,
        end_time: shiftData.endTime,
        client_name: shiftData.clientName,
        location: shiftData.location,
        hourly_rate: shiftData.hourlyRate,
        duration,
        earnings,
        is_paid: shiftData.isPaid,
        shift_key: generateShiftKey(shiftData.date, shiftData.clientName),
      };
      
      console.log(`✅ Prepared insert data for shift ${index + 1}:`, insertData);
      return insertData;
    });

    console.log('📊 Final shifts to insert:', shiftsToInsert);

    try {
      console.log('🔄 Sending INSERT request to Supabase...');
      const { data, error } = await supabase
        .from('shifts')
        .insert(shiftsToInsert)
        .select();

      console.log('📥 Supabase response - data:', data);
      console.log('📥 Supabase response - error:', error);

      if (error) {
        console.error('❌ Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error('❌ No data returned from insert operation');
        throw new Error('No data returned from database insert');
      }

      console.log(`✅ Successfully inserted ${data.length} shifts`);

      const newShifts: Shift[] = data.map((shift, index) => {
        console.log(`🔄 Transforming shift ${index + 1} from DB format:`, shift);
        
        const transformedShift = {
          id: shift.id,
          date: shift.date,
          startTime: shift.start_time,
          endTime: shift.end_time,
          clientName: shift.client_name,
          location: shift.location,
          hourlyRate: Number(shift.hourly_rate),
          duration: Number(shift.duration),
          earnings: Number(shift.earnings),
          isPaid: shift.is_paid,
          createdAt: shift.created_at,
          updatedAt: shift.updated_at,
        };
        
        console.log(`✅ Transformed shift ${index + 1}:`, transformedShift);
        return transformedShift;
      });

      console.log('📊 All transformed shifts:', newShifts);

      // Update local state
      console.log('🔄 Updating local state...');
      setShifts(prev => {
        const updatedShifts = [...newShifts, ...prev];
        console.log('✅ Local state updated, new total:', updatedShifts.length);
        return updatedShifts;
      });
      
      console.log('🎉 addMultipleShifts completed successfully');
      return newShifts;
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      throw dbError;
    }
  };

  const updateShift = async (id: string, updates: Partial<ShiftFormData>): Promise<boolean> => {
    const updatedData: any = { ...updates };
    
    // Convert field names to database format
    if (updates.startTime) updatedData.start_time = updates.startTime;
    if (updates.endTime) updatedData.end_time = updates.endTime;
    if (updates.clientName) updatedData.client_name = updates.clientName;
    if (updates.hourlyRate !== undefined) updatedData.hourly_rate = updates.hourlyRate;
    if (updates.isPaid !== undefined) updatedData.is_paid = updates.isPaid;

    // Recalculate duration and earnings if time or rate changed
    if (updates.startTime || updates.endTime || updates.hourlyRate) {
      const currentShift = shifts.find(s => s.id === id);
      if (currentShift) {
        const startTime = updates.startTime || currentShift.startTime;
        const endTime = updates.endTime || currentShift.endTime;
        const hourlyRate = updates.hourlyRate || currentShift.hourlyRate;
        
        const duration = calculateDuration(startTime, endTime);
        const earnings = duration * hourlyRate;
        
        updatedData.duration = duration;
        updatedData.earnings = earnings;
      }
    }

    // Remove frontend field names
    delete updatedData.startTime;
    delete updatedData.endTime;
    delete updatedData.clientName;
    delete updatedData.hourlyRate;
    delete updatedData.isPaid;

    const { error } = await supabase
      .from('shifts')
      .update(updatedData)
      .eq('id', id);

    if (error) {
      console.error('Error updating shift:', error);
      return false;
    }

    // Update local state
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

  const deleteShift = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shift:', error);
      return false;
    }

    // Update local state
    setShifts(prev => prev.filter(shift => shift.id !== id));
    return true;
  };

  const markShiftAsPaid = async (id: string): Promise<boolean> => {
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

  const updateAllShiftsHourlyRate = async (newRate: number): Promise<boolean> => {
    if (!user?.mobile_number) {
      throw new Error('User must be logged in to update shifts');
    }

    try {
      // Update each shift individually with proper recalculation
      const updatePromises = shifts.map(shift => {
        const newEarnings = shift.duration * newRate;
        return supabase
          .from('shifts')
          .update({ 
            hourly_rate: newRate,
            earnings: newEarnings
          })
          .eq('id', shift.id);
      });

      const results = await Promise.all(updatePromises);
      const hasErrors = results.some(result => result.error);
      
      if (hasErrors) {
        console.error('Some shifts failed to update');
        const errorDetails = results.filter(result => result.error).map(result => result.error);
        console.error('Error details:', errorDetails);
        return false;
      }

      // Update local state
      setShifts(prev => prev.map(shift => ({
        ...shift,
        hourlyRate: newRate,
        earnings: shift.duration * newRate,
        updatedAt: new Date().toISOString()
      })));

      console.log(`✅ Successfully updated ${shifts.length} shifts to £${newRate}/hour`);
      return true;
    } catch (error) {
      console.error('Error updating all shifts hourly rate:', error);
      return false;
    }
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
    updateAllShiftsHourlyRate,
  };
};