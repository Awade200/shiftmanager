import { useState } from 'react';
import { Shift } from '@/types/shift';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Edit, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShiftTableProps {
  shifts: Shift[];
  onEdit: (shift: Shift) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
}

const ShiftTable = ({ shifts, onEdit, onDelete, onMarkPaid }: ShiftTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Filter and sort shifts
  const filteredShifts = shifts
    .filter(shift => {
      const matchesSearch = 
        shift.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shift.location?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'paid' && shift.isPaid) ||
        (statusFilter === 'unpaid' && !shift.isPaid);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'earnings-desc':
          return b.earnings - a.earnings;
        case 'earnings-asc':
          return a.earnings - b.earnings;
        case 'client':
          return a.clientName.localeCompare(b.clientName);
        default:
          return 0;
      }
    });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  if (shifts.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="text-center py-8">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No shifts recorded</h3>
          <p className="text-muted-foreground">Start by adding your first shift</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Filter Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by client name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="unpaid">Unpaid Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="earnings-desc">Highest Earnings</SelectItem>
                <SelectItem value="earnings-asc">Lowest Earnings</SelectItem>
                <SelectItem value="client">Client Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredShifts.length} of {shifts.length} shifts
      </div>

      {/* Shifts List */}
      <div className="space-y-3">
        {filteredShifts.map((shift) => (
          <Card key={shift.id} className="shadow-card hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date and Client */}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(shift.date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {shift.clientName}
                    </p>
                    {shift.location && (
                      <p className="text-xs text-muted-foreground">
                        {shift.location}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {shift.duration.toFixed(1)} hours
                    </p>
                  </div>

                  {/* Rate and Earnings */}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      £{shift.earnings.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @ £{shift.hourlyRate.toFixed(2)}/hr
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={shift.isPaid ? "default" : "secondary"}
                      className={cn(
                        shift.isPaid 
                          ? "bg-success text-success-foreground" 
                          : "bg-warning/10 text-warning border-warning/20"
                      )}
                    >
                      {shift.isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(shift)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {!shift.isPaid && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkPaid(shift.id)}
                      className="text-success hover:text-success"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(shift.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredShifts.length === 0 && searchTerm && (
        <Card className="shadow-card">
          <CardContent className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No matching shifts</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShiftTable;