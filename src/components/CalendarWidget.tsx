import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDayManagement } from '@/hooks/useDayManagement';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { DayShift } from '@/types/day';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';

export default function CalendarWidget() {
  const { user } = useMobileAuth();
  const { days, getDayWithShifts } = useDayManagement(user?.mobile_number);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<DayShift[]>([]);

  // Move useMemo BEFORE any conditional returns to follow Rules of Hooks
  const { calendarDays, monthStats } = useMemo(() => {
    // Add safety check for days
    if (!days || !Array.isArray(days)) {
      return {
        calendarDays: [],
        monthStats: { totalHours: 0, totalEarnings: 0, totalShifts: 0, activeDays: 0 }
      };
    }

    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({ start, end });
    
    // Get days for current month
    const monthDays = days.filter(day => {
      const dayDate = new Date(day.day_date);
      return dayDate >= start && dayDate <= end;
    });

    // Create a map for quick lookup
    const daysByDate = monthDays.reduce((acc, day) => {
      acc[day.day_date] = day;
      return acc;
    }, {} as Record<string, any>);

    // Create calendar days with day data
    const mappedCalendarDays = calendarDays.map(calendarDay => {
      const dateKey = format(calendarDay, 'yyyy-MM-dd');
      const dayData = daysByDate[dateKey];
      
      return {
        date: calendarDay,
        shifts: [], // Will be populated on click
        totalHours: dayData?.total_hours || 0,
        totalEarnings: dayData?.total_hours * 15 || 0, // Estimate based on default rate
        dayData
      };
    });

    // Calculate stats for current month
    const monthStats = {
      totalHours: monthDays.reduce((sum, day) => sum + (day.total_hours || 0), 0),
      totalEarnings: monthDays.reduce((sum, day) => sum + ((day.total_hours || 0) * 15), 0), // Estimate
      totalShifts: monthDays.reduce((sum, day) => sum + (day.shift_count || 0), 0),
      activeDays: monthDays.length
    };

    return { calendarDays: mappedCalendarDays, monthStats };
  }, [days, currentDate]);

  // NOW check for empty state AFTER all hooks
  if (!days || !Array.isArray(days) || days.length === 0) {
    return (
      <Card className="shadow-card border-dashed border-2">
        <CardContent className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No shifts recorded yet</h3>
          <p className="text-muted-foreground mb-4">Start by uploading shifts or adding them manually</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild>
              <Link to="/upload">Upload Shifts</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDateClick = async (day: any) => {
    setSelectedDate(day.date);
    if (day.dayData) {
      // Get detailed day with shifts
      const dayWithShifts = await getDayWithShifts(day.dayData.day_date);
      setSelectedShifts(dayWithShifts?.shifts || []);
    } else {
      setSelectedShifts([]);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getDateColor = (totalHours: number) => {
    if (totalHours === 0) return '';
    if (totalHours <= 4) return 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300';
    if (totalHours <= 8) return 'bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-300';
    return 'bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-300';
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Month Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{monthStats.totalHours.toFixed(1)}h</div>
            <div className="text-sm text-muted-foreground">Month Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">£{monthStats.totalEarnings.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Month Earnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{monthStats.totalShifts}</div>
            <div className="text-sm text-muted-foreground">Month Shifts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{monthStats.activeDays}</div>
            <div className="text-sm text-muted-foreground">Active Days</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Shift Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-medium min-w-[150px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
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
              <div key={`empty-${i}`} className="h-20"></div>
            ))}
            
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`h-20 border rounded-lg p-2 cursor-pointer transition-colors hover:bg-muted/50 ${
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
                       {day.shifts.slice(0, 1).map((shift, i) => (
                         <Badge key={i} variant="secondary" className="text-xs px-1">
                           {shift.client_name?.split(' ')[0] || 'Shift'}
                         </Badge>
                       ))}
                      {day.shifts.length > 1 && (
                        <Badge variant="outline" className="text-xs px-1">
                          +{day.shifts.length - 1}
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
              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/20 rounded"></div>
              <span>1-4 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 rounded"></div>
              <span>5-8 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/20 rounded"></div>
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
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
          {/* Fixed Header */}
          <DialogHeader className="px-6 py-4 border-b bg-card shrink-0">
            <DialogTitle className="text-xl font-semibold">
              Shifts for {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {selectedShifts.length > 0 ? (
              <div className="h-full flex flex-col min-h-0">
                {/* Summary Stats - Fixed */}
                <div className="px-6 py-4 border-b bg-muted/30 shrink-0">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">{selectedShifts.length}</div>
                      <div className="text-sm text-muted-foreground">Shifts</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">
                        {selectedShifts.reduce((sum, shift) => sum + shift.duration, 0).toFixed(1)}h
                      </div>
                      <div className="text-sm text-muted-foreground">Hours</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">
                        £{selectedShifts.reduce((sum, shift) => sum + shift.earnings, 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Earnings</div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Shifts List */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                  <div className="space-y-3">
                     {selectedShifts.map((shift, index) => (
                       <Card key={index} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                         <CardContent className="p-4">
                           <div className="flex items-start justify-between gap-4">
                             <div className="flex-1 min-w-0">
                               <h4 className="font-semibold text-foreground mb-2">{shift.client_name}</h4>
                               <div className="space-y-1">
                                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                   <Clock className="w-4 h-4 shrink-0" />
                                   <span>{shift.start_time} - {shift.end_time}</span>
                                   <Badge variant="secondary" className="ml-2">
                                     {shift.duration}h
                                   </Badge>
                                 </div>
                                 {shift.location && (
                                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                     <MapPin className="w-4 h-4 shrink-0" />
                                     <span className="truncate">{shift.location}</span>
                                   </div>
                                 )}
                               </div>
                             </div>
                             <div className="text-right shrink-0">
                               <div className="text-lg font-semibold text-primary">
                                 £{shift.earnings.toFixed(2)}
                               </div>
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full px-6 py-8">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No shifts scheduled for this day</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}