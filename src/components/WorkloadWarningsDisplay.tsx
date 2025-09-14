import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkloadWarning } from '@/types/duplicateHandling';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  Calendar, 
  Zap,
  CheckCircle2 
} from 'lucide-react';

interface WorkloadWarningsDisplayProps {
  warnings: WorkloadWarning[];
  className?: string;
}

export function WorkloadWarningsDisplay({ warnings, className }: WorkloadWarningsDisplayProps) {
  if (warnings.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">No workload concerns detected</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getWarningIcon = (type: WorkloadWarning['type']) => {
    switch (type) {
      case 'short_shift': return Clock;
      case 'rapid_transitions': return Zap;
      case 'intensive_day': return Calendar;
      case 'excessive_hours': return AlertTriangle;
      case 'fragmented_schedule': return Users;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: WorkloadWarning['severity']) => {
    switch (severity) {
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityBadgeVariant = (severity: WorkloadWarning['severity']) => {
    switch (severity) {
      case 'low': return 'secondary' as const;
      case 'medium': return 'outline' as const;
      case 'high': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Workload Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {warnings.map((warning, index) => {
          const IconComponent = getWarningIcon(warning.type);
          const severityColor = getSeverityColor(warning.severity);
          
          return (
            <Alert key={index} className={`${severityColor} border`}>
              <IconComponent className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{warning.message}</p>
                    <Badge variant={getSeverityBadgeVariant(warning.severity)}>
                      {warning.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {warning.affectedShifts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Affected shifts:</p>
                      <div className="flex flex-wrap gap-1">
                        {warning.affectedShifts.map((shift, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {shift}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {warning.suggestions && warning.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Suggestions:</p>
                      <ul className="text-sm space-y-1">
                        {warning.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-xs mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}