import { useState } from 'react';
import { useShifts } from '@/hooks/useShifts';
import { Shift, ShiftFormData } from '@/types/shift';
import ShiftTable from '@/components/ShiftTable';
import ShiftForm from '@/components/ShiftForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Download, Calendar } from 'lucide-react';

const AllShifts = () => {
  const { shifts, updateShift, deleteShift, markShiftAsPaid, exportToCSV } = useShifts();
  const { toast } = useToast();
  
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
  };

  const handleEditSubmit = (data: ShiftFormData) => {
    if (!editingShift) return;

    try {
      updateShift(editingShift.id, data);
      
      toast({
        title: "Shift updated successfully",
        description: `Updated shift for ${data.clientName}`,
      });

      setEditingShift(null);
    } catch (error) {
      toast({
        title: "Failed to update shift",
        description: "There was an error updating your shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    setDeletingShiftId(id);
  };

  const confirmDelete = () => {
    if (!deletingShiftId) return;

    try {
      deleteShift(deletingShiftId);
      
      toast({
        title: "Shift deleted",
        description: "The shift has been removed from your records",
      });

      setDeletingShiftId(null);
    } catch (error) {
      toast({
        title: "Failed to delete shift",
        description: "There was an error deleting the shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = (id: string) => {
    try {
      markShiftAsPaid(id);
      
      toast({
        title: "Shift marked as paid",
        description: "Payment status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to update payment status",
        description: "There was an error updating the payment status. Please try again.",
        variant: "destructive",
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
          <h1 className="text-3xl font-bold text-foreground">All Shifts</h1>
          <p className="text-muted-foreground mt-1">
            View, edit, and manage all your recorded shifts
          </p>
        </div>
        
        {shifts.length > 0 && (
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <ShiftTable
        shifts={shifts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkPaid={handleMarkPaid}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingShift} onOpenChange={() => setEditingShift(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
          </DialogHeader>
          {editingShift && (
            <ShiftForm
              onSubmit={handleEditSubmit}
              initialData={{
                date: editingShift.date,
                startTime: editingShift.startTime,
                endTime: editingShift.endTime,
                clientName: editingShift.clientName,
                location: editingShift.location,
                hourlyRate: editingShift.hourlyRate,
                isPaid: editingShift.isPaid,
              }}
              submitLabel="Update Shift"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingShiftId} onOpenChange={() => setDeletingShiftId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shift? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllShifts;