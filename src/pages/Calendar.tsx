import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Clock, PoundSterling, MapPin } from 'lucide-react';
import { useShifts } from '@/hooks/useShifts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';

interface DayShift {
  id: string;
  clientName: string;
  startTime: string;
  endTime: string;
  duration: number;
  earnings: number;
  location?: string;
}

export default function Calendar() {
  const { shifts } = useShifts();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<DayShift[]>([]);

  const { calendarDays, monthShifts } = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    // Get shifts for current month
    const monthShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= start && shiftDate <= end;
    });

    // Group shifts by date
    const shiftsByDate = monthShifts.reduce((acc, shift) => {
      const dateKey = shift.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(shift);
      return acc;
    }, {} as Record<string, any[]>);

    // Create calendar days with shift data
    const calendarDays = days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayShifts = shiftsByDate[dateKey] || [];
      
      return {
        date: day,
        shifts: dayShifts,
        totalHours: dayShifts.reduce((sum, shift) => sum + shift.duration, 0),
        totalEarnings: dayShifts.reduce((sum, shift) => sum + shift.earnings, 0)
      };
    });

    return { calendarDays, monthShifts };
  }, [shifts, currentDate]);

  const handleDateClick = (day: any) => {
    setSelectedDate(day.date);
    setSelectedShifts(day.shifts);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getDateColor = (totalHours: number) => {
    if (totalHours === 0) return '';
    if (totalHours <= 4) return 'bg-blue-100 text-blue-900';
    if (totalHours <= 8) return 'bg-green-100 text-green-900';
    return 'bg-purple-100 text-purple-900';
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate stats for current month
  const monthStats = {
    totalHours: monthShifts.reduce((sum, shift) => sum + shift.duration, 0),
    totalEarnings: monthShifts.reduce((sum, shift) => sum + shift.earnings, 0),
    totalShifts: monthShifts.length,
    activeDays: new Set(monthShifts.map(shift => shift.date)).size
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shift Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Month Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{monthStats.totalHours.toFixed(1)}h</div>
            <div className="text-sm text-muted-foreground">Total Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">£{monthStats.totalEarnings.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Earnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{monthStats.totalShifts}</div>
            <div className="text-sm text-muted-foreground">Total Shifts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{monthStats.activeDays}</div>
            <div className="text-sm text-muted-foreground">Active Days</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map(day => (
              <div key={day} className="text-center font-medium text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: getDay(calendarDays[0]?.date) === 0 ? 6 : getDay(calendarDays[0]?.date) - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24"></div>
            ))}
            
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`h-24 border rounded-lg p-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                  getDateColor(day.totalHours)
                } ${isSameDay(day.date, new Date()) ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="text-sm font-medium">{format(day.date, 'd')}</div>
                {day.shifts.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {day.totalHours.toFixed(1)}h
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {day.shifts.slice(0, 2).map((shift, i) => (
                        <Badge key={i} variant="secondary" className="text-xs px-1">
                          {shift.clientName.split(' ')[0]}
                        </Badge>
                      ))}
                      {day.shifts.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1">
                          +{day.shifts.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 rounded"></div>
              <span>1-4 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span>5-8 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 rounded"></div>
              <span>9+ hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary rounded"></div>
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Details Modal */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Shifts for {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedShifts.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{selectedShifts.length}</div>
                  <div className="text-sm text-muted-foreground">Shifts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {selectedShifts.reduce((sum, shift) => sum + shift.duration, 0).toFixed(1)}h
                  </div>
                  <div className="text-sm text-muted-foreground">Hours</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    £{selectedShifts.reduce((sum, shift) => sum + shift.earnings, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Earnings</div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedShifts.map((shift, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{shift.clientName}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {shift.startTime} - {shift.endTime} ({shift.duration}h)
                            </div>
                            {shift.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {shift.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">£{shift.earnings.toFixed(2)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No shifts scheduled for this day
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}