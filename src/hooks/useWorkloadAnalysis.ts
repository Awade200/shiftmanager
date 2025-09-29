import React from 'react';
import { WorkloadWarning } from '@/types/duplicateHandling';
import { ShiftFormData } from '@/types/shift';

export const useWorkloadAnalysis = () => {
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

  return {
    analyzeWorkload,
  };
};