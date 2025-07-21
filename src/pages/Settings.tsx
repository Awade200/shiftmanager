import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Shield, Eye, EyeOff, Calculator } from 'lucide-react';
import { useShifts } from '@/hooks/useShifts';
import { useNameAnonymization } from '@/hooks/useNameAnonymization';
import { useTaxCalculation } from '@/hooks/useTaxCalculation';
import { useToast } from '@/hooks/use-toast';
import { TaxCode, PayFrequency } from '@/types/taxation';

export default function Settings() {
  const { settings, updateSettings } = useShifts();
  const { 
    nameMappings, 
    addCustomMapping, 
    removeMapping, 
    clearAllMappings,
    isAnonymizationEnabled,
    toggleAnonymization 
  } = useNameAnonymization();
  const { taxSettings, updateTaxSettings } = useTaxCalculation();
  
  const { toast } = useToast();
  const [newRealName, setNewRealName] = useState('');
  const [newFakeName, setNewFakeName] = useState('');

  const handleUpdateSettings = (newSettings: Partial<typeof settings>) => {
    updateSettings(newSettings);
    toast({
      title: "Settings updated",
      description: "Your changes have been saved.",
    });
  };

  const handleAddMapping = () => {
    if (newRealName.trim() && newFakeName.trim()) {
      addCustomMapping(newRealName.trim(), newFakeName.trim());
      setNewRealName('');
      setNewFakeName('');
      toast({
        title: "Name mapping added",
        description: `${newRealName} will now be replaced with ${newFakeName}`,
      });
    }
  };

  const handleClearAllMappings = () => {
    clearAllMappings();
    toast({
      title: "Mappings cleared",
      description: "All name mappings have been removed.",
      variant: "destructive"
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="hourly-rate">Default Hourly Rate (£)</Label>
              <Input
                id="hourly-rate"
                type="number"
                step="0.01"
                value={settings.defaultHourlyRate}
                onChange={(e) => handleUpdateSettings({ 
                  defaultHourlyRate: parseFloat(e.target.value) || 0 
                })}
              />
              <div className="text-sm text-muted-foreground mt-1">
                This rate will automatically apply to all future shifts
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-save-locations"
              checked={settings.autoSaveClientLocations}
              onCheckedChange={(checked) => handleUpdateSettings({ 
                autoSaveClientLocations: checked 
              })}
            />
            <Label htmlFor="auto-save-locations">
              Auto-save client locations
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Tax & National Insurance
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Configure your tax code and pay frequency for accurate net pay calculations
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="tax-code">Tax Code</Label>
              <Select 
                value={taxSettings.taxCode} 
                onValueChange={(value: TaxCode) => updateTaxSettings({ taxCode: value })}
              >
                <SelectTrigger id="tax-code">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1257L">
                    <div>
                      <div className="font-medium">1257L</div>
                      <div className="text-xs text-muted-foreground">Standard personal allowance</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="BR">
                    <div>
                      <div className="font-medium">BR</div>
                      <div className="text-xs text-muted-foreground">Basic rate (20%) - no allowance</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="D0">
                    <div>
                      <div className="font-medium">D0</div>
                      <div className="text-xs text-muted-foreground">Higher rate (40%) - no allowance</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="D1">
                    <div>
                      <div className="font-medium">D1</div>
                      <div className="text-xs text-muted-foreground">Additional rate (45%) - no allowance</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="0T">
                    <div>
                      <div className="font-medium">0T</div>
                      <div className="text-xs text-muted-foreground">No allowance - basic rate</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="NT">
                    <div>
                      <div className="font-medium">NT</div>
                      <div className="text-xs text-muted-foreground">No tax</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pay-frequency">Pay Frequency</Label>
              <Select 
                value={taxSettings.payFrequency} 
                onValueChange={(value: PayFrequency) => updateTaxSettings({ payFrequency: value })}
              >
                <SelectTrigger id="pay-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert>
            <Calculator className="w-4 h-4" />
            <AlertDescription>
              These settings will be used to calculate income tax and National Insurance deductions 
              based on UK PAYE rates for the 2024/25 tax year.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Anonymization
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Protect sensitive client data by replacing real names with fake ones
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="use-anonymization"
              checked={isAnonymizationEnabled}
              onCheckedChange={toggleAnonymization}
            />
            <Label htmlFor="use-anonymization" className="flex items-center gap-2">
              {isAnonymizationEnabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Use fake names for all shifts
            </Label>
          </div>

          {isAnonymizationEnabled && (
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                All client names will be automatically replaced with fake names. 
                This protects privacy when sharing screens or taking screenshots.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Name Mappings */}
      {isAnonymizationEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Name Mappings</CardTitle>
            <div className="text-sm text-muted-foreground">
              Manage how real names are replaced with fake names
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Mapping */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="real-name">Real Name</Label>
                <Input
                  id="real-name"
                  placeholder="e.g., John Smith"
                  value={newRealName}
                  onChange={(e) => setNewRealName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fake-name">Fake Name</Label>
                <Input
                  id="fake-name"
                  placeholder="e.g., Alex Parker"
                  value={newFakeName}
                  onChange={(e) => setNewFakeName(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddMapping}
                  disabled={!newRealName.trim() || !newFakeName.trim()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Mapping
                </Button>
              </div>
            </div>

            {/* Current Mappings */}
            {nameMappings.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Current Mappings ({nameMappings.length})</h3>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleClearAllMappings}
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {nameMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{mapping.realName}</Badge>
                        <span>→</span>
                        <Badge variant="secondary">{mapping.fakeName}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMapping(mapping.realName)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nameMappings.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No name mappings created yet.</p>
                <p className="text-sm">Names will be automatically generated when processing shifts.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}