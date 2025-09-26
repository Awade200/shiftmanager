import { Calendar, Clock, MapPin, User, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

interface UpcomingShift {
  id: string;
  date: Date;
  timeRange: string;
  client: string;
  location: string;
  rate: number;
  duration: number;
  status: 'confirmed' | 'pending' | 'tentative';
  travelTime?: number;
  notes?: string;
}

interface UpcomingShiftsProps {
  shifts: UpcomingShift[];
  onViewAll?: () => void;
  onShiftClick?: (shift: UpcomingShift) => void;
}

export const UpcomingShifts = ({ shifts, onViewAll, onShiftClick }: UpcomingShiftsProps) => {
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow'; 
    if (date <= addDays(new Date(), 7)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const getStatusVariant = (status: UpcomingShift['status']): 'default' | 'success' | 'warning' => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'tentative':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: UpcomingShift['status']) => {
    switch (status) {
      case 'confirmed':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'tentative':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  if (shifts.length === 0) {
    return (
      <Card className="shadow-1">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No upcoming shifts</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Your schedule is clear for the next 7 days.
          </p>
          <Button variant="outline" size="sm">
            Add New Shift
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-1 hover:shadow-2 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Shifts
            <Badge variant="info" className="ml-2">
              {shifts.length}
            </Badge>
          </CardTitle>
          {onViewAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="text-xs"
            >
              View All
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {shifts.slice(0, 5).map(shift => (
          <div
            key={shift.id}
            onClick={() => onShiftClick?.(shift)}
            className="group p-4 rounded-lg border bg-gradient-card hover:shadow-1 transition-all duration-200 cursor-pointer hover:border-primary/20"
          >
            <div className="flex items-center gap-3">
              {/* Client Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {shift.client.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Shift Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">
                      {shift.client}
                    </h4>
                    <Badge variant={getStatusVariant(shift.status)} className="text-xs">
                      {shift.status}
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    £{(shift.rate * shift.duration).toFixed(0)}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="font-medium">{getDateLabel(shift.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{shift.timeRange}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{shift.location}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {shift.duration}h at £{shift.rate}/h
                    </span>
                    {shift.travelTime && (
                      <Badge variant="outline" className="text-xs">
                        +{shift.travelTime}m travel
                      </Badge>
                    )}
                  </div>
                  
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    getStatusColor(shift.status).replace('text-', 'bg-')
                  )} />
                </div>
              </div>
            </div>
            
            {shift.notes && (
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                {shift.notes}
              </div>
            )}
          </div>
        ))}
        
        {shifts.length > 5 && onViewAll && (
          <Button 
            variant="ghost" 
            className="w-full mt-3"
            onClick={onViewAll}
          >
            View {shifts.length - 5} More Shifts
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};