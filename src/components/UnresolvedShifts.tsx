import React, { useState } from 'react';
import { AlertTriangle, Save, X, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ShiftRow } from '@/lib/shiftParser';
import { useToast } from '@/hooks/use-toast';

interface UnresolvedShiftsProps {
  shifts: ShiftRow[];
  onShiftsResolved: (resolvedShifts: ShiftRow[]) => void;
  onDiscard: () => void;
  className?: string;
}

export function UnresolvedShifts({ 
  shifts, 
  onShiftsResolved, 
  onDiscard,
  className 
}: UnresolvedShiftsProps) {
  const [editedShifts, setEditedShifts] = useState<Record<string, Partial<ShiftRow>>>(
    shifts.reduce((acc, shift, index) => {
      acc[index] = {
        date: shift.date || '',
        startTime: shift.startTime || '',
        endTime: shift.endTime || '',
        clientName: shift.clientName || '',
        service: shift.service || 'Shift'
      };
      return acc;
    }, {} as Record<string, Partial<ShiftRow>>)
  );

  const { toast } = useToast();

  const handleFieldChange = (index: number, field: keyof ShiftRow, value: string) => {
    setEditedShifts(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  const validateShift = (shift: Partial<ShiftRow>): string[] => {
    const errors: string[] = [];
    
    if (!shift.date) {
      errors.push('Date is required');
    } else {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(shift.date)) {
        errors.push('Date must be in YYYY-MM-DD format');
      }
    }
    
    if (!shift.startTime) {
      errors.push('Start time is required');
    } else {
      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(shift.startTime)) {
        errors.push('Start time must be in HH:MM format');
      }
    }
    
    if (!shift.endTime) {
      errors.push('End time is required');
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(shift.endTime)) {
        errors.push('End time must be in HH:MM format');
      }
    }
    
    if (!shift.clientName?.trim()) {
      errors.push('Client name is required');
    }
    
    return errors;
  };

  const getShiftErrors = (index: number): string[] => {
    return validateShift(editedShifts[index] || {});
  };

  const isShiftValid = (index: number): boolean => {
    return getShiftErrors(index).length === 0;
  };

  const getValidShiftsCount = (): number => {
    return shifts.filter((_, index) => isShiftValid(index)).length;
  };

  const handleSaveResolved = () => {
    const resolvedShifts: ShiftRow[] = [];
    
    shifts.forEach((originalShift, index) => {
      if (isShiftValid(index)) {
        const editedData = editedShifts[index];
        resolvedShifts.push({
          ...originalShift,
          date: editedData.date || '',
          startTime: editedData.startTime || '',
          endTime: editedData.endTime || '',
          clientName: editedData.clientName || '',
          service: editedData.service || originalShift.service || 'Shift'
        });
      }
    });

    if (resolvedShifts.length === 0) {
      toast({
        title: "No valid shifts",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
      return;
    }

    onShiftsResolved(resolvedShifts);
    
    toast({
      title: "Shifts resolved",
      description: `${resolvedShifts.length} shifts have been fixed and are ready to save`
    });
  };

  const handleQuickFill = (index: number) => {
    const today = new Date().toISOString().split('T')[0];
    setEditedShifts(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        date: prev[index].date || today,
        startTime: prev[index].startTime || '09:00',
        endTime: prev[index].endTime || '17:00',
        clientName: prev[index].clientName || 'Client Name',
        service: prev[index].service || 'Shift'
      }
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Unresolved Shifts ({shifts.length})
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              {getValidShiftsCount()} / {shifts.length} ready
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            These shifts have missing or invalid data. Please fix the issues below before they can be saved.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {shifts.map((shift, index) => {
            const errors = getShiftErrors(index);
            const isValid = errors.length === 0;
            const editedData = editedShifts[index] || {};

            return (
              <div
                key={index}
                className={`p-4 border rounded-lg space-y-4 ${
                  isValid ? 'border-success bg-success/5' : 'border-destructive bg-destructive/5'
                }`}
              >
                {/* Shift Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={isValid ? 'default' : 'destructive'}>
                      Shift {index + 1}
                    </Badge>
                    {shift.rawLines && shift.rawLines.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        From: "{shift.rawLines[0]}"
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickFill(index)}
                  >
                    Quick Fill
                  </Button>
                </div>

                {/* Error List */}
                {errors.length > 0 && (
                  <div className="text-sm text-destructive space-y-1">
                    {errors.map((error, errorIndex) => (
                      <div key={errorIndex}>• {error}</div>
                    ))}
                  </div>
                )}

                {/* Edit Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`date-${index}`}>Date *</Label>
                    <Input
                      id={`date-${index}`}
                      type="date"
                      value={editedData.date || ''}
                      onChange={(e) => handleFieldChange(index, 'date', e.target.value)}
                      className={errors.some(e => e.includes('Date')) ? 'border-destructive' : ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`start-${index}`}>Start Time *</Label>
                    <Input
                      id={`start-${index}`}
                      type="time"
                      value={editedData.startTime || ''}
                      onChange={(e) => handleFieldChange(index, 'startTime', e.target.value)}
                      className={errors.some(e => e.includes('Start time')) ? 'border-destructive' : ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`end-${index}`}>End Time *</Label>
                    <Input
                      id={`end-${index}`}
                      type="time"
                      value={editedData.endTime || ''}
                      onChange={(e) => handleFieldChange(index, 'endTime', e.target.value)}
                      className={errors.some(e => e.includes('End time')) ? 'border-destructive' : ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`client-${index}`}>Client Name *</Label>
                    <Input
                      id={`client-${index}`}
                      value={editedData.clientName || ''}
                      onChange={(e) => handleFieldChange(index, 'clientName', e.target.value)}
                      placeholder="Enter client name"
                      className={errors.some(e => e.includes('Client name')) ? 'border-destructive' : ''}
                    />
                  </div>
                </div>

                {/* Service Type (Optional) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`service-${index}`}>Service Type</Label>
                    <Select
                      value={editedData.service || ''}
                      onValueChange={(value) => handleFieldChange(index, 'service', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shift">General Shift</SelectItem>
                        <SelectItem value="Supported Living">Supported Living</SelectItem>
                        <SelectItem value="Day Shift">Day Shift</SelectItem>
                        <SelectItem value="Night Shift">Night Shift</SelectItem>
                        <SelectItem value="Respite">Respite Care</SelectItem>
                        <SelectItem value="Personal Care">Personal Care</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSaveResolved}
            disabled={getValidShiftsCount() === 0}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save {getValidShiftsCount()} Resolved Shifts
          </Button>
          
          <Button
            variant="outline"
            onClick={onDiscard}
          >
            <X className="h-4 w-4 mr-2" />
            Discard All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}