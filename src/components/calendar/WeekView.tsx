import React, { useMemo } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday,
  addWeeks,
  subWeeks
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Day } from '@/types/day';
import { useDayManagement } from '@/hooks/useDayManagement';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { useShifts } from '@/hooks/useShifts';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick: (dayDate: string) => void;
  className?: string;
}

export function WeekView({ 
  selectedDate, 
  onDateChange, 
  onDayClick,
  className 
}: WeekViewProps) {
  const { user } = useMobileAuth();
  const { days, loading } = useDayManagement(user?.mobile_number);
  const { settings } = useShifts();

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const dayMap = useMemo(() => {
    const map = new Map<string, Day>();
    days.forEach(day => {
      map.set(day.day_date, day);
    });
    return map;
  }, [days]);

  const weekTotal = useMemo(() => {
    return weekDays.reduce((total, date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayData = dayMap.get(dateKey);
      return total + (dayData?.total_hours || 0);
    }, 0);
  }, [weekDays, dayMap]);

  const weekShifts = useMemo(() => {
    return weekDays.reduce((total, date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayData = dayMap.get(dateKey);
      return total + (dayData?.shift_count || 0);
    }, 0);
  }, [weekDays, dayMap]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subWeeks(selectedDate, 1)
      : addWeeks(selectedDate, 1);
    onDateChange(newDate);
  };

  const getDayData = (date: Date): Day | null => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return dayMap.get(dateKey) || null;
  };

  const getDayStatus = (date: Date) => {
    const dayData = getDayData(date);
    if (!dayData || dayData.shift_count === 0) return 'empty';
    if (dayData.has_conflicts) return 'conflict';
    if (dayData.has_unresolved) return 'unresolved';
    return 'ready';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'conflict':
        return 'border-l-destructive bg-destructive/5';
      case 'unresolved':
        return 'border-l-warning bg-warning/5';
      case 'ready':
        return 'border-l-success bg-success/5';
      default:
        return 'border-l-muted';
    }
  };

  const renderDayRow = (date: Date) => {
    const dayData = getDayData(date);
    const status = getDayStatus(date);
    const isTodayDate = isToday(date);
    const dateKey = format(date, 'yyyy-MM-dd');

    return (
      <div
        key={dateKey}
        className={cn(
          'flex items-center p-4 border-l-4 border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm',
          getStatusColor(status),
          isTodayDate && 'ring-2 ring-primary ring-offset-1'
        )}
        onClick={() => {
          onDateChange(date);
          if (dayData) {
            onDayClick(dateKey);
          }
        }}
      >
        {/* Date Info */}
        <div className="flex-shrink-0 w-24">
          <div className={cn(
            'font-semibold',
            isTodayDate && 'text-primary'
          )}>
            {format(date, 'EEE')}
          </div>
          <div className={cn(
            'text-sm text-muted-foreground',
            isTodayDate && 'text-primary font-medium'
          )}>
            {format(date, 'MMM d')}
          </div>
        </div>

        {/* Day Stats */}
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {dayData?.total_hours.toFixed(1) || '0.0'}h
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {dayData?.shift_count || 0} shift{dayData?.shift_count !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="text-muted-foreground">
            £{dayData ? (dayData.total_hours * settings.defaultHourlyRate).toFixed(0) : '0'}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex-shrink-0 flex gap-2">
          {dayData?.has_conflicts && (
            <Badge variant="destructive" className="text-xs">
              Conflicts
            </Badge>
          )}
          {dayData?.has_unresolved && (
            <Badge variant="secondary" className="text-xs">
              Issues
            </Badge>
          )}
          {dayData && !dayData.has_conflicts && !dayData.has_unresolved && dayData.shift_count > 0 && (
            <Badge variant="default" className="text-xs bg-success">
              Ready
            </Badge>
          )}
          {(!dayData || dayData.shift_count === 0) && (
            <Badge variant="outline" className="text-xs">
              No shifts
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Week of {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Week Summary */}
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>Total: {weekTotal.toFixed(1)} hours</span>
          <span>{weekShifts} shifts</span>
          <span>£{(weekTotal * settings.defaultHourlyRate).toFixed(0)} estimated</span>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {weekDays.map(renderDayRow)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}