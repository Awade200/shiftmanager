import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Bell, Loader2 } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export const NotificationSettings = () => {
  const { preferences, loading, updatePreferences, testNotification } = useNotificationPreferences();
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!preferences) return null;

  const handleTestEmail = async () => {
    setTestingEmail(true);
    await testNotification('email');
    setTestingEmail(false);
  };

  const handleTestWhatsApp = async () => {
    setTestingWhatsApp(true);
    await testNotification('whatsapp');
    setTestingWhatsApp(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Shift Reminder Notifications</CardTitle>
          </div>
          <CardDescription>
            Get notified before your shifts start. Choose your preferred channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reminder Timing */}
          <div className="space-y-2">
            <Label>Reminder Timing</Label>
            <Select
              value={preferences.reminder_hours_before?.toString()}
              onValueChange={(value) => 
                updatePreferences({ reminder_hours_before: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour before</SelectItem>
                <SelectItem value="2">2 hours before</SelectItem>
                <SelectItem value="6">6 hours before</SelectItem>
                <SelectItem value="12">12 hours before</SelectItem>
                <SelectItem value="24">24 hours before</SelectItem>
                <SelectItem value="48">48 hours before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email Notifications */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders via email</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) => 
                    updatePreferences({ email_enabled: checked })
                  }
                />
              </div>

              {preferences.email_enabled && (
                <div className="space-y-3 pt-2">
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={preferences.email || ''}
                    onChange={(e) => updatePreferences({ email: e.target.value })}
                    className="bg-background"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestEmail}
                    disabled={!preferences.email || testingEmail}
                    className="w-full"
                  >
                    {testingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Test Email'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Notifications */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">WhatsApp Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders via WhatsApp</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.whatsapp_enabled}
                  onCheckedChange={(checked) => 
                    updatePreferences({ whatsapp_enabled: checked })
                  }
                />
              </div>

              {preferences.whatsapp_enabled && (
                <div className="space-y-3 pt-2">
                  <Input
                    type="tel"
                    placeholder="+44 1234 567890"
                    value={preferences.phone_number || ''}
                    onChange={(e) => updatePreferences({ phone_number: e.target.value })}
                    className="bg-background"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestWhatsApp}
                    disabled={!preferences.phone_number || testingWhatsApp}
                    className="w-full"
                  >
                    {testingWhatsApp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Test WhatsApp'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <p className="font-medium mb-1">💡 How it works:</p>
            <p>You'll receive a notification at your chosen time before each shift starts, containing all shift details including client, time, and location.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
