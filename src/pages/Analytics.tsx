import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, PoundSterling, Clock, Users, Calculator, Receipt } from 'lucide-react';
import { useShifts } from '@/hooks/useShifts';
import { useTaxCalculation } from '@/hooks/useTaxCalculation';
import { format, startOfWeek, startOfMonth, isAfter, isBefore } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Analytics() {
  const { shifts } = useShifts();
  const { calculateTax } = useTaxCalculation();

  const analytics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    // Filter shifts for current week and month
    const weekShifts = shifts.filter(shift => 
      isAfter(new Date(shift.date), weekStart) || 
      shift.date === format(weekStart, 'yyyy-MM-dd')
    );
    
    const monthShifts = shifts.filter(shift => 
      isAfter(new Date(shift.date), monthStart) || 
      shift.date === format(monthStart, 'yyyy-MM-dd')
    );

    // Calculate totals
    const weekStats = {
      hours: weekShifts.reduce((sum, shift) => sum + shift.duration, 0),
      gross: weekShifts.reduce((sum, shift) => sum + shift.earnings, 0),
      shifts: weekShifts.length
    };

    const monthStats = {
      hours: monthShifts.reduce((sum, shift) => sum + shift.duration, 0),
      gross: monthShifts.reduce((sum, shift) => sum + shift.earnings, 0),
      shifts: monthShifts.length
    };

    // Calculate tax deductions
    const weekTax = calculateTax(weekStats.gross);
    const monthTax = calculateTax(monthStats.gross);

    // Client breakdown
    const clientData = shifts.reduce((acc, shift) => {
      const existing = acc.find(item => item.name === shift.clientName);
      if (existing) {
        existing.hours += shift.duration;
        existing.earnings += shift.earnings;
      } else {
        acc.push({
          name: shift.clientName,
          hours: shift.duration,
          earnings: shift.earnings
        });
      }
      return acc;
    }, [] as { name: string; hours: number; earnings: number }[]);

    // Daily trends for last 7 days
    const dailyTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = shifts.filter(shift => shift.date === dateStr);
      
      return {
        date: format(date, 'EEE'),
        hours: dayShifts.reduce((sum, shift) => sum + shift.duration, 0),
        earnings: dayShifts.reduce((sum, shift) => sum + shift.earnings, 0),
        shifts: dayShifts.length
      };
    });

    return {
      weekStats,
      monthStats,
      weekTax,
      monthTax,
      clientData: clientData.slice(0, 6), // Top 6 clients
      dailyTrends
    };
  }, [shifts, calculateTax]);

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="This Week"
              value={`${analytics.weekStats.hours.toFixed(1)}h`}
              subtitle={`${analytics.weekStats.shifts} shifts`}
              icon={Clock}
            />
            <StatCard
              title="Week Gross"
              value={`£${analytics.weekStats.gross.toFixed(2)}`}
              subtitle={`£${analytics.weekTax.netPay.toFixed(2)} net`}
              icon={PoundSterling}
            />
            <StatCard
              title="This Month"
              value={`${analytics.monthStats.hours.toFixed(1)}h`}
              subtitle={`${analytics.monthStats.shifts} shifts`}
              icon={Clock}
            />
            <StatCard
              title="Month Gross"
              value={`£${analytics.monthStats.gross.toFixed(2)}`}
              subtitle={`£${analytics.monthTax.netPay.toFixed(2)} net`}
              icon={PoundSterling}
            />
          </div>

          {/* Tax Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Weekly Tax Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Gross Pay</span>
                  <span className="font-medium">£{analytics.weekStats.gross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Income Tax</span>
                  <span>-£{analytics.weekTax.incomeTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>National Insurance</span>
                  <span>-£{analytics.weekTax.nationalInsurance.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-green-600">
                  <span>Net Pay</span>
                  <span>£{analytics.weekTax.netPay.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Monthly Tax Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Gross Pay</span>
                  <span className="font-medium">£{analytics.monthStats.gross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Income Tax</span>
                  <span>-£{analytics.monthTax.incomeTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>National Insurance</span>
                  <span>-£{analytics.monthTax.nationalInsurance.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-green-600">
                  <span>Net Pay</span>
                  <span>£{analytics.monthTax.netPay.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Client Hours Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hours by Client</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.clientData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                    >
                      {analytics.clientData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Client Earnings Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings by Client</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.clientData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`£${Number(value).toFixed(2)}`, 'Earnings']} />
                    <Bar dataKey="earnings" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Daily Trends */}
          <Card>
            <CardHeader>
              <CardTitle>7-Day Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'earnings' ? `£${Number(value).toFixed(2)}` : `${value}${name === 'hours' ? 'h' : ''}`,
                      name === 'earnings' ? 'Earnings' : name === 'hours' ? 'Hours' : 'Shifts'
                    ]}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="earnings" stroke="hsl(var(--secondary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}