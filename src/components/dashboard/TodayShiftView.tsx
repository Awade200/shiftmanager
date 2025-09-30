import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';
import { ShiftCard } from './ShiftCard';
import { useToast } from '@/hooks/use-toast';

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

interface TodayShiftViewProps {
  date: Date;
  shifts: Shift[];
  stats: {
    hours: number;
    shiftCount: number;
    earnings: number;
    hasConflicts: boolean;
  };
}

export const TodayShiftView = ({ date, shifts, stats }: TodayShiftViewProps) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { toast } = useToast();

  const handleResolveConflict = (shiftId: string, action: 'replace' | 'skip' | 'split' | 'edit') => {
    toast({
      title: `${action} action`,
      description: `Conflict resolution for shift will be implemented`,
    });
  };

  const hasPendingEdits = shifts.some(s => s.status !== 'ready');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {format(date, 'EEE, dd MMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>{stats.hours.toFixed(1)}h</span>
                <span>•</span>
                <span>{stats.shiftCount} {stats.shiftCount === 1 ? 'shift' : 'shifts'}</span>
                {stats.hasConflicts && (
                  <>
                    <span>•</span>
                    <Badge variant="destructive">Conflicts</Badge>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                £{stats.earnings.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">earnings</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Timeline visualization */}
          <div className="h-12 bg-muted rounded-lg relative overflow-hidden">
            {shifts.map((shift) => {
              const startHour = parseInt(shift.start_time.split(':')[0]) + parseInt(shift.start_time.split(':')[1]) / 60;
              const endHour = parseInt(shift.end_time.split(':')[0]) + parseInt(shift.end_time.split(':')[1]) / 60;
              const left = (startHour / 24) * 100;
              const width = ((endHour - startHour) / 24) * 100;
              
              return (
                <div
                  key={shift.id}
                  className="absolute top-1 bottom-1 bg-primary rounded"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${shift.client_name}: ${shift.start_time}-${shift.end_time}`}
                />
              );
            })}
            <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-muted-foreground pointer-events-none">
              <span>00:00</span>
              <span>12:00</span>
              <span>24:00</span>
            </div>
          </div>

          {/* Shift cards */}
          {shifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shifts scheduled for this day
            </div>
          ) : (
            <div className="space-y-2">
              {shifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onResolve={shift.status === 'conflict' ? (action) => handleResolveConflict(shift.id, action) : undefined}
                />
              ))}
            </div>
          )}

          {/* Quick add */}
          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Quick Add Shift
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sticky save button */}
      {hasPendingEdits && (
        <div className="fixed bottom-4 right-4 z-10">
          <Button size="lg" className="shadow-lg">
            <Save className="w-4 h-4 mr-2" />
            Save All Ready Shifts
          </Button>
        </div>
      )}
    </div>
  );
};
