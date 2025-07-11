import { useShifts } from '@/hooks/useShifts';
import { useTaxCalculation } from '@/hooks/useTaxCalculation';
import StatsCard from '@/components/StatsCard';
import TaxCalculator from '@/components/TaxCalculator';
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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
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

      {/* Stats Grid */}
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

      {/* Tax Calculator */}
      {stats.totalEarnings > 0 && (
        <TaxCalculator 
          grossPay={grossPay}
          className="shadow-card"
        />
      )}

      {/* Net Pay Summary */}
      {stats.totalEarnings > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatsCard
            title={`Estimated Net Pay (${taxSettings.payFrequency})`}
            value={`£${taxCalculation.netPay.toFixed(2)}`}
            subtitle={`After tax & NI deductions`}
            icon={<Wallet className="w-4 h-4" />}
            variant="success"
          />
          <StatsCard
            title="Total Deductions"
            value={`£${taxCalculation.totalDeductions.toFixed(2)}`}
            subtitle={`Tax: £${taxCalculation.incomeTax.toFixed(2)} | NI: £${taxCalculation.nationalInsurance.toFixed(2)}`}
            icon={<DollarSign className="w-4 h-4" />}
            variant="warning"
          />
        </div>
      )}

      {/* Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="hourlyRate">Default Hourly Rate (£)</Label>
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
            <Button onClick={handleUpdateHourlyRate} variant="outline">
              Update Rate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {stats.totalShifts === 0 && (
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No shifts recorded yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding your first shift manually or upload a rota image</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild>
                <Link to="/add-shift">Add First Shift</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;