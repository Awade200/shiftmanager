import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning';
  icon?: React.ReactNode;
}

const StatsCard = ({ title, value, subtitle, variant = 'default', icon }: StatsCardProps) => {
  return (
    <Card className={cn(
      "shadow-card hover:shadow-lg transition-all duration-200",
      variant === 'success' && "border-success/20 bg-gradient-to-br from-success/5 to-transparent",
      variant === 'warning' && "border-warning/20 bg-gradient-to-br from-warning/5 to-transparent"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            variant === 'success' && "bg-success/10 text-success",
            variant === 'warning' && "bg-warning/10 text-warning",
            variant === 'default' && "bg-primary/10 text-primary"
          )}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;