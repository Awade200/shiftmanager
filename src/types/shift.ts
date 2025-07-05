export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  location?: string;
  hourlyRate: number;
  duration: number; // in hours
  earnings: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftFormData {
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  location?: string;
  hourlyRate: number;
  isPaid: boolean;
}

export interface ShiftStats {
  totalHours: number;
  totalEarnings: number;
  paidEarnings: number;
  unpaidEarnings: number;
  totalShifts: number;
  paidShifts: number;
  unpaidShifts: number;
}

export interface OCRResult {
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  location?: string;
  serviceType?: string;
  duration?: number;
}