import { useShifts } from '@/hooks/useShifts';
import { useTaxCalculation } from '@/hooks/useTaxCalculation';
import StatsCard from '@/components/StatsCard';
import TaxCalculator from '@/components/TaxCalculator';
import CalendarWidget from '@/components/CalendarWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Clock, DollarSign, CheckCircle, AlertCircle, Plus, Download, Calendar, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { getShiftStats, settings, updateSettings, exportToCSV } = useShifts();
  const { taxSettings, calculateTax } = useTaxCalculation();
  const [newHourlyRate, setNewHourlyRate] = useState(settings.defaultHourlyRate.toString());
  const { toast } = useToast();
  
  const stats = getShiftStats();
  
  // Calculate tax for current period's earnings
  const grossPay = taxSettings.payFrequency === 'weekly' 
    ? stats.totalEarnings 
    : stats.totalEarnings; // For simplicity, using total earnings
  
  const taxCalculation = calculateTax(grossPay);

  const handleUpdateHourlyRate = () => {
    const rate = parseFloat(newHourlyRate);
    if (rate > 0) {
      updateSettings({ defaultHourlyRate: rate });
      toast({
        title: "Hourly rate updated",
        description: `Default hourly rate set to £${rate.toFixed(2)}`,
      });
    }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = exportToCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shifts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Your shift data has been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your work shifts and earnings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button asChild variant="default">
            <Link to="/add-shift">
              <Plus className="w-4 h-4 mr-2" />
              Add Shift
            </Link>
          </Button>
        </div>
      </div>

      {/* Calendar Widget - Always at the top */}
      <CalendarWidget />

      {/* Essential Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Hours"
          value={stats.totalHours.toFixed(1)}
          subtitle={`${stats.totalShifts} shifts recorded`}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatsCard
          title="Total Earnings"
          value={`£${stats.totalEarnings.toFixed(2)}`}
          subtitle="Gross earnings"
          icon={<DollarSign className="w-4 h-4" />}
          variant="success"
        />
        <StatsCard
          title="Paid"
          value={`£${stats.paidEarnings.toFixed(2)}`}
          subtitle={`${stats.paidShifts} shifts paid`}
          icon={<CheckCircle className="w-4 h-4" />}
          variant="success"
        />
        <StatsCard
          title="Unpaid"
          value={`£${stats.unpaidEarnings.toFixed(2)}`}
          subtitle={`${stats.unpaidShifts} shifts pending`}
          icon={<AlertCircle className="w-4 h-4" />}
          variant="warning"
        />
      </div>

      {/* Compact Settings */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="hourlyRate" className="text-sm font-medium">Default Hourly Rate (£)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleUpdateHourlyRate} variant="outline" size="sm">
              Update Rate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;