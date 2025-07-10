export interface DuplicateCheckResult {
  id: string;
  status: 'new' | 'duplicate' | 'potential_update' | 'needs_location';
  existingShift?: {
    id: string;
    startTime: string;
    endTime: string;
    location?: string;
  };
  newShift: {
    date: string;
    clientName: string;
    startTime: string;
    endTime: string;
    location?: string;
    hourlyRate: number;
  };
  conflicts?: {
    startTime?: boolean;
    endTime?: boolean;
  };
}

export interface UpdateChoice {
  shiftId: string;
  action: 'update' | 'keep_both' | 'skip';
}

export interface SaveSummary {
  newShifts: number;
  updatedShifts: number;
  skippedShifts: number;
  totalHours: number;
  newHours: number;
  updatedHours: number;
  skippedHours: number;
}