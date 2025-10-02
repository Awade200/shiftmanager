import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMobileAuth } from './useMobileAuth';

export interface NotificationPreferences {
  id?: string;
  mobile_number: string;
  email: string | null;
  phone_number: string | null;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  reminder_hours_before: number;
}

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useMobileAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.mobile_number) {
      fetchPreferences();
    }
  }, [user?.mobile_number]);

  const fetchPreferences = async () => {
    if (!user?.mobile_number) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('mobile_number', user.mobile_number)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs: NotificationPreferences = {
          mobile_number: user.mobile_number,
          email: null,
          phone_number: null,
          email_enabled: false,
          whatsapp_enabled: false,
          reminder_hours_before: 12,
        };
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user?.mobile_number) return;

    try {
      const updatedPrefs = { ...preferences, ...updates, mobile_number: user.mobile_number };

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(updatedPrefs, { onConflict: 'mobile_number' })
        .select()
        .single();

      if (error) throw error;

      setPreferences(data);
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    }
  };

  const testNotification = async (channel: 'email' | 'whatsapp') => {
    if (!preferences) return;

    try {
      const { error } = await supabase.functions.invoke('send-test-notification', {
        body: {
          channel,
          email: preferences.email,
          phone_number: preferences.phone_number,
        },
      });

      if (error) throw error;

      toast({
        title: "Test Sent",
        description: `Test ${channel} notification sent successfully`,
      });
    } catch (error) {
      console.error('Error sending test:', error);
      toast({
        title: "Error",
        description: `Failed to send test ${channel}`,
        variant: "destructive",
      });
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    testNotification,
    refetch: fetchPreferences,
  };
};
