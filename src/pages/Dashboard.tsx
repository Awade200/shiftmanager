import { useState } from 'react';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { useRealtimeShifts } from '@/hooks/useRealtimeShifts';
import { CompactKPIs } from '@/components/dashboard/CompactKPIs';
import { TodayShiftView } from '@/components/dashboard/TodayShiftView';
import { WeekTilesView } from '@/components/dashboard/WeekTilesView';
import { QueuePanel } from '@/components/dashboard/QueuePanel';
import { addWeeks, subWeeks } from 'date-fns';

const Dashboard = () => {
  const { user } = useMobileAuth();
  const [activeDate, setActiveDate] = useState(new Date());
  const [centerDate, setCenterDate] = useState(new Date());

  const {
    weekDays,
    todayStats,
    weekStats,
    conflicts,
    unresolved,
    shifts,
    loading
  } = useRealtimeShifts(user?.mobile_number, centerDate);

  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCenterDate(prev => subWeeks(prev, 1));
      setActiveDate(prev => subWeeks(prev, 1));
    } else {
      setCenterDate(prev => addWeeks(prev, 1));
      setActiveDate(prev => addWeeks(prev, 1));
    }
  };

  const activeDay = weekDays.find(d => d.date === activeDate.toISOString().split('T')[0]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center py-12 text-muted-foreground">
          Loading your shifts...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time shift tracking and management</p>
      </div>

      {/* Compact KPIs */}
      <CompactKPIs
        todayHours={todayStats.hours}
        weekHours={weekStats.hours}
        weekShifts={weekStats.shiftCount}
        conflictCount={weekStats.conflictCount}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's View + Week Tiles */}
        <div className="lg:col-span-2 space-y-6">
          <TodayShiftView
            date={activeDate}
            shifts={activeDay?.shifts || []}
            stats={{
              hours: activeDay?.hours || 0,
              shiftCount: activeDay?.shiftCount || 0,
              earnings: activeDay?.shifts.reduce((sum, s) => sum + s.earnings, 0) || 0,
              hasConflicts: activeDay?.hasConflicts || false
            }}
          />

          <WeekTilesView
            weekDays={weekDays}
            activeDate={activeDate}
            onSelectDate={setActiveDate}
            onNavigateWeek={handleNavigateWeek}
          />
        </div>

        {/* Right Column: Queue Panel */}
        <div className="lg:col-span-1">
          <QueuePanel
            conflicts={conflicts}
            unresolved={unresolved}
            allShifts={shifts}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
