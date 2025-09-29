import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Users,
  BarChart3,
  Target,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDayManagement } from '@/hooks/useDayManagement';
import { Day } from '@/types/day';
import { 
  format, 
  parseISO, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  subWeeks,
  subMonths,
  isWithinInterval,
  differenceInDays
} from 'date-fns';

interface HistoricalAnalysisProps {
  className?: string;
}

interface WeeklyComparison {
  week: string;
  totalHours: number;
  totalEarnings: number;
  shiftCount: number;
  avgHoursPerDay: number;
  daysWorked: number;
}

interface MonthlyTrend {
  month: string;
  totalHours: number;
  totalEarnings: number;
  avgDailyHours: number;
  bestDay: { date: string; hours: number } | null;
  worstDay: { date: string; hours: number } | null;
}

export function HistoricalAnalysis({ className }: HistoricalAnalysisProps) {
  const { days, loading, dayStats } = useDayManagement();

  // Calculate weekly comparisons (last 8 weeks)
  const weeklyComparisons = useMemo((): WeeklyComparison[] => {
    const weeks: WeeklyComparison[] = [];
    const now = new Date();
    
    for (let i = 0; i < 8; i++) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      
      const weekDays = days.filter(day => {
        const dayDate = parseISO(day.day_date);
        return isWithinInterval(dayDate, { start: weekStart, end: weekEnd });
      });
      
      const totalHours = weekDays.reduce((sum, day) => sum + day.total_hours, 0);
      const shiftCount = weekDays.reduce((sum, day) => sum + day.shift_count, 0);
      const daysWorked = weekDays.filter(day => day.shift_count > 0).length;
      
      weeks.push({
        week: `Week of ${format(weekStart, 'MMM d')}`,
        totalHours,
        totalEarnings: totalHours * 25,
        shiftCount,
        avgHoursPerDay: daysWorked > 0 ? totalHours / daysWorked : 0,
        daysWorked
      });
    }
    
    return weeks.reverse();
  }, [days]);

  // Calculate monthly trends (last 6 months)
  const monthlyTrends = useMemo((): MonthlyTrend[] => {
    const months: MonthlyTrend[] = [];
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      
      const monthDays = days.filter(day => {
        const dayDate = parseISO(day.day_date);
        return isWithinInterval(dayDate, { start: monthStart, end: monthEnd });
      });
      
      const totalHours = monthDays.reduce((sum, day) => sum + day.total_hours, 0);
      const workingDays = monthDays.filter(day => day.shift_count > 0);
      
      // Find best and worst days
      let bestDay = null;
      let worstDay = null;
      
      if (workingDays.length > 0) {
        const sortedByHours = [...workingDays].sort((a, b) => b.total_hours - a.total_hours);
        bestDay = {
          date: sortedByHours[0].day_date,
          hours: sortedByHours[0].total_hours
        };
        worstDay = {
          date: sortedByHours[sortedByHours.length - 1].day_date,
          hours: sortedByHours[sortedByHours.length - 1].total_hours
        };
      }
      
      months.push({
        month: format(monthStart, 'MMM yyyy'),
        totalHours,
        totalEarnings: totalHours * 25,
        avgDailyHours: workingDays.length > 0 ? totalHours / workingDays.length : 0,
        bestDay,
        worstDay
      });
    }
    
    return months.reverse();
  }, [days]);

  // Calculate performance insights
  const insights = useMemo(() => {
    if (weeklyComparisons.length < 2) return null;
    
    const thisWeek = weeklyComparisons[weeklyComparisons.length - 1];
    const lastWeek = weeklyComparisons[weeklyComparisons.length - 2];
    const avgWeeklyHours = weeklyComparisons.reduce((sum, week) => sum + week.totalHours, 0) / weeklyComparisons.length;
    
    const hoursChange = thisWeek.totalHours - lastWeek.totalHours;
    const hoursChangePercent = lastWeek.totalHours > 0 ? (hoursChange / lastWeek.totalHours) * 100 : 0;
    
    const earningsChange = thisWeek.totalEarnings - lastWeek.totalEarnings;
    
    // Find most productive day of week
    const dayOfWeekStats = days.reduce((stats, day) => {
      const dayOfWeek = format(parseISO(day.day_date), 'EEEE');
      if (!stats[dayOfWeek]) {
        stats[dayOfWeek] = { totalHours: 0, count: 0 };
      }
      stats[dayOfWeek].totalHours += day.total_hours;
      stats[dayOfWeek].count += day.shift_count > 0 ? 1 : 0;
      return stats;
    }, {} as Record<string, { totalHours: number; count: number }>);
    
    const bestDayOfWeek = Object.entries(dayOfWeekStats)
      .map(([day, stats]) => ({
        day,
        avgHours: stats.count > 0 ? stats.totalHours / stats.count : 0
      }))
      .sort((a, b) => b.avgHours - a.avgHours)[0];
    
    return {
      hoursChange,
      hoursChangePercent,
      earningsChange,
      avgWeeklyHours,
      bestDayOfWeek: bestDayOfWeek?.day || 'N/A',
      isImproving: hoursChange > 0,
      consistencyScore: Math.max(0, 100 - (Math.abs(hoursChangePercent) * 2)) // Simple consistency metric
    };
  }, [weeklyComparisons, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Performance Overview */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Week Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">
                    {insights.hoursChange > 0 ? '+' : ''}{insights.hoursChange.toFixed(1)}h
                  </div>
                  <Badge variant={insights.isImproving ? 'default' : 'secondary'} className="text-xs">
                    {insights.hoursChangePercent > 0 ? '+' : ''}{insights.hoursChangePercent.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Weekly Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.avgWeeklyHours.toFixed(1)}h</div>
                <div className="text-sm text-muted-foreground">per week</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Best Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.bestDayOfWeek}</div>
                <div className="text-sm text-muted-foreground">most productive</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Consistency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.consistencyScore.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">reliability score</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weekly Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Comparison (Last 8 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyComparisons.map((week, index) => {
                const isCurrentWeek = index === weeklyComparisons.length - 1;
                const prevWeek = index > 0 ? weeklyComparisons[index - 1] : null;
                const change = prevWeek ? week.totalHours - prevWeek.totalHours : 0;
                
                return (
                  <div
                    key={week.week}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      isCurrentWeek ? 'bg-primary/5 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{week.week}</div>
                        <div className="text-sm text-muted-foreground">
                          {week.daysWorked} days worked
                        </div>
                      </div>
                      {change !== 0 && (
                        <Badge variant={change > 0 ? 'default' : 'secondary'} className="text-xs">
                          {change > 0 ? '+' : ''}{change.toFixed(1)}h
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{week.totalHours.toFixed(1)}h</div>
                      <div className="text-sm text-muted-foreground">
                        £{week.totalEarnings.toFixed(0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Trends (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrends.map((month) => (
                <div
                  key={month.month}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-muted-foreground">
                      Avg: {month.avgDailyHours.toFixed(1)}h per working day
                    </div>
                    {month.bestDay && month.worstDay && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Best: {format(parseISO(month.bestDay.date), 'MMM d')} ({month.bestDay.hours.toFixed(1)}h) • 
                        Worst: {format(parseISO(month.worstDay.date), 'MMM d')} ({month.worstDay.hours.toFixed(1)}h)
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{month.totalHours.toFixed(1)}h</div>
                    <div className="text-sm text-muted-foreground">
                      £{month.totalEarnings.toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievement Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dayStats.total_hours >= 100 && (
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl">🎯</div>
                  <div className="font-medium">Century Club</div>
                  <div className="text-sm text-muted-foreground">100+ hours logged</div>
                </div>
              )}
              
              {dayStats.total_days >= 30 && (
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl">📅</div>
                  <div className="font-medium">Dedicated Worker</div>
                  <div className="text-sm text-muted-foreground">30+ working days</div>
                </div>
              )}
              
              {insights?.consistencyScore >= 80 && (
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl">⭐</div>
                  <div className="font-medium">Consistent Performer</div>
                  <div className="text-sm text-muted-foreground">High reliability</div>
                </div>
              )}
              
              {weeklyComparisons.some(week => week.totalHours >= 40) && (
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl">💪</div>
                  <div className="font-medium">Full Time</div>
                  <div className="text-sm text-muted-foreground">40+ hour week</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}