import { Clock, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CompactKPIsProps {
  todayHours: number;
  weekHours: number;
  weekShifts: number;
  conflictCount: number;
}

export const CompactKPIs = ({ todayHours, weekHours, weekShifts, conflictCount }: CompactKPIsProps) => {
  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{todayHours.toFixed(1)}h</span>
          <span className="text-muted-foreground">today</span>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{weekHours.toFixed(1)}h</span>
          <span className="text-muted-foreground">this week</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{weekShifts}</span>
          <span className="text-muted-foreground">shifts</span>
        </div>

        {conflictCount > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="font-semibold text-destructive">{conflictCount}</span>
            <span className="text-muted-foreground">conflicts</span>
          </div>
        )}
      </div>
    </Card>
  );
};
