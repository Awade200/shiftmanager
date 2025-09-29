export interface WorkloadWarning {
  type: 'short_shift' | 'intensive_day' | 'rapid_transitions' | 'excessive_hours' | 'fragmented_schedule';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedShifts: string[];
  suggestions?: string[];
}

export interface DuplicateCheckResult {
  id: string;
  status: 'new' | 'exact' | 'partial' | 'contained' | 'contains';
  overlapType?: 'exact' | 'partial' | 'contained' | 'contains';
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
  conflictingShifts?: Array<{
    id: string;
    startTime: string;
    endTime: string;
    clientName: string;
  }>;
}

export interface UpdateChoice {
  shiftId: string;
  action: 'replace' | 'skip' | 'split' | 'edit';
  editedShift?: {
    startTime: string;
    endTime: string;
  };
}

export interface SaveSummary {
  newShifts: number;
  replacedShifts: number;
  skippedShifts: number;
  splitShifts: number;
  totalHours: number;
  newHours: number;
  replacedHours: number;
  skippedHours: number;
  splitHours: number;
}