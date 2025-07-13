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
import { useDuplicateHandling } from '@/hooks/useDuplicateHandling';
import { ShiftFormData } from '@/types/shift';
import { DuplicateCheckResult, UpdateChoice } from '@/types/duplicateHandling';
import DuplicateHandlingModal from '@/components/DuplicateHandlingModal';
import ShiftPreviewSummary from '@/components/ShiftPreviewSummary';

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
  const [duplicateResults, setDuplicateResults] = useState<DuplicateCheckResult[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { settings } = useShifts();
  const { findClientLocation, saveClientProfile } = useClientProfiles();
  const { anonymizeName } = useNameAnonymization();
  const { checkForDuplicates, processShiftsWithChoices } = useDuplicateHandling();

  const parseShiftsFromText = async (text: string): Promise<ParsedShift[]> => {
    const lines = text.split('\n').filter(line => line.trim());
    const shifts: ParsedShift[] = [];
    const originalNameMapping = new Map<string, string>(); // displayName -> originalName

    console.log('Parsing text with lines:', lines);

    // Try Employee Timesheet format first
    const timesheetShifts = parseEmployeeTimesheetFormat(lines);
    if (timesheetShifts.length > 0) {
      console.log('Found Employee Timesheet format shifts:', timesheetShifts);
      for (const shift of timesheetShifts) {
        const displayClientName = anonymizeName(shift.clientName);
        originalNameMapping.set(displayClientName, shift.clientName);
        const existingLocation = findClientLocation(shift.clientName);
        
        shifts.push({
          id: Math.random().toString(36).substr(2, 9),
          date: shift.date,
          clientName: displayClientName,
          startTime: shift.startTime,
          endTime: shift.endTime,
          location: existingLocation || shift.location,
          hourlyRate: settings.defaultHourlyRate,
          needsLocation: !existingLocation && !shift.location,
          isEditing: false
        });
      }
    } else {
      // Fallback to original format parsing
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Strict pattern: DD/MM/YYYY ClientName HH:MM - HH:MM (must use hyphen, not en dash)
        // More flexible with client name to handle multiple words
        const match = trimmed.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
        
        if (match) {
          const [, dateStr, clientName, startTime, endTime] = match;
          
          // Validate time format is strict HH:MM
          if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
            console.warn(`Skipping invalid time format: ${startTime} - ${endTime}`);
            continue; // Skip invalid time formats
          }
          
          // Convert date format from DD/MM/YYYY to YYYY-MM-DD
          const [day, month, year] = dateStr.split('/');
          const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          
          // Anonymize the client name for privacy
          const originalClientName = clientName.trim();
          const displayClientName = anonymizeName(originalClientName);
          
          // Store mapping for later use
          originalNameMapping.set(displayClientName, originalClientName);
          
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
          console.log(`Extracted shift: ${formattedDate} ${displayClientName} ${startTime}-${endTime}`);
        } else {
          console.warn(`Failed to parse line: ${trimmed}`);
        }
      }
    }

    // Store the original name mappings for use in save function
    (parseShiftsFromText as any).originalNameMapping = originalNameMapping;
    
    console.log('Final parsed shifts:', shifts);
    return shifts;
  };

  const parseEmployeeTimesheetFormat = (lines: string[]): Array<{
    date: string;
    clientName: string;
    startTime: string;
    endTime: string;
    location?: string;
  }> => {
    const shifts: Array<{
      date: string;
      clientName: string;
      startTime: string;
      endTime: string;
      location?: string;
    }> = [];
    
    let currentDate = '';
    let currentDay = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log(`Processing line ${i}: "${line}"`);
      
      // Look for day pattern: "Monday", "Tuesday", etc.
      const dayMatch = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s|$)/i);
      if (dayMatch) {
        currentDay = dayMatch[1];
        console.log('Found day:', currentDay);
        
        // Check if the line also contains client code and service info
        const dayWithServiceMatch = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+([A-Z0-9]+)\s+(.+?)\s+(\d+\.?\d*)$/i);
        if (dayWithServiceMatch) {
          // Day + service on same line, look for date on next line
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const dateMatch = nextLine.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (dateMatch) {
              currentDate = dateMatch[1];
              console.log('Found date:', currentDate);
              i++; // Skip the date line
            }
          }
        }
        continue;
      }
      
      // Look for standalone date
      const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})(?:\s|$)/);
      if (dateMatch) {
        currentDate = dateMatch[1];
        console.log('Found standalone date:', currentDate);
        continue;
      }
      
      // Look for client code + service type + quantity pattern
      const clientServiceMatch = line.match(/^([A-Z0-9]+)\s+(.+?)\s+(\d+\.?\d*)$/);
      if (clientServiceMatch) {
        const [, clientCode, serviceType, quantity] = clientServiceMatch;
        console.log(`Found client service: ${clientCode}, ${serviceType}, ${quantity}`);
        
        // Look for client name and time on next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const clientTimeMatch = nextLine.match(/^(.+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
          if (clientTimeMatch) {
            const [, clientName, startTime, endTime] = clientTimeMatch;
            
            if (currentDate) {
              // Convert date format from DD/MM/YYYY to YYYY-MM-DD
              const [day, month, year] = currentDate.split('/');
              const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              
              const shift = {
                date: formattedDate,
                clientName: clientName.trim(),
                startTime: normalizeTime(startTime),
                endTime: normalizeTime(endTime),
                location: serviceType.trim()
              };
              
              shifts.push(shift);
              console.log('Added Employee Timesheet shift:', shift);
            }
            i++; // Skip the client+time line
          }
        }
        continue;
      }
      
      // Alternative: Look for standalone client name + time pattern (for cases where service info is on a previous line)
      const clientTimeMatch = line.match(/^(.+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
      if (clientTimeMatch && currentDate) {
        const [, clientName, startTime, endTime] = clientTimeMatch;
        
        // Look backwards for the most recent service info
        let serviceType = 'Supported Living Day Shift';
        
        for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
          const prevLine = lines[j];
          const serviceMatch = prevLine.match(/^([A-Z0-9]+)\s+(.+?)\s+(\d+\.?\d*)$/);
          if (serviceMatch) {
            serviceType = serviceMatch[2].trim();
            break;
          }
        }
        
        // Convert date format from DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = currentDate.split('/');
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const shift = {
          date: formattedDate,
          clientName: clientName.trim(),
          startTime: normalizeTime(startTime),
          endTime: normalizeTime(endTime),
          location: serviceType
        };
        
        shifts.push(shift);
        console.log('Added alternative Employee Timesheet shift:', shift);
      }
    }
    
    console.log(`Employee Timesheet parser found ${shifts.length} shifts`);
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
        return;
      }

      // Convert to ShiftFormData for duplicate checking
      const shiftFormData: ShiftFormData[] = shifts.map(shift => ({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        clientName: shift.clientName,
        location: shift.location || '',
        hourlyRate: shift.hourlyRate,
        isPaid: false
      }));

      // Check for duplicates
      const results = await checkForDuplicates(shiftFormData);
      setDuplicateResults(results);
      setParsedShifts(shifts);

      // Check if there are conflicts that need user input
      const conflicts = results.filter(r => r.status === 'potential_update');
      if (conflicts.length > 0) {
        setShowConflictModal(true);
      }

      toast({
        title: "Shifts analyzed",
        description: `Found ${shifts.length} shifts. ${conflicts.length} conflicts need resolution.`,
      });
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

  const handleConflictChoices = async (choices: UpdateChoice[]) => {
    try {
      const summary = await processShiftsWithChoices(duplicateResults, choices);
      
      // Save client-location mappings
      const originalNameMapping = (parseShiftsFromText as any).originalNameMapping as Map<string, string>;
      for (const shift of parsedShifts) {
        if (shift.location && settings.autoSaveClientLocations) {
          const originalName = originalNameMapping.get(shift.clientName) || shift.clientName;
          await saveClientProfile(originalName, shift.location);
        }
      }

      toast({
        title: "Shifts processed successfully",
        description: `${summary.newShifts} new, ${summary.updatedShifts} updated, ${summary.skippedShifts} skipped.`,
      });

      // Reset form
      setInputText('');
      setParsedShifts([]);
      setDuplicateResults([]);
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDirectSave = async () => {
    // Handle cases where no conflicts exist
    const nonConflictResults = duplicateResults.filter(r => r.status !== 'potential_update');
    const defaultChoices: UpdateChoice[] = nonConflictResults.map(result => ({
      shiftId: result.id,
      action: 'update' // This won't be used for non-conflict items
    }));

    await handleConflictChoices(defaultChoices);
  };

  const canSaveDirectly = duplicateResults.filter(r => r.status === 'potential_update').length === 0 && 
                         duplicateResults.filter(r => r.status === 'needs_location').length === 0;

  const hasLocationIssues = duplicateResults.some(r => r.status === 'needs_location');

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
            <strong>Requirements:</strong> Use strict time format (e.g., 08:00 not 8:00) and hyphen (-) not en dash (–)
            <br />
            Example: <code>01/07/2025 Liam Thompson 08:00 - 12:00</code>
            <br />
            <div className="flex items-center gap-2 mt-2 text-xs">
              <Badge variant="secondary">Privacy Protected</Badge>
              Real names are automatically replaced with fake ones for security
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <Badge variant="outline">Smart Location Mapping</Badge>
              Known clients auto-fill locations; unknown ones are flagged for manual entry
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

      {duplicateResults.length > 0 && (
        <ShiftPreviewSummary results={duplicateResults} />
      )}

      {parsedShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Extracted Shifts ({parsedShifts.length})
              <div className="flex gap-2">
                {canSaveDirectly && !hasLocationIssues && (
                  <Button onClick={handleDirectSave} variant="default">
                    Save All Shifts
                  </Button>
                )}
                {hasLocationIssues && (
                  <Button disabled variant="outline">
                    Fix Locations First
                  </Button>
                )}
                {duplicateResults.filter(r => r.status === 'potential_update').length > 0 && (
                  <Button onClick={() => setShowConflictModal(true)} variant="secondary">
                    Resolve Conflicts ({duplicateResults.filter(r => r.status === 'potential_update').length})
                  </Button>
                )}
              </div>
            </CardTitle>
            
            {hasLocationIssues && (
              <Alert>
                <AlertDescription>
                  Some shifts need locations. Edit the shifts below to add missing locations.
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

      <DuplicateHandlingModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        conflicts={duplicateResults.filter(r => r.status === 'potential_update')}
        onChoicesMade={handleConflictChoices}
      />
    </div>
  );
}