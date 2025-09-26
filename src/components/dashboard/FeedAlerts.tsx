import { AlertTriangle, Clock, DollarSign, Calendar, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'unpaid' | 'overlap' | 'missing_rate' | 'reminder';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  actionLabel: string;
  onAction: () => void;
  onDismiss?: () => void;
  data?: any;
}

interface FeedAlertsProps {
  alerts: Alert[];
  onDismissAll?: () => void;
}

export const FeedAlerts = ({ alerts, onDismissAll }: FeedAlertsProps) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'unpaid':
        return <DollarSign className="w-4 h-4" />;
      case 'overlap':
        return <AlertTriangle className="w-4 h-4" />;
      case 'missing_rate':
        return <Clock className="w-4 h-4" />;
      case 'reminder':
        return <Calendar className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityVariant = (severity: Alert['severity']): 'destructive' | 'warning' | 'default' => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSeverityClasses = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent';
      case 'medium':
        return 'border-warning/20 bg-gradient-to-br from-warning/5 to-transparent';
      default:
        return 'border-border';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="shadow-1">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="w-12 h-12 text-success mb-3" />
          <h3 className="font-semibold text-foreground mb-1">All caught up!</h3>
          <p className="text-sm text-muted-foreground text-center">
            No pending actions required. Your shifts are in good shape.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-1 hover:shadow-2 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Needs Action
            <Badge variant="warning" className="ml-2">
              {alerts.length}
            </Badge>
          </CardTitle>
          {onDismissAll && alerts.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismissAll}
              className="text-xs"
            >
              Dismiss All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={cn(
              "p-4 rounded-lg border transition-all duration-200 hover:shadow-1",
              getSeverityClasses(alert.severity)
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                alert.severity === 'high' && "bg-destructive/10 text-destructive",
                alert.severity === 'medium' && "bg-warning/10 text-warning",
                alert.severity === 'low' && "bg-muted text-muted-foreground"
              )}>
                {getAlertIcon(alert.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-foreground text-sm">
                    {alert.title}
                  </h4>
                  <Badge variant={getSeverityVariant(alert.severity)} className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {alert.description}
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={alert.severity === 'high' ? 'default' : 'outline'}
                    onClick={alert.onAction}
                    className="text-xs"
                  >
                    {alert.actionLabel}
                  </Button>
                  
                  {alert.onDismiss && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={alert.onDismiss}
                      className="h-8 w-8"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};