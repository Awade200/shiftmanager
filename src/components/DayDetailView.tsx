import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DayWithShifts, DayShift } from '@/types/day';
import { useDayManagement } from '@/hooks/useDayManagement';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DayDetailViewProps {
  dayDate: string;
  onClose: () => void;
  className?: string;
}

export function DayDetailView({ dayDate, onClose, className }: DayDetailViewProps) {
  const [dayData, setDayData] = useState<DayWithShifts | null>(null);
  const [editingShift, setEditingShift] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<DayShift>>({});
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useMobileAuth();
  const { getDayWithShifts, calculateDuration } = useDayManagement(user?.mobile_number);
  const { checkDayConflicts } = useConflictDetection();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user?.mobile_number) {
      loadDayData();
    }
  }, [dayDate, authLoading, user]);

  const loadDayData = async () => {
    try {
      setLoading(true);
      const data = await getDayWithShifts(dayDate);
      setDayData(data);
    } catch (err) {
      console.error('Error loading day data:', err);
      toast({
        title: "Error",
        description: "Failed to load day data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditShift = (shiftId: string) => {
    const shift = dayData?.shifts.find(s => s.id === shiftId);
    if (shift) {
      setEditingShift(shiftId);
      setEditedValues({
        start_time: shift.start_time,
        end_time: shift.end_time,
        client_name: shift.client_name,
        location: shift.location
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingShift || !dayData) return;

    try {
      // Here you would call an API to update the shift
      // For now, we'll just update the local state
      const updatedShifts = dayData.shifts.map(shift => 
        shift.id === editingShift 
          ? { ...shift, ...editedValues }
          : shift
      );

      setDayData({
        ...dayData,
        shifts: updatedShifts
      });

      setEditingShift(null);
      setEditedValues({});

      toast({
        title: "Success",
        description: "Shift updated successfully"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update shift",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingShift(null);
    setEditedValues({});
  };

  const getShiftStatusBadge = (shift: DayShift) => {
    switch (shift.status) {
      case 'ready':
        return (
          <Badge variant="default" className="bg-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'conflict':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Conflict
          </Badge>
        );
      case 'unresolved':
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Unresolved
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const generateTimeline = () => {
    if (!dayData || dayData.shifts.length === 0) return null;

    const timeSlots = Array.from({ length: 24 }, (_, i) => i);
    const sortedShifts = [...dayData.shifts].sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );

    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-lg mb-4">Timeline</h3>
        <div className="relative">
          {/* Time axis */}
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
          
          {/* Timeline bar */}
          <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
            {sortedShifts.map((shift, index) => {
              const startHour = parseInt(shift.start_time.split(':')[0]);
              const startMin = parseInt(shift.start_time.split(':')[1]);
              const endHour = parseInt(shift.end_time.split(':')[0]);
              const endMin = parseInt(shift.end_time.split(':')[1]);
              
              const startPercent = ((startHour * 60 + startMin) / (24 * 60)) * 100;
              let endPercent = ((endHour * 60 + endMin) / (24 * 60)) * 100;
              
              // Handle overnight shifts
              if (endPercent <= startPercent) {
                endPercent = 100;
              }
              
              const width = endPercent - startPercent;
              
              return (
                <div
                  key={shift.id}
                  className={cn(
                    "absolute top-0 h-full rounded flex items-center justify-center text-xs font-medium text-white",
                    shift.status === 'conflict' ? 'bg-destructive' : 'bg-primary',
                    width < 10 && 'px-1'
                  )}
                  style={{
                    left: `${startPercent}%`,
                    width: `${width}%`
                  }}
                  title={`${shift.client_name}: ${shift.start_time} - ${shift.end_time}`}
                >
                  {width > 15 && (
                    <span className="truncate">{shift.client_name}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dayData) {
    const emptyDate = parseISO(dayDate);
    const emptyFormattedDate = format(emptyDate, 'EEEE, MMMM do, yyyy');
    
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{emptyFormattedDate}</h1>
              <p className="text-muted-foreground">No shifts for this day</p>
            </div>
          </div>
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shifts Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              There are no shifts scheduled for this day. Upload or add shifts to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dayDate_parsed = parseISO(dayData.day_date);
  const formattedDate = format(dayDate_parsed, 'EEEE, MMMM do, yyyy');

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{formattedDate}</h1>
            <p className="text-muted-foreground">
              {dayData.shift_count} shifts • {dayData.total_hours.toFixed(1)} hours
            </p>
          </div>
        </div>
        <Button onClick={onClose} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {generateTimeline()}
        </CardContent>
      </Card>

      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...dayData.shifts]
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((shift) => (
              <div
                key={shift.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {editingShift === shift.id ? (
                  /* Edit Mode */
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      <Input
                        type="time"
                        value={editedValues.start_time || ''}
                        onChange={(e) => setEditedValues({
                          ...editedValues,
                          start_time: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Time</Label>
                      <Input
                        type="time"
                        value={editedValues.end_time || ''}
                        onChange={(e) => setEditedValues({
                          ...editedValues,
                          end_time: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Client</Label>
                      <Input
                        value={editedValues.client_name || ''}
                        onChange={(e) => setEditedValues({
                          ...editedValues,
                          client_name: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Location</Label>
                      <Input
                        value={editedValues.location || ''}
                        onChange={(e) => setEditedValues({
                          ...editedValues,
                          location: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {shift.start_time} - {shift.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{shift.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {shift.location || 'No location'}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">{shift.duration.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-center">
                      {getShiftStatusBadge(shift)}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {editingShift === shift.id ? (
                    <>
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditShift(shift.id)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflict and Unresolved Panels */}
      {(dayData.has_conflicts || dayData.has_unresolved) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dayData.has_conflicts && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Conflicts Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Some shifts overlap with existing schedules. Please resolve conflicts before saving.
                </p>
              </CardContent>
            </Card>
          )}

          {dayData.has_unresolved && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Unresolved Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Some shifts have missing or invalid data. Please complete all required fields.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}