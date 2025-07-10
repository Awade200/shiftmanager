import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DuplicateCheckResult } from '@/types/duplicateHandling';
import { CheckCircle, RotateCcw, X, AlertTriangle } from 'lucide-react';

interface ShiftPreviewSummaryProps {
  results: DuplicateCheckResult[];
}

export default function ShiftPreviewSummary({ results }: ShiftPreviewSummaryProps) {
  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'potential_update':
        return <RotateCcw className="w-4 h-4 text-blue-500" />;
      case 'duplicate':
        return <X className="w-4 h-4 text-gray-500" />;
      case 'needs_location':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'New (to be added)';
      case 'potential_update':
        return 'Update (hours will change)';
      case 'duplicate':
        return 'Duplicate (skipped)';
      case 'needs_location':
        return 'Needs location';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'default' as const;
      case 'potential_update':
        return 'secondary' as const;
      case 'duplicate':
        return 'outline' as const;
      case 'needs_location':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Calculate totals
  const newShifts = results.filter(r => r.status === 'new').length;
  const updateShifts = results.filter(r => r.status === 'potential_update').length;
  const duplicateShifts = results.filter(r => r.status === 'duplicate').length;
  const needsLocationShifts = results.filter(r => r.status === 'needs_location').length;

  const newHours = results
    .filter(r => r.status === 'new')
    .reduce((sum, r) => sum + calculateDuration(r.newShift.startTime, r.newShift.endTime), 0);
    
  const updateHours = results
    .filter(r => r.status === 'potential_update')
    .reduce((sum, r) => sum + calculateDuration(r.newShift.startTime, r.newShift.endTime), 0);
    
  const duplicateHours = results
    .filter(r => r.status === 'duplicate')
    .reduce((sum, r) => sum + calculateDuration(r.newShift.startTime, r.newShift.endTime), 0);

  const totalHours = newHours + updateHours + duplicateHours;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Import Preview & Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Shifts List */}
        <div className="space-y-2 mb-6">
          {results.map((result, index) => (
            <div key={result.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <span className="font-medium">
                    {formatDate(result.newShift.date)} – {result.newShift.clientName}
                  </span>
                  <div className="text-sm text-muted-foreground">
                    {result.newShift.startTime} – {result.newShift.endTime}
                    {result.status === 'potential_update' && result.existingShift && (
                      <span className="text-blue-600 ml-2">
                        (was {result.existingShift.startTime} – {result.existingShift.endTime})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant={getStatusVariant(result.status)}>
                {getStatusLabel(result.status)}
              </Badge>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{newShifts}</div>
            <div className="text-sm text-muted-foreground">New shifts</div>
            <div className="text-xs font-medium">{newHours.toFixed(1)}h</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{updateShifts}</div>
            <div className="text-sm text-muted-foreground">Updates</div>
            <div className="text-xs font-medium">+{updateHours.toFixed(1)}h</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{duplicateShifts}</div>
            <div className="text-sm text-muted-foreground">Skipped</div>
            <div className="text-xs font-medium">{duplicateHours.toFixed(1)}h</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Total hours</div>
            {needsLocationShifts > 0 && (
              <div className="text-xs text-destructive font-medium">
                {needsLocationShifts} need location
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}