import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useShifts } from '@/hooks/useShifts';
import { format, parseISO } from 'date-fns';

interface GroupedShift {
  date: string;
  location: string;
  shifts: Array<{
    id: string;
    startTime: string;
    endTime: string;
    clientName: string;
    duration: number;
    earnings: number;
  }>;
  totalHours: number;
  totalEarnings: number;
  uniqueClients: string[];
}

export default function GroupedShifts() {
  const { shifts, loading } = useShifts();
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  // Get unique locations and clients for filters
  const { uniqueLocations, uniqueClients } = useMemo(() => {
    const locations = new Set<string>();
    const clients = new Set<string>();
    
    shifts.forEach(shift => {
      if (shift.location) locations.add(shift.location);
      clients.add(shift.clientName);
    });
    
    return {
      uniqueLocations: Array.from(locations).sort(),
      uniqueClients: Array.from(clients).sort()
    };
  }, [shifts]);

  // Group shifts by date and location
  const groupedShifts = useMemo(() => {
    let filteredShifts = shifts;

    // Apply filters
    if (dateFilter) {
      filteredShifts = filteredShifts.filter(shift => 
        shift.date.includes(dateFilter)
      );
    }
    if (locationFilter) {
      filteredShifts = filteredShifts.filter(shift => 
        shift.location === locationFilter
      );
    }
    if (clientFilter) {
      filteredShifts = filteredShifts.filter(shift => 
        shift.clientName.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    const groups = new Map<string, GroupedShift>();

    filteredShifts.forEach(shift => {
      const key = `${shift.date}-${shift.location || 'No Location'}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          date: shift.date,
          location: shift.location || 'No Location',
          shifts: [],
          totalHours: 0,
          totalEarnings: 0,
          uniqueClients: []
        });
      }

      const group = groups.get(key)!;
      group.shifts.push({
        id: shift.id,
        startTime: shift.startTime,
        endTime: shift.endTime,
        clientName: shift.clientName,
        duration: shift.duration,
        earnings: shift.earnings
      });
      
      group.totalHours += shift.duration;
      group.totalEarnings += shift.earnings;
      
      if (!group.uniqueClients.includes(shift.clientName)) {
        group.uniqueClients.push(shift.clientName);
      }
    });

    // Sort shifts within each group by start time
    groups.forEach(group => {
      group.shifts.sort((a, b) => a.startTime.localeCompare(b.startTime));
      group.uniqueClients.sort();
    });

    // Convert to array and sort by date and location
    return Array.from(groups.values()).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date); // Most recent first
      if (dateCompare !== 0) return dateCompare;
      return a.location.localeCompare(b.location);
    });
  }, [shifts, dateFilter, locationFilter, clientFilter]);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEEE dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  const clearFilters = () => {
    setDateFilter('');
    setLocationFilter('');
    setClientFilter('');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading shifts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Grouped Shifts</h1>
        <Badge variant="secondary">
          {groupedShifts.length} group{groupedShifts.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filter by date"
              />
            </div>
            <div>
              <Label htmlFor="location-filter">House</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All houses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All houses</SelectItem>
                  {uniqueLocations.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-filter">Client</Label>
              <Input
                id="client-filter"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                placeholder="Filter by client name"
              />
            </div>
          </div>
          {(dateFilter || locationFilter || clientFilter) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grouped Shifts */}
      <div className="space-y-4">
        {groupedShifts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No shifts found matching your filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          groupedShifts.map((group, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5" />
                      {formatDate(group.date)}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{group.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Total: {group.totalHours.toFixed(1)} hrs
                    </div>
                    <div className="text-sm text-muted-foreground">
                      £{group.totalEarnings.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Time blocks */}
                <div className="space-y-2 mb-4">
                  {group.shifts.map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-sm font-medium">
                          {shift.startTime}–{shift.endTime}
                        </div>
                        <div className="font-medium">
                          {shift.clientName}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">{shift.duration.toFixed(1)}h</div>
                        <div className="text-muted-foreground">£{shift.earnings.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Client summary */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clients:</span>
                  <div className="flex flex-wrap gap-1">
                    {group.uniqueClients.map(client => (
                      <Badge key={client} variant="outline" className="text-xs">
                        {client}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}