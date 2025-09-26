import { TrendingUp, Clock, DollarSign, AlertCircle, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
  progress?: number;
  target?: string;
}

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  change, 
  changeLabel,
  icon, 
  variant = 'default',
  progress,
  target
}: KPICardProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'border-success/20 bg-gradient-to-br from-success/5 to-transparent';
      case 'warning':
        return 'border-warning/20 bg-gradient-to-br from-warning/5 to-transparent';
      case 'info':
        return 'border-info/20 bg-gradient-to-br from-info/5 to-transparent';
      default:
        return 'border-primary/10 bg-gradient-card';
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'info':
        return 'bg-info/10 text-info';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <Card className={cn(
      "shadow-1 hover:shadow-2 transition-all duration-300 hover:scale-[1.02]",
      getVariantClasses()
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          getIconClasses()
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-foreground">{value}</div>
          {target && (
            <div className="text-sm text-muted-foreground">/ {target}</div>
          )}
        </div>
        
        {progress !== undefined && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {progress}% of target
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {change !== undefined && (
            <Badge 
              variant={change >= 0 ? 'success' : 'destructive'}
              className="text-xs"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {change >= 0 ? '+' : ''}{change}%
              {changeLabel && <span className="ml-1">{changeLabel}</span>}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface KPIGridProps {
  data: {
    totalHours: number;
    totalEarnings: number;
    paidPercentage: number;
    unpaidCount: number;
    averageRate: number;
    overtimeHours: number;
    weeklyTarget?: number;
    monthlyTarget?: number;
  };
}

export const KPIGrid = ({ data }: KPIGridProps) => {
  const weeklyProgress = data.weeklyTarget 
    ? Math.round((data.totalHours / data.weeklyTarget) * 100)
    : undefined;

  const kpis: KPICardProps[] = [
    {
      title: 'Total Hours',
      value: data.totalHours.toFixed(1),
      subtitle: 'This period',
      icon: <Clock className="w-5 h-5" />,
      variant: 'info',
      progress: weeklyProgress,
      target: data.weeklyTarget ? `${data.weeklyTarget}h` : undefined,
      change: 12,
      changeLabel: 'vs last week'
    },
    {
      title: 'Total Earnings',
      value: `£${data.totalEarnings.toLocaleString()}`,
      subtitle: 'Gross amount',
      icon: <DollarSign className="w-5 h-5" />,
      variant: 'success',
      change: 8.5,
      changeLabel: 'vs last period'
    },
    {
      title: 'Paid Status',
      value: `${data.paidPercentage}%`,
      subtitle: 'Of total earnings',
      icon: <Target className="w-5 h-5" />,
      variant: data.paidPercentage >= 90 ? 'success' : data.paidPercentage >= 70 ? 'warning' : 'default',
      progress: data.paidPercentage
    },
    {
      title: 'Unpaid Shifts',
      value: data.unpaidCount,
      subtitle: 'Awaiting payment',
      icon: <AlertCircle className="w-5 h-5" />,
      variant: data.unpaidCount > 5 ? 'warning' : 'default',
      change: data.unpaidCount > 0 ? -15 : 0,
      changeLabel: 'from last week'
    },
    {
      title: 'Average Rate',
      value: `£${data.averageRate.toFixed(2)}`,
      subtitle: 'Per hour',
      icon: <TrendingUp className="w-5 h-5" />,
      variant: 'info',
      change: 5.2,
      changeLabel: 'improvement'
    },
    {
      title: 'Overtime Hours',
      value: data.overtimeHours.toFixed(1),
      subtitle: 'Extra earnings opportunity',
      icon: <Calendar className="w-5 h-5" />,
      variant: data.overtimeHours > 0 ? 'success' : 'default',
      change: data.overtimeHours > 0 ? 25 : 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
};