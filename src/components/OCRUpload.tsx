import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOCR } from '@/hooks/useOCR';
import { useShifts } from '@/hooks/useShifts';
import { OCRResult, ShiftFormData } from '@/types/shift';
import { Upload, FileImage, AlertCircle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const OCRUpload = () => {
  const { extractShiftsFromImage, loading, progress } = useOCR();
  const { addMultipleShifts, settings } = useShifts();
  const { toast } = useToast();
  
  const [extractedShifts, setExtractedShifts] = useState<(OCRResult & { hourlyRate: number; isPaid: boolean })[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG, PNG) or PDF file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const results = await extractShiftsFromImage(file);
      
      if (results.length === 0) {
        toast({
          title: "No shifts found",
          description: "Could not extract shift data from the image. Try manual entry instead.",
          variant: "destructive",
        });
        return;
      }

      // Add default values for hourly rate and payment status
      const shiftsWithDefaults = results.map(shift => ({
        ...shift,
        hourlyRate: settings.defaultHourlyRate,
        isPaid: false,
      }));

      setExtractedShifts(shiftsWithDefaults);
      
      toast({
        title: "Shifts extracted successfully",
        description: `Found ${results.length} shift${results.length === 1 ? '' : 's'}. Review and save below.`,
      });
    } catch (error) {
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Failed to process the image",
        variant: "destructive",
      });
    }
  }, [extractShiftsFromImage, settings.defaultHourlyRate, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const updateShift = (index: number, field: string, value: string | number | boolean) => {
    setExtractedShifts(prev => prev.map((shift, i) => 
      i === index ? { ...shift, [field]: value } : shift
    ));
  };

  const removeShift = (index: number) => {
    setExtractedShifts(prev => prev.filter((_, i) => i !== index));
  };

  const saveAllShifts = () => {
    if (extractedShifts.length === 0) return;

    const shiftsToSave: ShiftFormData[] = extractedShifts.map(shift => ({
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      clientName: shift.clientName,
      location: shift.location,
      hourlyRate: shift.hourlyRate,
      isPaid: shift.isPaid,
    }));

    try {
      const savedShifts = addMultipleShifts(shiftsToSave);
      
      toast({
        title: "Shifts saved successfully",
        description: `Added ${savedShifts.length} shift${savedShifts.length === 1 ? '' : 's'} to your records`,
      });

      setExtractedShifts([]);
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your shifts",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Rota Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {loading ? 'Processing image...' : 'Drop your rota here or click to browse'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Supports JPG, PNG, and PDF files up to 10MB
            </p>
            
            {loading ? (
              <div className="space-y-2">
                <Progress value={progress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-muted-foreground">{progress}% complete</p>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <Button asChild variant="outline" disabled={loading}>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extracted Shifts */}
      {extractedShifts.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Extracted Shifts ({extractedShifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-accent/20 border border-accent/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Review and edit before saving</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    OCR may not be 100% accurate. Please verify all details before saving.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {extractedShifts.map((shift, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Shift {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeShift(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={shift.date}
                        onChange={(e) => updateShift(index, 'date', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      <Input
                        type="time"
                        value={shift.startTime}
                        onChange={(e) => updateShift(index, 'startTime', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">End Time</Label>
                      <Input
                        type="time"
                        value={shift.endTime}
                        onChange={(e) => updateShift(index, 'endTime', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Hourly Rate (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={shift.hourlyRate}
                        onChange={(e) => updateShift(index, 'hourlyRate', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Client Name</Label>
                      <Input
                        type="text"
                        value={shift.clientName}
                        onChange={(e) => updateShift(index, 'clientName', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Location (Optional)</Label>
                      <Input
                        type="text"
                        value={shift.location || ''}
                        onChange={(e) => updateShift(index, 'location', e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setExtractedShifts([])}
              >
                Clear All
              </Button>
              <Button
                onClick={saveAllShifts}
                variant="success"
              >
                Save All Shifts ({extractedShifts.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OCRUpload;