import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DuplicateCheckResult, UpdateChoice } from '@/types/duplicateHandling';
import { AlertTriangle, Clock, RotateCcw, X, Scissors, Edit2 } from 'lucide-react';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: DuplicateCheckResult[];
  onChoicesMade: (choices: UpdateChoice[]) => void;
}

export default function ConflictResolutionModal({
  isOpen,
  onClose,
  conflicts,
  onChoicesMade,
}: ConflictResolutionModalProps) {
  const [choices, setChoices] = useState<Record<string, { action: string; editData?: any }>>({});
  const [editingShift, setEditingShift] = useState<string | null>(null);

  const conflictShifts = conflicts.filter(c => c.status !== 'new');
  const newShifts = conflicts.filter(c => c.status === 'new');

  const getOverlapTypeDisplay = (type: string) => {
    switch (type) {
      case 'exact': return { text: 'Exact Duplicate', color: 'bg-red-100 text-red-800' };
      case 'partial': return { text: 'Partial Overlap', color: 'bg-orange-100 text-orange-800' };
      case 'contained': return { text: 'Contained Within', color: 'bg-yellow-100 text-yellow-800' };
      case 'contains': return { text: 'Contains Existing', color: 'bg-purple-100 text-purple-800' };
      default: return { text: 'Conflict', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleChoiceChange = (shiftId: string, action: string, editData?: any) => {
    setChoices(prev => ({ 
      ...prev, 
      [shiftId]: { action, editData } 
    }));
  };

  const handleBatchAction = (action: string) => {
    const batchChoices: Record<string, { action: string }> = {};
    conflictShifts.forEach(conflict => {
      if (action === 'auto-split' && conflict.overlapType !== 'partial') {
        batchChoices[conflict.id] = { action: 'skip' };
      } else {
        batchChoices[conflict.id] = { action: action === 'auto-split' ? 'split' : action };
      }
    });
    setChoices(prev => ({ ...prev, ...batchChoices }));
  };

  const handleEditShift = (shiftId: string, startTime: string, endTime: string) => {
    handleChoiceChange(shiftId, 'edit', { startTime, endTime });
    setEditingShift(null);
  };

  const handleSubmit = () => {
    const updateChoices: UpdateChoice[] = conflicts.map(conflict => {
      const choice = choices[conflict.id];
      return {
        shiftId: conflict.id,
        action: (choice?.action || 'skip') as 'replace' | 'skip' | 'split' | 'edit',
        editedShift: choice?.editData,
      };
    });
    
    onChoicesMade(updateChoices);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Time Overlap Detected ({conflictShifts.length} conflicts)
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {conflictShifts.length} shift{conflictShifts.length !== 1 ? 's' : ''} overlap with existing schedule. 
            Choose how to resolve each conflict:
          </p>
        </DialogHeader>

        {/* Batch Actions */}
        {conflictShifts.length > 1 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Batch Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBatchAction('replace')}
                >
                  Replace All Conflicts
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBatchAction('skip')}
                >
                  Skip All Conflicts
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBatchAction('auto-split')}
                >
                  Auto-Split Where Possible
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {conflictShifts.map((conflict) => {
            const overlapDisplay = getOverlapTypeDisplay(conflict.overlapType || '');
            const choice = choices[conflict.id];
            
            return (
              <Card key={conflict.id} className="border-amber-200">
                <CardContent className="p-4">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {formatDate(conflict.newShift.date)}
                      </Badge>
                      <span className="font-medium">{conflict.newShift.clientName}</span>
                      <Badge className={overlapDisplay.color}>
                        {overlapDisplay.text}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-red-50 p-3 rounded">
                        <div className="font-medium text-red-700 mb-1">Existing Shift</div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {conflict.existingShift?.startTime} - {conflict.existingShift?.endTime}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded">
                        <div className="font-medium text-green-700 mb-1">New Entry</div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {conflict.newShift.startTime} - {conflict.newShift.endTime}
                        </div>
                      </div>
                    </div>
                  </div>

                  {editingShift === conflict.id ? (
                    <EditShiftForm
                      initialStart={conflict.newShift.startTime}
                      initialEnd={conflict.newShift.endTime}
                      onSave={(start, end) => handleEditShift(conflict.id, start, end)}
                      onCancel={() => setEditingShift(null)}
                    />
                  ) : (
                    <RadioGroup
                      value={choice?.action || 'replace'}
                      onValueChange={(value) => handleChoiceChange(conflict.id, value)}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2 p-2 rounded hover:bg-red-50">
                        <RadioGroupItem value="replace" id={`replace-${conflict.id}`} />
                        <Label htmlFor={`replace-${conflict.id}`} className="flex items-center gap-2 cursor-pointer">
                          <RotateCcw className="w-4 h-4 text-red-500" />
                          <div>
                            <div className="font-medium">Replace</div>
                            <div className="text-sm text-muted-foreground">
                              Delete conflicting shift(s) and save new one
                            </div>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                        <RadioGroupItem value="skip" id={`skip-${conflict.id}`} />
                        <Label htmlFor={`skip-${conflict.id}`} className="flex items-center gap-2 cursor-pointer">
                          <X className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">Skip</div>
                            <div className="text-sm text-muted-foreground">
                              Ignore this new shift, keep existing schedule
                            </div>
                          </div>
                        </Label>
                      </div>

                      {conflict.overlapType === 'partial' && (
                        <div className="flex items-center space-x-2 p-2 rounded hover:bg-blue-50">
                          <RadioGroupItem value="split" id={`split-${conflict.id}`} />
                          <Label htmlFor={`split-${conflict.id}`} className="flex items-center gap-2 cursor-pointer">
                            <Scissors className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="font-medium">Split</div>
                              <div className="text-sm text-muted-foreground">
                                Auto-trim to non-overlapping portions
                              </div>
                            </div>
                          </Label>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 p-2 rounded hover:bg-green-50">
                        <RadioGroupItem value="edit" id={`edit-${conflict.id}`} />
                        <Label htmlFor={`edit-${conflict.id}`} className="flex items-center gap-2 cursor-pointer">
                          <Edit2 className="w-4 h-4 text-green-500" />
                          <div>
                            <div className="font-medium">Edit</div>
                            <div className="text-sm text-muted-foreground">
                              Manually adjust times and recheck
                            </div>
                          </div>
                        </Label>
                      </div>

                      {choice?.action === 'edit' && choice.editData && (
                        <div className="ml-6 p-2 bg-green-50 rounded text-sm">
                          Edited to: {choice.editData.startTime} - {choice.editData.endTime}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="ml-2"
                            onClick={() => setEditingShift(conflict.id)}
                          >
                            Change
                          </Button>
                        </div>
                      )}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Preview Summary</h4>
          <div className="text-sm text-green-700">
            <div>✅ {newShifts.length} shift{newShifts.length !== 1 ? 's' : ''} ready to save</div>
            <div>⚠️ {conflictShifts.length} conflict{conflictShifts.length !== 1 ? 's' : ''} need resolution</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Apply Choices & Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EditShiftFormProps {
  initialStart: string;
  initialEnd: string;
  onSave: (startTime: string, endTime: string) => void;
  onCancel: () => void;
}

function EditShiftForm({ initialStart, initialEnd, onSave, onCancel }: EditShiftFormProps) {
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);

  return (
    <div className="space-y-3 p-3 bg-green-50 rounded">
      <div className="flex gap-2">
        <div>
          <Label htmlFor="start-time" className="text-sm">Start Time</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-24"
          />
        </div>
        <div>
          <Label htmlFor="end-time" className="text-sm">End Time</Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-24"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(startTime, endTime)}>
          Save Changes
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}