import React, { useState, useEffect } from 'react';
import { Upload, FileText, Camera, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useUploadSession } from '@/hooks/useUploadSession';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { useDayManagement } from '@/hooks/useDayManagement';
import { useToast } from '@/hooks/use-toast';
import { DayCard } from '@/components/DayCard';
import { UnresolvedShifts } from '@/components/UnresolvedShifts';
import { ParsedDay, DayAction } from '@/types/day';

export default function UploadSession() {
  const [uploadText, setUploadText] = useState('');
  const { user } = useMobileAuth();
  const mobileNumber = user?.mobile_number || '';
  const [selectedActions, setSelectedActions] = useState<Record<string, DayAction['type']>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  const {
    currentSession,
    parsedDays,
    unresolvedShifts,
    isProcessing,
    startUploadSession,
    parseUploadedData,
    processDayActions,
    clearSession
  } = useUploadSession(mobileNumber);
  
  const { cleanupEmptyDays } = useDayManagement(mobileNumber);
  const { toast } = useToast();

  const handleCleanup = async () => {
    try {
      setIsCleaningUp(true);
      const deletedCount = await cleanupEmptyDays();
      
      toast({
        title: "Cleanup Complete",
        description: `Removed ${deletedCount} empty day record${deletedCount !== 1 ? 's' : ''}`,
      });
    } catch (err) {
      toast({
        title: "Cleanup Failed",
        description: err instanceof Error ? err.message : "Failed to cleanup data",
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Initialize upload session
  useEffect(() => {
    const initSession = async () => {
      try {
        await startUploadSession(mobileNumber);
      } catch (err) {
        console.error('Failed to start upload session:', err);
      }
    };
    
    if (!currentSession) {
      initSession();
    }
  }, [currentSession, mobileNumber, startUploadSession]);

  const handleTextUpload = async () => {
    if (!uploadText.trim() || !currentSession) return;
    
    try {
      setIsUploading(true);
      await parseUploadedData(uploadText, mobileNumber, currentSession.id);
      
      // Initialize default actions (merge)
      const defaultActions: Record<string, DayAction['type']> = {};
      parsedDays.forEach(day => {
        defaultActions[day.date] = 'merge';
      });
      setSelectedActions(defaultActions);
      
      toast({
        title: "Upload successful",
        description: `Found ${parsedDays.length} days with shifts`
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to parse uploaded data",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleActionChange = (dayDate: string, action: DayAction['type']) => {
    setSelectedActions(prev => ({
      ...prev,
      [dayDate]: action
    }));
  };

  const handleBulkAction = (action: DayAction['type']) => {
    const bulkActions: Record<string, DayAction['type']> = {};
    parsedDays.forEach(day => {
      bulkActions[day.date] = action;
    });
    setSelectedActions(bulkActions);
  };

  const handleSaveAll = async () => {
    if (!currentSession || parsedDays.length === 0) return;
    
    try {
      setIsUploading(true);
      
      // Convert selected actions to DayAction format
      const actions: DayAction[] = parsedDays.map(day => ({
        type: selectedActions[day.date] || 'merge',
        day_date: day.date,
        shifts: day.shifts.filter(s => s.status === 'ready').map(shift => ({
          id: shift.id,
          day_id: '', // Will be set by the backend
          user_id: '',
          date: day.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          client_name: shift.client_name,
          location: shift.location || '',
          hourly_rate: 25, // Default rate
          duration: 0, // Will be calculated
          earnings: 0, // Will be calculated
          is_paid: false,
          status: 'ready',
          mobile_number: mobileNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      }));

      const result = await processDayActions(actions, mobileNumber, currentSession.id);
      
      toast({
        title: "Shifts saved successfully",
        description: `${result.saved} days saved, ${result.skipped} skipped${result.errors.length > 0 ? `, ${result.errors.length} errors` : ''}`
      });
      
      if (result.errors.length > 0) {
        console.error('Save errors:', result.errors);
      }
      
      // Clear the session after successful save
      clearSession();
      setUploadText('');
      setSelectedActions({});
      
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Failed to save shifts",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getSessionStats = () => {
    const totalDays = parsedDays.length;
    const mergeDays = Object.values(selectedActions).filter(a => a === 'merge').length;
    const replaceDays = Object.values(selectedActions).filter(a => a === 'replace').length;
    const skipDays = Object.values(selectedActions).filter(a => a === 'skip').length;
    
    return { totalDays, mergeDays, replaceDays, skipDays };
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to upload shifts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Smart Shift Upload</h1>
        <p className="text-muted-foreground">
          Upload your rota data and organize by days automatically
        </p>
      </div>

      {/* Cleanup Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Have incomplete data? Clean up empty day records before uploading.</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCleanup}
            disabled={isCleaningUp}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isCleaningUp ? 'Cleaning...' : 'Cleanup'}
          </Button>
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      {parsedDays.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Rota Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                placeholder="Paste your rota text here..."
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleTextUpload}
                disabled={!uploadText.trim() || isUploading || isProcessing}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isUploading || isProcessing ? 'Processing...' : 'Parse Text'}
              </Button>
              
              <Button variant="outline" disabled>
                <Camera className="h-4 w-4 mr-2" />
                Scan Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unresolved Shifts */}
      {unresolvedShifts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {unresolvedShifts.length} shifts have missing or invalid data and need attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Session Summary */}
      {parsedDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upload Session Summary</span>
              <Badge variant="outline">
                {parsedDays.length} days found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {getSessionStats().totalDays}
                </div>
                <div className="text-sm text-muted-foreground">Total Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getSessionStats().mergeDays}
                </div>
                <div className="text-sm text-muted-foreground">Merge</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {getSessionStats().replaceDays}
                </div>
                <div className="text-sm text-muted-foreground">Replace</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {getSessionStats().skipDays}
                </div>
                <div className="text-sm text-muted-foreground">Skip</div>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('merge')}
              >
                Merge All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('replace')}
              >
                Replace All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('skip')}
              >
                Skip All
              </Button>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSaveAll}
              disabled={isUploading || Object.values(selectedActions).every(a => a === 'skip')}
              className="w-full"
              size="lg"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isUploading ? 'Saving...' : 'Save Selected Days'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Day Cards */}
      {parsedDays.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Parsed Days</h2>
          <div className="grid gap-4">
            {parsedDays.map((day) => (
              <div key={day.date} className="space-y-2">
                <DayCard
                  day={{
                    id: day.date,
                    mobile_number: mobileNumber,
                    day_date: day.date,
                    total_hours: day.total_hours,
                    shift_count: day.shifts.length,
                    has_conflicts: day.has_conflicts,
                    has_unresolved: day.has_unresolved,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }}
                  onOpenDay={(dayDate) => setSelectedDayDate(dayDate)}
                  onReplaceDay={() => handleActionChange(day.date, 'replace')}
                  onMergeDay={() => handleActionChange(day.date, 'merge')}
                  onSkipDay={() => handleActionChange(day.date, 'skip')}
                  isUploadSession={true}
                />
                
                {/* Action Selection */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant={selectedActions[day.date] === 'merge' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleActionChange(day.date, 'merge')}
                  >
                    Merge
                  </Button>
                  <Button
                    variant={selectedActions[day.date] === 'replace' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleActionChange(day.date, 'replace')}
                  >
                    Replace
                  </Button>
                  <Button
                    variant={selectedActions[day.date] === 'skip' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleActionChange(day.date, 'skip')}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Session Button */}
      {(parsedDays.length > 0 || unresolvedShifts.length > 0) && (
        <div className="flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => {
              clearSession();
              setUploadText('');
              setSelectedActions({});
            }}
          >
            Start Over
          </Button>
        </div>
      )}

      {/* Day Detail Dialog */}
      <Dialog open={selectedDayDate !== null} onOpenChange={(open) => !open && setSelectedDayDate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDayDate && `Shifts for ${new Date(selectedDayDate).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}`}
            </DialogTitle>
          </DialogHeader>
          {selectedDayDate && (
            <div className="space-y-4">
              {parsedDays.find(d => d.date === selectedDayDate)?.shifts.map((shift, idx) => (
                <Card key={shift.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="font-semibold text-lg">{shift.client_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {shift.start_time} - {shift.end_time}
                        </div>
                        {shift.location && (
                          <div className="text-sm text-muted-foreground">{shift.location}</div>
                        )}
                      </div>
                      <Badge variant={shift.status === 'ready' ? 'default' : 'destructive'}>
                        {shift.status}
                      </Badge>
                    </div>
                    {shift.errors && shift.errors.length > 0 && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {shift.errors.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}