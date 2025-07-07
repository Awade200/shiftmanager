import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useShifts } from '@/hooks/useShifts';
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { useNameAnonymization } from '@/hooks/useNameAnonymization';
import { ShiftFormData } from '@/types/shift';

interface ParsedShift {
  id: string;
  date: string;
  clientName: string;
  startTime: string;
  endTime: string;
  location?: string;
  hourlyRate: number;
  needsLocation: boolean;
  isEditing: boolean;
}

export default function PasteShifts() {
  const [inputText, setInputText] = useState('');
  const [parsedShifts, setParsedShifts] = useState<ParsedShift[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { addMultipleShifts, settings } = useShifts();
  const { findClientLocation, saveClientProfile } = useClientProfiles();
  const { anonymizeName } = useNameAnonymization();

  const parseShiftsFromText = async (text: string): Promise<ParsedShift[]> => {
    const lines = text.split('\n').filter(line => line.trim());
    const shifts: ParsedShift[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Pattern: DD/MM/YYYY ClientName HH:MM - HH:MM
      const match = trimmed.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
      
      if (match) {
        const [, dateStr, clientName, startTime, endTime] = match;
        
        // Convert date format from DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = dateStr.split('/');
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        // Anonymize the client name for privacy
        const originalClientName = clientName.trim();
        const displayClientName = anonymizeName(originalClientName);
        
        // Check for existing location using original name
        const existingLocation = findClientLocation(originalClientName);
        
        const shift: ParsedShift = {
          id: Math.random().toString(36).substr(2, 9),
          date: formattedDate,
          clientName: displayClientName,
          startTime: normalizeTime(startTime),
          endTime: normalizeTime(endTime),
          location: existingLocation || undefined,
          hourlyRate: settings.defaultHourlyRate,
          needsLocation: !existingLocation,
          isEditing: false
        };
        
        shifts.push(shift);
      }
    }

    return shifts;
  };

  const normalizeTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const handleProcess = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No text to process",
        description: "Please paste your shift data first.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const shifts = await parseShiftsFromText(inputText);
      
      if (shifts.length === 0) {
        toast({
          title: "No shifts found",
          description: "Please check your text format. Expected: DD/MM/YYYY ClientName HH:MM - HH:MM",
          variant: "destructive"
        });
      } else {
        setParsedShifts(shifts);
        toast({
          title: "Shifts extracted",
          description: `Found ${shifts.length} shifts. Review and save when ready.`,
        });
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "There was an error processing your text.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditShift = (id: string, field: string, value: string) => {
    setParsedShifts(prev => prev.map(shift => 
      shift.id === id 
        ? { ...shift, [field]: value, needsLocation: field === 'location' ? !value : shift.needsLocation }
        : shift
    ));
  };

  const toggleEdit = (id: string) => {
    setParsedShifts(prev => prev.map(shift => 
      shift.id === id ? { ...shift, isEditing: !shift.isEditing } : shift
    ));
  };

  const removeShift = (id: string) => {
    setParsedShifts(prev => prev.filter(shift => shift.id !== id));
  };

  const handleSaveShifts = async () => {
    const shiftsWithMissingLocations = parsedShifts.filter(shift => shift.needsLocation);
    
    if (shiftsWithMissingLocations.length > 0) {
      toast({
        title: "Missing locations",
        description: `${shiftsWithMissingLocations.length} shifts need locations. Please fill them in first.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const shiftFormData: ShiftFormData[] = parsedShifts.map(shift => ({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        clientName: shift.clientName,
        location: shift.location!,
        hourlyRate: shift.hourlyRate,
        isPaid: false
      }));

      await addMultipleShifts(shiftFormData);

      // Save new client-location mappings
      // Note: We store the display name since we don't have access to original names here
      for (const shift of parsedShifts) {
        if (shift.location && settings.autoSaveClientLocations) {
          await saveClientProfile(shift.clientName, shift.location);
        }
      }

      toast({
        title: "Shifts saved",
        description: `Successfully saved ${parsedShifts.length} shifts.`,
      });

      // Reset form
      setInputText('');
      setParsedShifts([]);
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your shifts.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Paste Shifts</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paste Shift Data</CardTitle>
          <div className="text-sm text-muted-foreground">
            Paste your shift data in the format: <code>DD/MM/YYYY ClientName HH:MM - HH:MM</code>
            <br />
            Example: <code>01/07/2025 Liam Thompson 08:00 - 12:00</code>
            <br />
            <div className="flex items-center gap-2 mt-2 text-xs">
              <Badge variant="secondary">Privacy Protected</Badge>
              Real names are automatically replaced with fake ones for security
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="01/07/2025 Liam Thompson 08:00 - 12:00&#10;01/07/2025 Ava Williams 12:00 - 16:00&#10;02/07/2025 Noah Johnson 09:00 - 14:00"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
          <Button 
            onClick={handleProcess} 
            disabled={isProcessing || !inputText.trim()}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Process Shifts"}
          </Button>
        </CardContent>
      </Card>

      {parsedShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Extracted Shifts ({parsedShifts.length})
              <Button onClick={handleSaveShifts} variant="success">
                Save All Shifts
              </Button>
            </CardTitle>
            {parsedShifts.some(shift => shift.needsLocation) && (
              <Alert>
                <AlertDescription>
                  Some shifts need locations. Click the edit button to add missing locations.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {parsedShifts.map((shift) => (
                <Card key={shift.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{new Date(shift.date).toLocaleDateString()}</span>
                      {shift.needsLocation && (
                        <Badge variant="destructive">Missing Location</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEdit(shift.id)}
                      >
                        {shift.isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeShift(shift.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {shift.isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label>Client Name</Label>
                        <Input
                          value={shift.clientName}
                          onChange={(e) => handleEditShift(shift.id, 'clientName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Location {shift.needsLocation && <span className="text-destructive">*</span>}</Label>
                        <Input
                          value={shift.location || ''}
                          onChange={(e) => handleEditShift(shift.id, 'location', e.target.value)}
                          placeholder="Enter location"
                        />
                      </div>
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => handleEditShift(shift.id, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => handleEditShift(shift.id, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Client:</span>
                        <div className="font-medium">{shift.clientName}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <div className="font-medium">
                          {shift.location || <span className="text-destructive">Not set</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <div className="font-medium">{shift.startTime} - {shift.endTime}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">{calculateDuration(shift.startTime, shift.endTime).toFixed(2)}h</div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}