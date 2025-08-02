import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MobileAuthUser {
  mobile_number: string;
  display_name: string;
  is_verified: boolean;
}

export const useMobileAuth = () => {
  const [user, setUser] = useState<MobileAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    // Check if user is logged in (stored in localStorage)
    const storedUser = localStorage.getItem('mobile_auth_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
    setLoading(false);

    // Activity tracking for auto-logout
    const updateActivity = () => setLastActivity(Date.now());
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Auto-logout timer (30 minutes = 1800000ms)
    const logoutTimer = setInterval(() => {
      if (user && Date.now() - lastActivity > 1800000) {
        signOut();
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(logoutTimer);
    };
  }, [user, lastActivity]);

  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const signUp = async (mobileNumber: string, pin: string, displayName: string) => {
    try {
      setLoading(true);
      const pinHash = await hashPin(pin);
      
      const { data, error } = await supabase
        .from('mobile_auth')
        .insert({
          mobile_number: mobileNumber,
          pin_hash: pinHash,
          display_name: displayName,
          is_verified: true
        })
        .select()
        .single();

      if (error) throw error;

      const userData = {
        mobile_number: data.mobile_number,
        display_name: data.display_name,
        is_verified: data.is_verified
      };

      localStorage.setItem('mobile_auth_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (mobileNumber: string, pin: string) => {
    try {
      setLoading(true);
      const pinHash = await hashPin(pin);
      
      const { data, error } = await supabase
        .from('mobile_auth')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .eq('pin_hash', pinHash)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid mobile number or PIN' };
      }

      // Update last login
      await supabase
        .from('mobile_auth')
        .update({ last_login: new Date().toISOString() })
        .eq('mobile_number', mobileNumber);

      const userData = {
        mobile_number: data.mobile_number,
        display_name: data.display_name,
        is_verified: data.is_verified
      };

      localStorage.setItem('mobile_auth_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('mobile_auth_user');
    setUser(null);
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut
  };
};