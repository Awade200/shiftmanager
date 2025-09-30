import { format, isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DayData {
  date: string;
  hours: number;
  shiftCount: number;
  hasConflicts: boolean;
  hasUnresolved: boolean;
  shifts: any[];
}

interface WeekTilesViewProps {
  weekDays: DayData[];
  activeDate: Date;
  onSelectDate: (date: Date) => void;
  onNavigateWeek?: (direction: 'prev' | 'next') => void;
}

export const WeekTilesView = ({ weekDays, activeDate, onSelectDate, onNavigateWeek }: WeekTilesViewProps) => {
  const today = new Date();

  const getStatusIndicator = (day: DayData) => {
    if (day.shiftCount === 0) return null;
    if (day.hasConflicts) return '🔴';
    if (day.hasUnresolved) return '🔸';
    return '✓';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">This Week</h3>
        {onNavigateWeek && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onNavigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onNavigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayDate = new Date(day.date);
          const isActive = isSameDay(dayDate, activeDate);
          const isToday = isSameDay(dayDate, today);

          return (
            <Card
              key={day.date}
              className={`p-3 cursor-pointer transition-all hover:shadow-2 ${
                isActive ? 'ring-2 ring-primary' : ''
              } ${isToday ? 'bg-primary/5' : ''}`}
              onClick={() => onSelectDate(dayDate)}
            >
              <div className="text-center space-y-1">
                <div className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {format(dayDate, 'EEE')}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {format(dayDate, 'd')}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '—'}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs">
                  {day.shiftCount > 0 && (
                    <>
                      <span className="text-muted-foreground">{day.shiftCount}</span>
                      <span>{getStatusIndicator(day)}</span>
                    </>
                  )}
                  {day.shiftCount === 0 && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground flex items-center justify-center gap-3">
        <span>🔴 conflict</span>
        <span>🔸 unresolved</span>
        <span>✓ ready</span>
      </div>
    </div>
  );
};
