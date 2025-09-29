import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle, Play, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MigrationStats {
  totalShifts: number;
  migratedShifts: number;
  daysCreated: number;
  conflicts: number;
  errors: string[];
}

export function DataMigration() {
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<MigrationStats>({
    totalShifts: 0,
    migratedShifts: 0,
    daysCreated: 0,
    conflicts: 0,
    errors: []
  });

  const { toast } = useToast();

  const checkMigrationStatus = async (): Promise<boolean> => {
    try {
      // Check if there are any shifts without day_id
      const { data: unmigrated, error } = await supabase
        .from('shifts')
        .select('id')
        .is('day_id', null)
        .limit(1);

      if (error) throw error;
      
      return unmigrated.length === 0;
    } catch (err) {
      console.error('Error checking migration status:', err);
      return false;
    }
  };

  const runMigration = async () => {
    try {
      setIsRunning(true);
      setProgress(0);
      setStats({
        totalShifts: 0,
        migratedShifts: 0,
        daysCreated: 0,
        conflicts: 0,
        errors: []
      });

      // Step 1: Get all shifts that need migration
      const { data: allShifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .is('day_id', null);

      if (shiftsError) throw shiftsError;

      const totalShifts = allShifts.length;
      setStats(prev => ({ ...prev, totalShifts }));

      if (totalShifts === 0) {
        toast({
          title: "No migration needed",
          description: "All shifts are already properly organized by days"
        });
        setIsComplete(true);
        setIsRunning(false);
        return;
      }

      setProgress(10);

      // Step 2: Group shifts by mobile_number and date
      const shiftGroups = allShifts.reduce((groups, shift) => {
        const key = `${shift.mobile_number || 'default'}_${shift.date}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(shift);
        return groups;
      }, {} as Record<string, any[]>);

      setProgress(20);

      let processedShifts = 0;
      let createdDays = 0;
      const errors: string[] = [];

      // Step 3: Process each day group
      for (const [groupKey, shifts] of Object.entries(shiftGroups)) {
        try {
          const [mobileNumber, date] = groupKey.split('_');
          
          // Create or get day record
          const { data: dayId, error: dayError } = await supabase
            .rpc('get_or_create_day', {
              p_mobile_number: mobileNumber,
              p_day_date: date
            });

          if (dayError) throw dayError;

          if (dayId) {
            createdDays++;
            
            // Update all shifts in this group to reference the day
            const shiftIds = shifts.map(s => s.id);
            const { error: updateError } = await supabase
              .from('shifts')
              .update({ 
                day_id: dayId,
                status: 'ready',
                updated_at: new Date().toISOString()
              })
              .in('id', shiftIds);

            if (updateError) throw updateError;

            processedShifts += shifts.length;
          }

          // Update progress
          setProgress(20 + (processedShifts / totalShifts) * 70);
          setStats(prev => ({
            ...prev,
            migratedShifts: processedShifts,
            daysCreated: createdDays
          }));

        } catch (err) {
          const errorMsg = `Failed to migrate group ${groupKey}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg, err);
        }
      }

      setProgress(95);

      // Step 4: Update day statistics (this will be handled by the trigger automatically)
      setProgress(100);
      
      setStats(prev => ({
        ...prev,
        errors
      }));

      if (errors.length === 0) {
        toast({
          title: "Migration completed successfully",
          description: `${processedShifts} shifts organized into ${createdDays} days`
        });
      } else {
        toast({
          title: "Migration completed with errors",
          description: `${processedShifts} shifts migrated, ${errors.length} errors occurred`,
          variant: "destructive"
        });
      }

      setIsComplete(true);

    } catch (err) {
      console.error('Migration failed:', err);
      toast({
        title: "Migration failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive"
      });
      setStats(prev => ({
        ...prev,
        errors: [...prev.errors, err instanceof Error ? err.message : "Unknown error"]
      }));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Migration to Day-First Architecture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This migration will organize your existing shifts into the new day-first structure. 
            This is a one-time process and is safe to run multiple times.
          </AlertDescription>
        </Alert>

        {/* Migration Steps */}
        <div className="space-y-3">
          <h4 className="font-semibold">Migration Process:</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span>Group existing shifts by date and mobile number</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span>Create day records for each unique date</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span>Link shifts to their corresponding days</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span>Update day statistics automatically</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Migration Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Statistics */}
        {(isRunning || isComplete) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalShifts}</div>
              <div className="text-sm text-muted-foreground">Total Shifts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{stats.migratedShifts}</div>
              <div className="text-sm text-muted-foreground">Migrated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.daysCreated}</div>
              <div className="text-sm text-muted-foreground">Days Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{stats.errors.length}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
        )}

        {/* Errors */}
        {stats.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Migration Errors:</div>
                {stats.errors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-xs">• {error}</div>
                ))}
                {stats.errors.length > 3 && (
                  <div className="text-xs">... and {stats.errors.length - 3} more errors</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {isComplete && stats.errors.length === 0 && (
          <Alert className="border-success bg-success/5">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              Migration completed successfully! Your shifts are now organized by days.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={runMigration}
            disabled={isRunning || isComplete}
            size="lg"
          >
            {isRunning ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Running Migration...</span>
              </div>
            ) : isComplete ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Migration Complete</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span>Start Migration</span>
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}