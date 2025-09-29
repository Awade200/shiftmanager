export interface Day {
  id: string;
  mobile_number: string;
  day_date: string; // ISO date string
  total_hours: number;
  shift_count: number;
  has_conflicts: boolean;
  has_unresolved: boolean;
  last_import_session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DayWithShifts extends Day {
  shifts: DayShift[];
}

export interface DayShift {
  id: string;
  day_id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  location?: string;
  hourly_rate: number;
  duration: number;
  earnings: number;
  is_paid: boolean;
  status: 'ready' | 'unresolved' | 'error' | 'conflict';
  mobile_number?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportSession {
  id: string;
  mobile_number: string;
  session_data?: Record<string, any>;
  days_found: number;
  days_saved: number;
  days_skipped: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface DayStats {
  total_days: number;
  total_hours: number;
  total_earnings: number;
  days_with_conflicts: number;
  days_with_unresolved: number;
  most_productive_day: string | null;
}

export interface DayAction {
  type: 'merge' | 'replace' | 'skip';
  day_date: string;
  shifts?: DayShift[];
}

export interface ParsedDay {
  date: string; // YYYY-MM-DD format
  shifts: Array<{
    id: string;
    start_time: string;
    end_time: string;
    client_name: string;
    location?: string;
    status: 'ready' | 'unresolved' | 'error';
    errors?: string[];
  }>;
  total_hours: number;
  has_conflicts: boolean;
  has_unresolved: boolean;
}