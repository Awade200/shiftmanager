import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Edit } from 'lucide-react';
import { ShiftCard } from './ShiftCard';
import { useEffect, useState } from 'react';
import { differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  earnings: number;
  hourly_rate: number;
  client_name: string;
  location?: string;
  status: 'ready' | 'unresolved' | 'error' | 'conflict';
}

interface QueuePanelProps {
  conflicts: Shift[];
  unresolved: Shift[];
  allShifts: Shift[];
}

export const QueuePanel = ({ conflicts, unresolved, allShifts }: QueuePanelProps) => {
  const [upcomingShift, setUpcomingShift] = useState<{ shift: Shift; countdown: string } | null>(null);

  useEffect(() => {
    const findUpcomingShift = () => {
      const now = new Date();
      const upcoming = allShifts
        .filter(s => {
          const shiftDateTime = parseISO(`${s.date}T${s.start_time}`);
          const hoursUntil = differenceInHours(shiftDateTime, now);
          return hoursUntil >= 0 && hoursUntil < 12;
        })
        .sort((a, b) => {
          const aTime = parseISO(`${a.date}T${a.start_time}`);
          const bTime = parseISO(`${b.date}T${b.start_time}`);
          return aTime.getTime() - bTime.getTime();
        })[0];

      if (upcoming) {
        const shiftDateTime = parseISO(`${upcoming.date}T${upcoming.start_time}`);
        const hours = differenceInHours(shiftDateTime, now);
        const minutes = differenceInMinutes(shiftDateTime, now) % 60;
        setUpcomingShift({
          shift: upcoming,
          countdown: `${hours}h ${minutes}m`
        });
      } else {
        setUpcomingShift(null);
      }
    };

    findUpcomingShift();
    const interval = setInterval(findUpcomingShift, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [allShifts]);

  return (
    <div className="space-y-4">
      {/* Conflicts Queue */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                Conflicts
              </CardTitle>
              <Badge variant="destructive">{conflicts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {conflicts.slice(0, 3).map(shift => (
              <ShiftCard key={shift.id} shift={shift} compact />
            ))}
            {conflicts.length > 3 && (
              <Button variant="outline" size="sm" className="w-full">
                View All {conflicts.length} Conflicts
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unresolved Queue */}
      {unresolved.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Edit className="w-4 h-4 text-warning" />
                Unresolved
              </CardTitle>
              <Badge variant="warning">{unresolved.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {unresolved.length} {unresolved.length === 1 ? 'shift' : 'shifts'} need attention
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Fix Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Shift */}
      {upcomingShift && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Next Shift
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-primary">
              Starts in {upcomingShift.countdown}
            </div>
            <div className="text-sm font-medium text-foreground">
              {upcomingShift.shift.client_name}
            </div>
            <div className="text-xs text-muted-foreground">
              {upcomingShift.shift.start_time} - {upcomingShift.shift.end_time}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
