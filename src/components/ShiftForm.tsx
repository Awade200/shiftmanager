import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShiftFormData } from '@/types/shift';
import { useShifts } from '@/hooks/useShifts';

interface ShiftFormProps {
  onSubmit: (data: ShiftFormData) => void;
  initialData?: Partial<ShiftFormData>;
  submitLabel?: string;
}

const ShiftForm = ({ onSubmit, initialData, submitLabel = "Add Shift" }: ShiftFormProps) => {
  const { settings } = useShifts();
  
  const [formData, setFormData] = useState<ShiftFormData>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    startTime: initialData?.startTime || '09:00',
    endTime: initialData?.endTime || '17:00',
    clientName: initialData?.clientName || '',
    location: initialData?.location || '',
    hourlyRate: initialData?.hourlyRate || settings.defaultHourlyRate,
    isPaid: initialData?.isPaid || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (formData.hourlyRate <= 0) {
      newErrors.hourlyRate = 'Hourly rate must be greater than 0';
    }

    // Check if end time is after start time (same day)
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      if (end <= start && end.getTime() !== start.getTime()) {
        // Allow overnight shifts but warn if they seem unintentional
        if (confirm('This appears to be an overnight shift. Is this correct?')) {
          // User confirmed overnight shift
        } else {
          newErrors.endTime = 'End time must be after start time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof ShiftFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Shift Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && <p className="text-sm text-destructive mt-1">{errors.date}</p>}
            </div>

            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                type="text"
                placeholder="e.g. Springfield House"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                className={errors.clientName ? 'border-destructive' : ''}
              />
              {errors.clientName && <p className="text-sm text-destructive mt-1">{errors.clientName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              type="text"
              placeholder="Additional location details"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className={errors.startTime ? 'border-destructive' : ''}
              />
              {errors.startTime && <p className="text-sm text-destructive mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className={errors.endTime ? 'border-destructive' : ''}
              />
              {errors.endTime && <p className="text-sm text-destructive mt-1">{errors.endTime}</p>}
            </div>

            <div>
              <Label htmlFor="hourlyRate">Hourly Rate (£) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => handleChange('hourlyRate', parseFloat(e.target.value) || 0)}
                className={errors.hourlyRate ? 'border-destructive' : ''}
              />
              {errors.hourlyRate && <p className="text-sm text-destructive mt-1">{errors.hourlyRate}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPaid"
              checked={formData.isPaid}
              onCheckedChange={(checked) => handleChange('isPaid', checked)}
            />
            <Label htmlFor="isPaid">Mark as paid</Label>
          </div>

          <Button type="submit" className="w-full">
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShiftForm;