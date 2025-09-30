import React, { useState } from 'react';
import { SmartShiftUpload } from '@/components/SmartShiftUpload';
import { ShiftPreview } from '@/components/ShiftPreview';
import { ShiftRow, extractShiftsAuto } from '@/lib/shiftParser';
import { ShiftFormData } from '@/types/shift';
import { useShifts } from '@/hooks/useShifts';
import { useToast } from '@/hooks/use-toast';

export default function PasteShifts() {
  const [extractedShifts, setExtractedShifts] = useState<ShiftRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { addMultipleShifts } = useShifts();
  const { toast } = useToast();

  const handleTextExtracted = (rawText: string, extractionWarnings: string[]) => {
    // Parse the raw text to get ShiftRow[]
    const result = extractShiftsAuto(rawText, 'paste');
    setExtractedShifts(result.shifts);
    setWarnings([...extractionWarnings, ...result.warnings]);
  };

  const handleShiftsUpdated = (shifts: ShiftRow[]) => {
    setExtractedShifts(shifts);
  };

  const handleSave = async (shiftFormData: ShiftFormData[]) => {
    try {
      await addMultipleShifts(shiftFormData);
      toast({
        title: "Shifts saved successfully",
        description: `${shiftFormData.length} shifts have been added to your database`,
      });
      
      // Clear the extracted shifts after successful save
      setExtractedShifts([]);
      setWarnings([]);
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Save failed",
        description: "Could not save shifts to database",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Smart Shift Extraction</h1>
        <p className="text-muted-foreground">
          Paste text, upload PDF, or scan image - automatically detects format and extracts all shifts
        </p>
      </div>

      <SmartShiftUpload onTextExtracted={handleTextExtracted} />
      
      {extractedShifts.length > 0 && (
        <ShiftPreview 
          shifts={extractedShifts}
          onShiftsUpdated={handleShiftsUpdated}
          onSave={handleSave}
        />
      )}
    </div>
  );
}