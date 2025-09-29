import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Day } from '@/types/day';
import { useDayManagement } from '@/hooks/useDayManagement';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { cn } from '@/lib/utils';

interface DayCalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick: (dayDate: string) => void;
  className?: string;
}

export function DayCalendarView({ 
  selectedDate, 
  onDateChange, 
  onDayClick,
  className 
}: DayCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const { user } = useMobileAuth();
  const { days, loading } = useDayManagement(user?.mobile_number);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dayMap = useMemo(() => {
    const map = new Map<string, Day>();
    days.forEach(day => {
      map.set(day.day_date, day);
    });
    return map;
  }, [days]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
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

  const getDayStatusColor = (status: string) => {
    switch (status) {
      case 'conflict':
        return 'bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20';
      case 'unresolved':
        return 'bg-warning/10 border-warning text-warning hover:bg-warning/20';
      case 'ready':
        return 'bg-success/10 border-success text-success hover:bg-success/20';
      default:
        return 'hover:bg-muted/50';
    }
  };

  const renderDayCell = (date: Date) => {
    const dayData = getDayData(date);
    const status = getDayStatus(date);
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isTodayDate = isToday(date);
    const dateKey = format(date, 'yyyy-MM-dd');

    return (
      <div
        key={dateKey}
        className={cn(
          'p-2 border rounded-lg transition-all duration-200 cursor-pointer min-h-[120px]',
          getDayStatusColor(status),
          !isCurrentMonth && 'opacity-50',
          isTodayDate && 'ring-2 ring-primary ring-offset-2',
          className
        )}
        onClick={() => {
          onDateChange(date);
          if (dayData) {
            onDayClick(dateKey);
          }
        }}
      >
        {/* Date number */}
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            'text-sm font-medium',
            isTodayDate && 'text-primary font-bold'
          )}>
            {format(date, 'd')}
          </span>
          {dayData && (
            <div className="flex gap-1">
              {dayData.has_conflicts && (
                <div className="w-2 h-2 bg-destructive rounded-full"></div>
              )}
              {dayData.has_unresolved && (
                <div className="w-2 h-2 bg-warning rounded-full"></div>
              )}
            </div>
          )}
        </div>

        {/* Day content */}
        {dayData ? (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {dayData.shift_count} shift{dayData.shift_count !== 1 ? 's' : ''}
            </div>
            <div className="text-xs font-medium">
              {dayData.total_hours.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">
              £{(dayData.total_hours * 25).toFixed(0)}
            </div>
            
            {/* Status badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {dayData.has_conflicts && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  Conflict
                </Badge>
              )}
              {dayData.has_unresolved && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Issues
                </Badge>
              )}
              {!dayData.has_conflicts && !dayData.has_unresolved && (
                <Badge variant="default" className="text-xs px-1 py-0 bg-success">
                  Ready
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Plus className="h-4 w-4" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month start */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }, (_, i) => (
                <div key={`empty-${i}`} className="h-[120px]"></div>
              ))}
              
              {/* Month days */}
              {monthDays.map(renderDayCell)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}