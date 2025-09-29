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
      case 'exact':
      case 'partial':
      case 'contained':
      case 'contains':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'New (to be added)';
      case 'exact':
        return 'Exact duplicate';
      case 'partial':
        return 'Partial overlap';
      case 'contained':
        return 'Contained within existing';
      case 'contains':
        return 'Contains existing shift';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'default' as const;
      case 'exact':
      case 'partial':
      case 'contained':
      case 'contains':
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
  const statusCounts = results.reduce((counts, shift) => {
    if (shift.status === 'exact' || shift.status === 'partial' || shift.status === 'contained' || shift.status === 'contains') {
      counts.conflicts++;
    } else {
      counts.new++;
    }
    return counts;
  }, { new: 0, conflicts: 0 });

  const newHours = results
    .filter(r => r.status === 'new')
    .reduce((sum, r) => sum + calculateDuration(r.newShift.startTime, r.newShift.endTime), 0);
    
  const conflictHours = results
    .filter(r => r.status !== 'new')
    .reduce((sum, r) => sum + calculateDuration(r.newShift.startTime, r.newShift.endTime), 0);

  const totalHours = newHours + conflictHours;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Import Preview & Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.new}</div>
            <div className="text-sm text-gray-600">New Shifts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.conflicts}</div>
            <div className="text-sm text-gray-600">Conflicts</div>
          </div>
        </div>

        {/* Shifts List */}
        <div className="space-y-2 mt-6">
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
                    {result.status !== 'new' && result.existingShift && (
                      <span className="text-yellow-600 ml-2">
                        (conflicts with {result.existingShift.startTime} – {result.existingShift.endTime})
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

        {/* Total Hours */}
        <div className="text-center mt-4 p-4 bg-muted/20 rounded-lg">
          <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Total hours</div>
          <div className="text-xs text-muted-foreground mt-1">
            {newHours.toFixed(1)}h new + {conflictHours.toFixed(1)}h conflicts
          </div>
        </div>
      </CardContent>
    </Card>
  );
}