import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, Copy, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { extractShiftsAuto, ParseResult, ShiftRow } from '@/lib/shiftParser';
import { useOCR } from '@/hooks/useOCR';
import { useToast } from '@/hooks/use-toast';

interface SmartShiftUploadProps {
  onTextExtracted: (rawText: string, warnings: string[]) => void;
}

export function SmartShiftUpload({ onTextExtracted }: SmartShiftUploadProps) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const { extractShiftsFromImage, loading: ocrLoading, progress } = useOCR();
  const { toast } = useToast();

  const handleTextParse = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No text provided",
        description: "Please paste some text to parse",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = extractShiftsAuto(inputText, 'paste');
      setLastResult(result);
      
      if (result.shifts.length === 0) {
        toast({
          title: "No shifts found",
          description: "Could not extract any shifts from the provided text. Please check the format.",
          variant: "destructive"
        });
      } else {
        onTextExtracted(inputText, result.warnings);
        toast({
          title: "Shifts extracted",
          description: `Found ${result.shifts.length} shifts`,
        });
      }
    } catch (error) {
      console.error('Text parsing error:', error);
      toast({
        title: "Parsing failed",
        description: "An error occurred while parsing the text",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Extract raw text from PDF
      const rawText = await extractShiftsFromImage(file);
      console.log('PDF raw text extracted:', rawText);

      // Parse with our smart engine
      const result = extractShiftsAuto(rawText, 'pdf');
      setLastResult(result);
      
      if (result.shifts.length === 0) {
        toast({
          title: "No shifts found in PDF",
          description: "Could not extract any shifts from the PDF. Try uploading as an image instead.",
          variant: "destructive"
        });
      } else {
        onTextExtracted(rawText, result.warnings);
        toast({
          title: "PDF processed",
          description: `Extracted ${result.shifts.length} shifts from PDF`,
        });
      }
    } catch (error) {
      console.error('PDF processing error:', error);
      toast({
        title: "PDF processing failed",
        description: "Could not process the PDF file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use OCR to extract raw text from image
      const rawText = await extractShiftsFromImage(file);
      console.log('Image raw text extracted:', rawText);

      // Parse with our smart engine
      const result = extractShiftsAuto(rawText, 'ocr');
      setLastResult(result);
      
      if (result.shifts.length === 0) {
        toast({
          title: "No shifts found in image",
          description: "Could not extract any shifts from the image. Try improving image quality or paste text instead.",
          variant: "destructive"
        });
      } else {
        onTextExtracted(rawText, result.warnings);
        toast({
          title: "Image processed",
          description: `Extracted ${result.shifts.length} shifts from image using OCR`,
        });
      }
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        title: "Image processing failed",
        description: "Could not process the image file",
        variant: "destructive"
      });
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const isLoading = isProcessing || ocrLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Smart Shift Extraction
          </CardTitle>
          <CardDescription>
            Paste text, upload PDF, or scan image - automatically detects format and extracts all shifts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Paste Text</label>
            <Textarea
              placeholder="Paste your rota text here... Supports any format including stacked blocks, tables, or raw copy-paste from PDFs"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <Button 
              onClick={handleTextParse}
              disabled={isLoading || !inputText.trim()}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Parsing Text...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Parse Text
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-4">
            {/* PDF Upload */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePDFUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
            </div>

            {/* Image Upload */}
            <div className="flex-1">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
                disabled={isLoading}
                className="w-full"
              >
                <Image className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>

          {/* OCR Progress */}
          {ocrLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing with OCR... {Math.round(progress)}%
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Summary */}
          {lastResult && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Extraction Results</h4>
                <Badge variant={lastResult.shifts.length > 0 ? "default" : "destructive"}>
                  {lastResult.shifts.length} shifts found
                </Badge>
              </div>
              
              {lastResult.shifts.length > 0 && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Hours:</span>
                    <div className="font-medium">
                      {lastResult.shifts.reduce((sum, shift) => sum + shift.hours, 0).toFixed(1)}h
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clients:</span>
                    <div className="font-medium">
                      {new Set(lastResult.shifts.map(s => s.clientName)).size}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days:</span>
                    <div className="font-medium">
                      {new Set(lastResult.shifts.map(s => s.date)).size}
                    </div>
                  </div>
                </div>
              )}

              {lastResult.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {lastResult.warnings.map((warning, idx) => (
                        <div key={idx} className="text-sm">{warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {lastResult.debugInfo.unknownLines.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Debug Info ({lastResult.debugInfo.processedLines}/{lastResult.debugInfo.totalLines} lines processed)
                  </summary>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <div>Unknown lines sample:</div>
                    {lastResult.debugInfo.unknownLines.map((line, idx) => (
                      <div key={idx} className="font-mono bg-muted px-2 py-1 rounded">
                        {line}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}