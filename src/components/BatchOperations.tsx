import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock,
  Filter,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDayManagement } from '@/hooks/useDayManagement';
import { useToast } from '@/hooks/use-toast';
import { useShifts } from '@/hooks/useShifts';
import { Day } from '@/types/day';
import { format, parseISO, isWithinInterval, subDays, subWeeks, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface BatchOperationsProps {
  className?: string;
}

type DateRange = {
  from: Date;
  to: Date;
};

type BatchAction = 'export' | 'delete' | 'mark-paid' | 'duplicate';

export function BatchOperations({ className }: BatchOperationsProps) {
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subWeeks(new Date(), 2),
    to: new Date()
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'conflicts' | 'unresolved'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const { days, loading } = useDayManagement();
  const { settings } = useShifts();
  const { toast } = useToast();

  // Filter days based on criteria
  const filteredDays = useMemo(() => {
    return days.filter(day => {
      const dayDate = parseISO(day.day_date);
      
      // Date range filter
      const withinRange = isWithinInterval(dayDate, { start: dateRange.from, end: dateRange.to });
      if (!withinRange) return false;
      
      // Status filter
      switch (statusFilter) {
        case 'conflicts':
          return day.has_conflicts;
        case 'unresolved':
          return day.has_unresolved;
        case 'ready':
          return !day.has_conflicts && !day.has_unresolved && day.shift_count > 0;
        default:
          return true;
      }
    });
  }, [days, dateRange, statusFilter]);

  // Calculate statistics for selected days
  const selectedStats = useMemo(() => {
    const selected = filteredDays.filter(day => selectedDays.has(day.id));
    return {
      count: selected.length,
      totalHours: selected.reduce((sum, day) => sum + day.total_hours, 0),
      totalShifts: selected.reduce((sum, day) => sum + day.shift_count, 0),
      estimatedEarnings: selected.reduce((sum, day) => sum + (day.total_hours * settings.defaultHourlyRate), 0),
      conflicts: selected.filter(day => day.has_conflicts).length,
      unresolved: selected.filter(day => day.has_unresolved).length
    };
  }, [filteredDays, selectedDays]);

  const handleSelectAll = () => {
    if (selectedDays.size === filteredDays.length) {
      setSelectedDays(new Set());
    } else {
      setSelectedDays(new Set(filteredDays.map(day => day.id)));
    }
  };

  const handleSelectDay = (dayId: string) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(dayId)) {
      newSelected.delete(dayId);
    } else {
      newSelected.add(dayId);
    }
    setSelectedDays(newSelected);
  };

  const handleQuickSelect = (period: 'week' | 'month' | '3months') => {
    const now = new Date();
    let from: Date;
    
    switch (period) {
      case 'week':
        from = subWeeks(now, 1);
        break;
      case 'month':
        from = subMonths(now, 1);
        break;
      case '3months':
        from = subMonths(now, 3);
        break;
    }
    
    setDateRange({ from, to: now });
  };

  const handleBatchAction = async (action: BatchAction) => {
    if (selectedDays.size === 0) {
      toast({
        title: "No days selected",
        description: "Please select some days to perform batch operations",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      switch (action) {
        case 'export':
          await handleExport();
          break;
        case 'delete':
          await handleDelete();
          break;
        case 'mark-paid':
          await handleMarkPaid();
          break;
        case 'duplicate':
          await handleDuplicate();
          break;
      }
    } catch (err) {
      toast({
        title: "Operation failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    const selectedData = filteredDays.filter(day => selectedDays.has(day.id));
    
    const csvContent = [
      ['Date', 'Total Hours', 'Shift Count', 'Estimated Earnings', 'Status'].join(','),
      ...selectedData.map(day => [
        day.day_date,
        day.total_hours.toFixed(1),
        day.shift_count,
        (day.total_hours * settings.defaultHourlyRate).toFixed(2),
        day.has_conflicts ? 'Conflicts' : day.has_unresolved ? 'Unresolved' : 'Ready'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `${selectedData.length} days exported to CSV`
    });
  };

  const handleDelete = async () => {
    // This would need to be implemented with proper confirmation
    toast({
      title: "Delete operation",
      description: "Delete functionality would be implemented here with proper confirmation",
    });
  };

  const handleMarkPaid = async () => {
    // This would need to be implemented to mark all shifts in selected days as paid
    toast({
      title: "Mark as paid",
      description: "Mark as paid functionality would be implemented here",
    });
  };

  const handleDuplicate = async () => {
    // This would allow duplicating selected days to different dates
    toast({
      title: "Duplicate operation",
      description: "Duplicate functionality would be implemented here",
    });
  };

  const getStatusBadge = (day: Day) => {
    if (day.has_conflicts) {
      return <Badge variant="destructive" className="text-xs">Conflicts</Badge>;
    }
    if (day.has_unresolved) {
      return <Badge variant="secondary" className="text-xs">Issues</Badge>;
    }
    if (day.shift_count > 0) {
      return <Badge variant="default" className="text-xs bg-success">Ready</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Empty</Badge>;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Batch Operations</h2>
        <p className="text-muted-foreground">
          Select multiple days to perform bulk operations
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="flex gap-2">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={format(dateRange.from, 'yyyy-MM-dd')}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                />
                <Input
                  type="date"
                  value={format(dateRange.to, 'yyyy-MM-dd')}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                />
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => handleQuickSelect('week')}>
                  Last Week
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSelect('month')}>
                  Last Month
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSelect('3months')}>
                  Last 3 Months
                </Button>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status Filter</Label>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                <SelectItem value="ready">Ready Days</SelectItem>
                <SelectItem value="conflicts">Days with Conflicts</SelectItem>
                <SelectItem value="unresolved">Days with Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {selectedDays.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{selectedStats.count}</div>
                <div className="text-sm text-muted-foreground">Days Selected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{selectedStats.totalHours.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedStats.totalShifts}</div>
                <div className="text-sm text-muted-foreground">Total Shifts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">£{selectedStats.estimatedEarnings.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Est. Earnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{selectedStats.conflicts + selectedStats.unresolved}</div>
                <div className="text-sm text-muted-foreground">Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleBatchAction('export')}
              disabled={selectedDays.size === 0 || isProcessing}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleBatchAction('mark-paid')}
              disabled={selectedDays.size === 0 || isProcessing}
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleBatchAction('duplicate')}
              disabled={selectedDays.size === 0 || isProcessing}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleBatchAction('delete')}
              disabled={selectedDays.size === 0 || isProcessing}
            >
              Delete Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Day List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Days ({filteredDays.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedDays.size === filteredDays.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDays.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No days found matching your filters
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {filteredDays.map((day) => (
                <div
                  key={day.id}
                  className={cn(
                    "flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-colors",
                    selectedDays.has(day.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  )}
                  onClick={() => handleSelectDay(day.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDays.has(day.id)}
                    onChange={() => handleSelectDay(day.id)}
                    className="rounded"
                  />
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    <div>
                      <div className="font-medium">{format(parseISO(day.day_date), 'EEE, MMM d')}</div>
                      <div className="text-sm text-muted-foreground">{day.day_date}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{day.total_hours.toFixed(1)}h</div>
                      <div className="text-sm text-muted-foreground">{day.shift_count} shifts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">£{(day.total_hours * settings.defaultHourlyRate).toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">estimated</div>
                    </div>
                    <div className="flex justify-center">
                      {getStatusBadge(day)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}