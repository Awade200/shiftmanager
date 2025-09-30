import { useMemo, useEffect, useState } from 'react';
import { useDayManagement } from '@/hooks/useDayManagement';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { DayShift } from '@/types/day';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, DollarSign } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';

const TodaysShifts = () => {
  const { user } = useMobileAuth();
  const { getDayWithShifts } = useDayManagement(user?.mobile_number);
  const [todaysShifts, setTodaysShifts] = useState<DayShift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTodaysShifts = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const dayWithShifts = await getDayWithShifts(today);
        
        if (dayWithShifts?.shifts) {
          // Sort by start time
          const sorted = dayWithShifts.shifts.sort((a, b) => {
            const timeA = a.start_time.replace(':', '');
            const timeB = b.start_time.replace(':', '');
            return timeA.localeCompare(timeB);
          });
          setTodaysShifts(sorted);
        } else {
          setTodaysShifts([]);
        }
      } catch (error) {
        console.error('Error loading today\'s shifts:', error);
        setTodaysShifts([]);
      } finally {
        setLoading(false);
      }
    };

    loadTodaysShifts();
  }, [getDayWithShifts]);

  const formatTime = (time: string) => {
    try {
      return format(new Date(`2000-01-01T${time}`), 'HH:mm');
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Today's Shifts</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (todaysShifts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Today's Shifts</h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>

        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No shifts today</h3>
            <p className="text-muted-foreground text-center">
              You don't have any shifts scheduled for today. Enjoy your day off!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Today's Shifts</h1>
        <p className="text-muted-foreground mb-1">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </p>
        <Badge variant="secondary" className="text-sm">
          {todaysShifts.length} shift{todaysShifts.length === 1 ? '' : 's'} scheduled
        </Badge>
      </div>

      <div className="space-y-4">
        {todaysShifts.map((shift) => (
          <Card key={shift.id} className="shadow-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground text-lg">
                      {shift.client_name}
                    </span>
                    <Badge variant={shift.is_paid ? "default" : "secondary"}>
                      {shift.is_paid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{shift.location || 'No location specified'}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <div className="text-center sm:text-right">
                      <div className="font-semibold text-foreground">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Number(shift.duration || 0).toFixed(1)} hours
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <div className="text-center sm:text-right">
                      <div className="font-semibold text-foreground">
                        £{Number(shift.earnings || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        £{Number(shift.hourly_rate || 0).toFixed(2)}/hr
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card bg-accent/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Today's Summary</h3>
              <p className="text-sm text-muted-foreground">
                Total scheduled work for today
              </p>
            </div>
            
            <div className="flex gap-6">
              <div className="text-center">
                <div className="font-bold text-xl text-foreground">
                  {todaysShifts.reduce((sum, shift) => sum + Number(shift.duration || 0), 0).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Hours</div>
              </div>
              
              <div className="text-center">
                <div className="font-bold text-xl text-foreground">
                  £{todaysShifts.reduce((sum, shift) => sum + Number(shift.earnings || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Earnings</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TodaysShifts;