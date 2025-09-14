export interface WorkloadWarning {
  type: 'short_shift' | 'intensive_day' | 'rapid_transitions' | 'excessive_hours' | 'fragmented_schedule';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedShifts: string[];
  suggestions?: string[];
}

export interface DuplicateCheckResult {
  id: string;
  status: 'new' | 'duplicate' | 'potential_update' | 'needs_location' | 'workload_warning';
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
  workloadWarnings?: WorkloadWarning[];
}

export interface UpdateChoice {
  shiftId: string;
  action: 'update' | 'keep_both' | 'skip' | 'proceed_with_warning';
}

export interface SaveSummary {
  newShifts: number;
  updatedShifts: number;
  skippedShifts: number;
  totalHours: number;
  newHours: number;
  updatedHours: number;
  skippedHours: number;
  workloadWarnings: WorkloadWarning[];
}