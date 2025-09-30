import { Clock, DollarSign, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ShiftCardProps {
  shift: {
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
  };
  onResolve?: (action: 'replace' | 'skip' | 'split' | 'edit') => void;
  compact?: boolean;
}

export const ShiftCard = ({ shift, onResolve, compact = false }: ShiftCardProps) => {
  const formatTime = (time: string) => {
    try {
      return format(new Date(`2000-01-01T${time}`), 'HH:mm');
    } catch {
      return '—';
    }
  };

  const statusConfig = {
    ready: { label: 'Ready', variant: 'success' as const },
    conflict: { label: 'Conflict', variant: 'destructive' as const },
    unresolved: { label: 'Unresolved', variant: 'warning' as const },
    error: { label: 'Error', variant: 'destructive' as const }
  };

  const config = statusConfig[shift.status];

  return (
    <Card className={`${compact ? 'p-3' : 'p-4'} hover:shadow-2 transition-shadow`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{shift.client_name}</div>
            {shift.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{shift.location}</span>
              </div>
            )}
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
          </div>
          <div className="text-muted-foreground">
            {Number(shift.duration || 0).toFixed(1)}h
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">£{Number(shift.earnings || 0).toFixed(2)}</span>
          <span className="text-muted-foreground">@ £{Number(shift.hourly_rate || 0).toFixed(2)}/hr</span>
        </div>

        {shift.status === 'conflict' && onResolve && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="outline" onClick={() => onResolve('replace')}>
              Replace
            </Button>
            <Button size="sm" variant="outline" onClick={() => onResolve('skip')}>
              Skip
            </Button>
            <Button size="sm" variant="outline" onClick={() => onResolve('split')}>
              Split
            </Button>
            <Button size="sm" variant="outline" onClick={() => onResolve('edit')}>
              Edit
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
