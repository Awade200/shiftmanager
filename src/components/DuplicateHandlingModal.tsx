import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DuplicateCheckResult, UpdateChoice } from '@/types/duplicateHandling';
import { AlertTriangle, Clock, RotateCcw, Plus, X } from 'lucide-react';

interface DuplicateHandlingModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: DuplicateCheckResult[];
  onChoicesMade: (choices: UpdateChoice[]) => void;
}

export default function DuplicateHandlingModal({
  isOpen,
  onClose,
  conflicts,
  onChoicesMade,
}: DuplicateHandlingModalProps) {
  const [choices, setChoices] = useState<Record<string, string>>({});

  const handleChoiceChange = (shiftId: string, action: string) => {
    setChoices(prev => ({ ...prev, [shiftId]: action }));
  };

  const handleSubmit = () => {
    const updateChoices: UpdateChoice[] = conflicts.map(conflict => ({
      shiftId: conflict.id,
      action: (choices[conflict.id] || 'update') as 'update' | 'keep_both' | 'skip',
    }));
    
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Time Conflicts Detected
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Some shifts have different times than existing entries. Choose how to handle each conflict:
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <Card key={conflict.id} className="border-yellow-200">
              <CardContent className="p-4">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      {formatDate(conflict.newShift.date)}
                    </Badge>
                    <span className="font-medium">{conflict.newShift.clientName}</span>
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

                <RadioGroup
                  value={choices[conflict.id] || 'update'}
                  onValueChange={(value) => handleChoiceChange(conflict.id, value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 p-2 rounded hover:bg-blue-50">
                    <RadioGroupItem value="update" id={`update-${conflict.id}`} />
                    <Label htmlFor={`update-${conflict.id}`} className="flex items-center gap-2 cursor-pointer">
                      <RotateCcw className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-medium">Update existing hours</div>
                        <div className="text-sm text-muted-foreground">
                          Change to {conflict.newShift.startTime} - {conflict.newShift.endTime}
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 rounded hover:bg-green-50">
                    <RadioGroupItem value="keep_both" id={`keep-${conflict.id}`} />
                    <Label htmlFor={`keep-${conflict.id}`} className="flex items-center gap-2 cursor-pointer">
                      <Plus className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="font-medium">Keep both shifts</div>
                        <div className="text-sm text-muted-foreground">
                          Store as separate shift blocks
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                    <RadioGroupItem value="skip" id={`skip-${conflict.id}`} />
                    <Label htmlFor={`skip-${conflict.id}`} className="flex items-center gap-2 cursor-pointer">
                      <X className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-medium">Skip this new entry</div>
                        <div className="text-sm text-muted-foreground">
                          Keep existing shift unchanged
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Apply Choices
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}