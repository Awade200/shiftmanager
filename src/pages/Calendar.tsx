import React, { useState } from 'react';
import { Calendar as CalendarIcon, List, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DayCalendarView } from '@/components/calendar/DayCalendarView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayDetailView } from '@/components/DayDetailView';
import { useDayManagement } from '@/hooks/useDayManagement';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { useShifts } from '@/hooks/useShifts';

type CalendarViewType = 'month' | 'week' | 'list';

export default function Calendar() {
  const [currentView, setCurrentView] = useState<CalendarViewType>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  
  const { user } = useMobileAuth();
  const { days, loading, dayStats } = useDayManagement(user?.mobile_number);
  const { settings } = useShifts();

  const handleDayClick = (dayDate: string) => {
    setSelectedDayDate(dayDate);
  };

  const handleCloseDayDetail = () => {
    setSelectedDayDate(null);
  };

  const renderViewSelector = () => (
    <div className="flex gap-2">
      <Button
        variant={currentView === 'month' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setCurrentView('month')}
      >
        <Grid3X3 className="h-4 w-4 mr-2" />
        Month
      </Button>
      <Button
        variant={currentView === 'week' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setCurrentView('week')}
      >
        <CalendarIcon className="h-4 w-4 mr-2" />
        Week
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setCurrentView('list')}
      >
        <List className="h-4 w-4 mr-2" />
        List
      </Button>
    </div>
  );

  // If a specific day is selected, show day detail view
  if (selectedDayDate) {
    return (
      <div className="container mx-auto px-4 py-6">
        <DayDetailView
          dayDate={selectedDayDate}
          onClose={handleCloseDayDetail}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your shift schedule by days
          </p>
        </div>
        {renderViewSelector()}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayStats.total_days}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayStats.total_hours.toFixed(1)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Days with Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {dayStats.days_with_conflicts + dayStats.days_with_unresolved}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estimated Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              £{(dayStats.total_hours * settings.defaultHourlyRate).toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Views */}
      {currentView === 'month' && (
        <DayCalendarView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onDayClick={handleDayClick}
        />
      )}

      {currentView === 'week' && (
        <WeekView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onDayClick={handleDayClick}
        />
      )}

      {currentView === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>All Days</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : days.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No shift days found. Upload some shifts to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {days.map((day) => (
                  <div
                    key={day.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleDayClick(day.day_date)}
                  >
                    <div>
                      <div className="font-medium">{day.day_date}</div>
                      <div className="text-sm text-muted-foreground">
                        {day.shift_count} shifts • {day.total_hours.toFixed(1)} hours
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {day.has_conflicts && (
                        <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">
                          Conflicts
                        </span>
                      )}
                      {day.has_unresolved && (
                        <span className="text-xs px-2 py-1 bg-warning/10 text-warning rounded">
                          Issues
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}