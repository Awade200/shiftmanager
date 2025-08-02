import React, { useState, useMemo } from 'react';
import { Edit3, MapPin, Clock, AlertCircle, CheckCircle, RefreshCw, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShiftRow } from '@/lib/shiftParser';
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { useDuplicateHandling } from '@/hooks/useDuplicateHandling';
import { useShifts } from '@/hooks/useShifts';
import { DuplicateCheckResult, UpdateChoice } from '@/types/duplicateHandling';
import { ShiftFormData } from '@/types/shift';
import DuplicateHandlingModal from './DuplicateHandlingModal';

interface ShiftPreviewProps {
  shifts: ShiftRow[];
  onShiftsUpdated: (shifts: ShiftRow[]) => void;
  onSave: (shifts: ShiftFormData[]) => void;
}

interface ShiftWithId extends ShiftRow {
  id: string;
}

interface ShiftStatus {
  type: 'new' | 'duplicate' | 'update' | 'missing_location' | 'hours_corrected';
  message?: string;
}

export function ShiftPreview({ shifts, onShiftsUpdated, onSave }: ShiftPreviewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedShifts, setEditedShifts] = useState<Record<string, Partial<ShiftRow>>>({});
  const [groupBy, setGroupBy] = useState<'none' | 'day' | 'client'>('none');
  const [duplicateResults, setDuplicateResults] = useState<DuplicateCheckResult[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingShifts, setPendingShifts] = useState<ShiftFormData[]>([]);
  
  const { findClientLocation, saveClientProfile } = useClientProfiles();
  const { checkForDuplicates, processShiftsWithChoices, isProcessing } = useDuplicateHandling();
  const { settings } = useShifts();

  // Generate unique IDs for shifts
  const shiftsWithIds = useMemo(() => {
    return shifts.map((shift, index) => ({
      ...shift,
      id: `${shift.date}-${shift.clientName}-${shift.startTime}-${index}`
    }));
  }, [shifts]);

  // Calculate shift statuses
  const getShiftStatus = (shift: ShiftRow): ShiftStatus => {
    if (!shift.clientName || shift.needsLocation) {
      return { type: 'missing_location', message: 'Missing client or location' };
    }
    if (shift.hoursCorrected) {
      return { type: 'hours_corrected', message: 'Hours automatically corrected' };
    }
    return { type: 'new' };
  };

  // Group shifts
  const groupedShifts = useMemo(() => {
    const shiftsToUse = shiftsWithIds.map(shift => ({
      ...shift,
      ...editedShifts[shift.id]
    }));

    if (groupBy === 'day') {
      const groups = shiftsToUse.reduce((acc, shift) => {
        const key = `${shift.day} ${shift.date}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(shift);
        return acc;
      }, {} as Record<string, ShiftWithId[]>);
      
      return Object.entries(groups).map(([key, shifts]) => ({
        title: key,
        shifts: shifts.sort((a, b) => a.startTime.localeCompare(b.startTime))
      }));
    }

    if (groupBy === 'client') {
      const groups = shiftsToUse.reduce((acc, shift) => {
        const key = shift.clientName;
        if (!acc[key]) acc[key] = [];
        acc[key].push(shift);
        return acc;
      }, {} as Record<string, ShiftWithId[]>);
      
      return Object.entries(groups).map(([key, shifts]) => ({
        title: key,
        shifts: shifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }));
    }

    return [{
      title: 'All Shifts',
      shifts: shiftsToUse.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      })
    }] as { title: string; shifts: ShiftWithId[] }[];
  }, [shiftsWithIds, editedShifts, groupBy]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const shiftsToUse = shiftsWithIds.map(shift => ({
      ...shift,
      ...editedShifts[shift.id]
    }));

    const totalHours = shiftsToUse.reduce((sum, shift) => sum + shift.hours, 0);
    const newShifts = shiftsToUse.filter(s => getShiftStatus(s).type === 'new').length;
    const needsLocation = shiftsToUse.filter(s => getShiftStatus(s).type === 'missing_location').length;
    const uniqueClients = new Set(shiftsToUse.map(s => s.clientName)).size;
    const uniqueDays = new Set(shiftsToUse.map(s => s.date)).size;

    return {
      totalShifts: shiftsToUse.length,
      totalHours: Math.round(totalHours * 100) / 100,
      newShifts,
      needsLocation,
      uniqueClients,
      uniqueDays
    };
  }, [shiftsWithIds, editedShifts]);

  const handleEdit = (shift: ShiftWithId, field: string, value: string | number) => {
    const shiftId = shift.id;
    setEditedShifts(prev => ({
      ...prev,
      [shiftId]: {
        ...prev[shiftId],
        [field]: value
      }
    }));

    // If editing times, recalculate hours
    if (field === 'startTime' || field === 'endTime') {
      const currentShift = { ...shift, ...editedShifts[shiftId] };
      const startTime = field === 'startTime' ? value : currentShift.startTime;
      const endTime = field === 'endTime' ? value : currentShift.endTime;
      
      if (startTime && endTime && typeof startTime === 'string' && typeof endTime === 'string') {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        let start = startHour * 60 + startMin;
        let end = endHour * 60 + endMin;
        if (end < start) end += 24 * 60;
        const hours = Math.round((end - start) / 60 * 100) / 100;
        
        setEditedShifts(prev => ({
          ...prev,
          [shiftId]: {
            ...prev[shiftId],
            hours
          }
        }));
      }
    }
  };

  const handleRemoveShift = (shiftId: string) => {
    const updatedShifts = shiftsWithIds.filter(s => s.id !== shiftId);
    onShiftsUpdated(updatedShifts);
    
    // Remove from edited shifts
    setEditedShifts(prev => {
      const newEdited = { ...prev };
      delete newEdited[shiftId];
      return newEdited;
    });
  };

  const handleCheckDuplicates = async () => {
    const shiftsToCheck = shiftsWithIds.map(shift => ({
      ...shift,
      ...editedShifts[shift.id]
    }));

    const shiftFormData: ShiftFormData[] = shiftsToCheck.map(shift => ({
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      clientName: shift.clientName,
      location: shift.clientName ? findClientLocation(shift.clientName) || '' : '',
      hourlyRate: settings.defaultHourlyRate,
      isPaid: false
    }));

    const results = await checkForDuplicates(shiftFormData);
    setDuplicateResults(results);
    
    // Show summary of conflicts found
    const conflicts = results.filter(r => r.status === 'potential_update' || r.status === 'duplicate');
    if (conflicts.length > 0) {
      console.log(`Found ${conflicts.length} time conflicts!`);
    } else {
      console.log('No conflicts found');
    }
  };

  const handleSave = async () => {
    const finalShifts = shiftsWithIds.map(shift => ({
      ...shift,
      ...editedShifts[shift.id]
    }));

    const shiftFormData: ShiftFormData[] = finalShifts.map(shift => ({
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      clientName: shift.clientName,
      location: shift.clientName ? findClientLocation(shift.clientName) || '' : '',
      hourlyRate: settings.defaultHourlyRate,
      isPaid: false
    }));

    // Check for duplicates before saving
    const results = await checkForDuplicates(shiftFormData);
    const conflicts = results.filter(r => r.status === 'potential_update' || r.status === 'duplicate');
    
    if (conflicts.length > 0) {
      // Show duplicate handling modal
      setDuplicateResults(results);
      setPendingShifts(shiftFormData);
      setShowConflictModal(true);
    } else {
      // No conflicts, save directly
      onSave(shiftFormData);
    }
  };

  const handleConflictChoices = async (choices: UpdateChoice[]) => {
    try {
      await processShiftsWithChoices(duplicateResults, choices);
      setShowConflictModal(false);
      setPendingShifts([]);
      setDuplicateResults([]);
      
      // Clear the extracted shifts after successful save
      onShiftsUpdated([]);
    } catch (error) {
      console.error('Failed to process shifts with choices:', error);
    }
  };

  const getBadgeForStatus = (status: ShiftStatus) => {
    switch (status.type) {
      case 'new':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✅ New</Badge>;
      case 'duplicate':
        return <Badge className="bg-red-100 text-red-800 border-red-200">🚫 Duplicate</Badge>;
      case 'update':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">🔄 Update</Badge>;
      case 'missing_location':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⚠ Missing Location</Badge>;
      case 'hours_corrected':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">🛠 Hours Corrected</Badge>;
      default:
        return null;
    }
  };

  if (shifts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          No shifts to preview. Extract some shifts first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Extraction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summaryStats.totalShifts}</div>
              <div className="text-sm text-muted-foreground">Total Shifts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summaryStats.totalHours}h</div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.newShifts}</div>
              <div className="text-sm text-muted-foreground">New Shifts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summaryStats.needsLocation}</div>
              <div className="text-sm text-muted-foreground">Need Location</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.uniqueClients}</div>
              <div className="text-sm text-muted-foreground">Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summaryStats.uniqueDays}</div>
              <div className="text-sm text-muted-foreground">Days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Group by:</label>
          <Select value={groupBy} onValueChange={(value: 'none' | 'day' | 'client') => setGroupBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckDuplicates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Duplicates
          </Button>
          <Button onClick={handleSave} disabled={summaryStats.needsLocation > 0 || isProcessing}>
            <Save className="h-4 w-4 mr-2" />
            {isProcessing ? 'Checking Conflicts...' : 'Save All Shifts'}
          </Button>
        </div>
      </div>

      {/* Shift Groups */}
      <div className="space-y-4">
        {groupedShifts.map(({ title, shifts }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shifts.map((shift) => {
                  const shiftId = (shift as ShiftWithId).id;
                  const isEditing = editingId === shiftId;
                  const currentShift = { ...shift, ...editedShifts[shiftId] };
                  const status = getShiftStatus(currentShift);

                  return (
                    <div key={shiftId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getBadgeForStatus(status)}
                          <Badge variant="outline">{shift.sourceType}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(isEditing ? null : shiftId)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveShift(shiftId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground">Date</label>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={currentShift.date}
                               onChange={(e) => handleEdit(shift as ShiftWithId, 'date', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <div className="font-medium">{currentShift.date}</div>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">Client</label>
                          {isEditing ? (
                            <Input
                              value={currentShift.clientName}
                              onChange={(e) => handleEdit(shift as ShiftWithId, 'clientName', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <div className="font-medium">{currentShift.clientName}</div>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">Time</label>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="time"
                                value={currentShift.startTime}
                                onChange={(e) => handleEdit(shift as ShiftWithId, 'startTime', e.target.value)}
                                className="h-8"
                              />
                              <span>-</span>
                              <Input
                                type="time"
                                value={currentShift.endTime}
                                onChange={(e) => handleEdit(shift as ShiftWithId, 'endTime', e.target.value)}
                                className="h-8"
                              />
                            </div>
                          ) : (
                            <div className="font-medium">
                              {currentShift.startTime} - {currentShift.endTime}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">Hours</label>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.25"
                              value={currentShift.hours}
                              onChange={(e) => handleEdit(shift as ShiftWithId, 'hours', parseFloat(e.target.value))}
                              className="h-8"
                            />
                          ) : (
                            <div className="font-medium">{currentShift.hours}h</div>
                          )}
                        </div>
                      </div>

                      {currentShift.service && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Service: {currentShift.service}
                        </div>
                      )}

                      {status.message && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {status.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Duplicate Handling Modal */}
      <DuplicateHandlingModal
        isOpen={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          setPendingShifts([]);
          setDuplicateResults([]);
        }}
        conflicts={duplicateResults.filter(r => r.status === 'potential_update' || r.status === 'duplicate')}
        onChoicesMade={handleConflictChoices}
      />
    </div>
  );
}