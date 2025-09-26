import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, BarChart3, Clock, DollarSign, MapPin, CheckCircle2 } from "lucide-react";

export const InteractivePreview = () => {
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
  const [paidShifts, setPaidShifts] = useState<number[]>([]);

  const mockShifts = [
    { id: 1, date: "2024-01-15", client: "Russell House", type: "Day Shift", hours: 8, rate: 19.50, total: 156.00, status: "pending" },
    { id: 2, date: "2024-01-15", client: "Sutton House", type: "Night", hours: 9, rate: 21.75, total: 195.75, status: "pending" },
    { id: 3, date: "2024-01-16", client: "St. Michaels", type: "Day Shift", hours: 8, rate: 19.50, total: 156.00, status: "pending" },
    { id: 4, date: "2024-01-16", client: "Russell House", type: "Evening", hours: 6, rate: 20.00, total: 120.00, status: "pending" }
  ];

  const toggleShiftSelection = (shiftId: number) => {
    setSelectedShifts(prev => 
      prev.includes(shiftId) 
        ? prev.filter(id => id !== shiftId)
        : [...prev, shiftId]
    );
  };

  const markSelectedAsPaid = () => {
    setPaidShifts(prev => [...prev, ...selectedShifts]);
    setSelectedShifts([]);
  };

  const TableView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Shifts</h3>
        {selectedShifts.length > 0 && (
          <Button onClick={markSelectedAsPaid} size="sm" className="animate-fade-in">
            Mark {selectedShifts.length} as Paid
          </Button>
        )}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockShifts.map((shift) => (
            <TableRow 
              key={shift.id}
              className={`cursor-pointer transition-colors ${
                selectedShifts.includes(shift.id) ? 'bg-primary/10' : ''
              }`}
              onClick={() => toggleShiftSelection(shift.id)}
            >
              <TableCell>
                <input 
                  type="checkbox" 
                  checked={selectedShifts.includes(shift.id)}
                  onChange={() => toggleShiftSelection(shift.id)}
                  className="rounded border-border"
                />
              </TableCell>
              <TableCell>{shift.date}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{shift.client}</p>
                  <p className="text-sm text-muted-foreground">{shift.type}</p>
                </div>
              </TableCell>
              <TableCell>{shift.hours}h</TableCell>
              <TableCell>£{shift.rate}</TableCell>
              <TableCell className="font-bold">£{shift.total.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={paidShifts.includes(shift.id) ? "success" : "outline"}>
                  {paidShifts.includes(shift.id) ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Paid</span>
                    </div>
                  ) : (
                    "Pending"
                  )}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const TimelineView = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Weekly Timeline</h3>
      <div className="space-y-2">
        {mockShifts.map((shift, index) => (
          <div 
            key={shift.id} 
            className="flex items-center space-x-4 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{shift.client} - {shift.type}</span>
                <span className="text-sm text-muted-foreground">{shift.date}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{shift.hours} hours</span>
                <span>£{shift.rate}/hr</span>
                <span className="font-bold text-foreground">£{shift.total.toFixed(2)}</span>
              </div>
            </div>
            <Badge variant={paidShifts.includes(shift.id) ? "success" : "outline"}>
              {paidShifts.includes(shift.id) ? "Paid" : "Pending"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );

  const KanbanView = () => {
    const pendingShifts = mockShifts.filter(shift => !paidShifts.includes(shift.id));
    const completedShifts = mockShifts.filter(shift => paidShifts.includes(shift.id));

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-warning" />
              Pending Payment ({pendingShifts.length})
            </h4>
            <div className="space-y-2">
              {pendingShifts.map((shift) => (
                <div key={shift.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{shift.client}</span>
                    <span className="text-sm font-bold">£{shift.total.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {shift.date} • {shift.hours}h
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
              Paid ({completedShifts.length})
            </h4>
            <div className="space-y-2">
              {completedShifts.map((shift) => (
                <div key={shift.id} className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{shift.client}</span>
                    <span className="text-sm font-bold text-success">£{shift.total.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {shift.date} • {shift.hours}h
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            See it in action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Try the interface with real data. Click around, mark shifts as paid, and see how easy shift management becomes.
          </p>
        </div>

        <Card className="overflow-hidden shadow-2">
          <CardContent className="p-0">
            <Tabs defaultValue="table" className="w-full">
              <div className="px-6 py-4 border-b border-border bg-card">
                <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                  <TabsTrigger value="table" className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Table</span>
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Timeline</span>
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Kanban</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="table" className="mt-0">
                  <TableView />
                </TabsContent>

                <TabsContent value="timeline" className="mt-0">
                  <TimelineView />
                </TabsContent>

                <TabsContent value="kanban" className="mt-0">
                  <KanbanView />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            This is a live demo - try selecting shifts and marking them as paid!
          </p>
        </div>
      </div>
    </section>
  );
};