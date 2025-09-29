import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Day } from '@/types/day';
import { cn } from '@/lib/utils';

interface DayCardProps {
  day: Day;
  onOpenDay: (dayDate: string) => void;
  onReplaceDay?: (dayDate: string) => void;
  onMergeDay?: (dayDate: string) => void;
  onSkipDay?: (dayDate: string) => void;
  isUploadSession?: boolean;
  className?: string;
}

export function DayCard({
  day,
  onOpenDay,
  onReplaceDay,
  onMergeDay,
  onSkipDay,
  isUploadSession = false,
  className
}: DayCardProps) {
  const dayDate = parseISO(day.day_date);
  const formattedDate = format(dayDate, 'EEE, dd MMM yyyy');
  const dayName = format(dayDate, 'EEEE');

  const getBadgeVariant = (type: 'conflict' | 'unresolved' | 'daily-limit') => {
    switch (type) {
      case 'conflict':
        return 'destructive';
      case 'unresolved':
        return 'secondary';
      case 'daily-limit':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusColor = () => {
    if (day.has_conflicts) return 'border-l-destructive';
    if (day.has_unresolved) return 'border-l-warning';
    return 'border-l-primary';
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md border-l-4',
      getStatusColor(),
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg font-semibold">
                {formattedDate}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{dayName}</p>
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="flex gap-2">
            {day.has_conflicts && (
              <Badge variant={getBadgeVariant('conflict')} className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Conflicts
              </Badge>
            )}
            {day.has_unresolved && (
              <Badge variant={getBadgeVariant('unresolved')} className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Unresolved
              </Badge>
            )}
            {day.total_hours > 12 && (
              <Badge variant={getBadgeVariant('daily-limit')} className="gap-1">
                <Clock className="h-3 w-3" />
                Long Day
              </Badge>
            )}
            {!day.has_conflicts && !day.has_unresolved && day.shift_count > 0 && (
              <Badge variant="default" className="gap-1 bg-success">
                <CheckCircle className="h-3 w-3" />
                Ready
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Day Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {day.total_hours.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Hours</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {day.shift_count}
            </div>
            <div className="text-sm text-muted-foreground">Shifts</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              £{(day.total_hours * 25).toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">Estimated</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onOpenDay(day.day_date)}
            className="flex-1"
            variant="default"
          >
            <Users className="h-4 w-4 mr-2" />
            Open Day
          </Button>
          
          {isUploadSession && (
            <>
              {onReplaceDay && (
                <Button 
                  onClick={() => onReplaceDay(day.day_date)}
                  variant="outline"
                  size="sm"
                >
                  Replace
                </Button>
              )}
              
              {onMergeDay && (
                <Button 
                  onClick={() => onMergeDay(day.day_date)}
                  variant="outline"
                  size="sm"
                >
                  Merge
                </Button>
              )}
              
              {onSkipDay && (
                <Button 
                  onClick={() => onSkipDay(day.day_date)}
                  variant="ghost"
                  size="sm"
                >
                  Skip
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}