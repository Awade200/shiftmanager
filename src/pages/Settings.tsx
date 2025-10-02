import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Archive, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DataMigration } from '@/components/DataMigration';
import { BatchOperations } from '@/components/BatchOperations';
import { HistoricalAnalysis } from '@/components/HistoricalAnalysis';
import { useShifts } from '@/hooks/useShifts';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { settings, updateSettings, exportToCSV, shifts, updateAllShiftsHourlyRate } = useShifts();
  const { toast } = useToast();

  const handleSettingsUpdate = (key: string, value: any) => {
    updateSettings({ [key]: value });
    toast({
      title: "Settings updated",
      description: "Your preferences have been saved.",
    });
  };

  const handleExport = () => {
    const csvData = exportToCSV();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shifts-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export completed",
      description: "Your shifts have been exported to CSV.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings & Tools</h1>
        <p className="text-muted-foreground">
          Manage your preferences, migrate data, and analyze your shift patterns
        </p>
      </div>

      <Tabs defaultValue="migration" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="migration" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Migration
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Batch Ops
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="migration">
          <DataMigration />
        </TabsContent>

        <TabsContent value="batch">
          <BatchOperations />
        </TabsContent>

        <TabsContent value="analysis">
          <HistoricalAnalysis />
        </TabsContent>

        <TabsContent value="general">
          <div className="grid gap-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultRate">Default Hourly Rate (£)</Label>
                  <Input
                    id="defaultRate"
                    type="number"
                    value={settings.defaultHourlyRate}
                    onChange={(e) => handleSettingsUpdate('defaultHourlyRate', parseFloat(e.target.value) || 0)}
                    step="0.50"
                    min="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoSave"
                    checked={settings.autoSaveClientLocations}
                    onCheckedChange={(checked) => handleSettingsUpdate('autoSaveClientLocations', checked)}
                  />
                  <Label htmlFor="autoSave">Auto-save client locations</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="anonymization"
                    checked={settings.useAnonymization}
                    onCheckedChange={(checked) => handleSettingsUpdate('useAnonymization', checked)}
                  />
                  <Label htmlFor="anonymization">Use name anonymization</Label>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Rate Update */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk Hourly Rate Update</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="text-sm font-medium">Current Shifts: {shifts.length}</div>
                  <div className="text-sm text-muted-foreground">
                    Update all existing shifts to your current default rate of £{settings.defaultHourlyRate.toFixed(2)}/hour
                  </div>
                </div>
                <Button 
                  onClick={async () => {
                    if (window.confirm(`Update all ${shifts.length} shifts to £${settings.defaultHourlyRate.toFixed(2)}/hour?`)) {
                      const success = await updateAllShiftsHourlyRate(settings.defaultHourlyRate);
                      if (success) {
                        toast({
                          title: "Rates updated",
                          description: `All ${shifts.length} shifts have been updated to £${settings.defaultHourlyRate.toFixed(2)}/hour`,
                        });
                      } else {
                        toast({
                          title: "Update failed",
                          description: "Failed to update shift rates",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                  className="w-full md:w-auto"
                >
                  Update All Shifts to £{settings.defaultHourlyRate.toFixed(2)}/hour
                </Button>
              </CardContent>
            </Card>

            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export all your shift data to CSV format for backup or analysis.
                </p>
                <Button onClick={handleExport} className="w-full md:w-auto">
                  Export All Data to CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}