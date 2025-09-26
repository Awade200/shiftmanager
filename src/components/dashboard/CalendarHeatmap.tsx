import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface DayData {
  date: Date;
  hours: number;
  earnings: number;
  shifts: Array<{
    id: string;
    client: string;
    location: string;
    timeRange: string;
    rate: number;
    status: 'paid' | 'unpaid' | 'pending';
  }>;
}

interface CalendarHeatmapProps {
  data: DayData[];
  onDayClick?: (day: DayData) => void;
}

export const CalendarHeatmap = ({ data, onDayClick }: CalendarHeatmapProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map for quick lookup
  const dayDataMap = new Map(
    data.map(day => [format(day.date, 'yyyy-MM-dd'), day])
  );

  const getIntensityClass = (hours: number) => {
    if (hours === 0) return 'bg-muted/30 hover:bg-muted/50';
    if (hours <= 4) return 'bg-primary/20 hover:bg-primary/30';
    if (hours <= 8) return 'bg-primary/40 hover:bg-primary/50';
    if (hours <= 12) return 'bg-primary/60 hover:bg-primary/70';
    return 'bg-primary/80 hover:bg-primary/90';
  };

  const maxHours = Math.max(...data.map(d => d.hours), 12);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <Card className="shadow-1 hover:shadow-2 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Work Intensity Heatmap
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="font-medium text-sm min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayData = dayDataMap.get(dayKey);
            const hours = dayData?.hours || 0;
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={dayKey}
                onClick={() => dayData && onDayClick?.(dayData)}
                className={cn(
                  "relative aspect-square p-1 rounded-md transition-all duration-200 border-2 border-transparent",
                  getIntensityClass(hours),
                  isToday && "ring-2 ring-primary ring-offset-2",
                  dayData && "cursor-pointer hover:scale-105 hover:shadow-lg",
                  !isSameMonth(day, currentMonth) && "opacity-30"
                )}
                disabled={!dayData}
              >
                <div className="text-xs font-medium text-foreground">
                  {format(day, 'd')}
                </div>
                {hours > 0 && (
                  <div className="absolute -bottom-1 -right-1">
                    <Badge 
                      variant="secondary" 
                      className="h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                    >
                      {hours}
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={cn(
                    "w-3 h-3 rounded-sm",
                    level === 0 && "bg-muted/30",
                    level === 1 && "bg-primary/20",
                    level === 2 && "bg-primary/40",
                    level === 3 && "bg-primary/60",
                    level === 4 && "bg-primary/80"
                  )}
                />
              ))}
            </div>
            <span>More</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Max: {maxHours}h
          </div>
        </div>
      </CardContent>
    </Card>
  );
};