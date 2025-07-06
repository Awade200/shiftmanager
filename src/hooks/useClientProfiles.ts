import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientProfile {
  id: string;
  clientName: string;
  defaultLocation: string;
  createdAt: string;
  updatedAt: string;
}

export const useClientProfiles = () => {
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientProfiles();
  }, []);

  const loadClientProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_profiles' as any)
        .select('*')
        .order('client_name');

      if (error) {
        console.error('Error loading client profiles:', error);
        return;
      }

      const transformedProfiles: ClientProfile[] = (data || []).map((profile: any) => ({
        id: profile.id,
        clientName: profile.client_name,
        defaultLocation: profile.default_location,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      }));

      setClientProfiles(transformedProfiles);
    } catch (error) {
      console.error('Error loading client profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const findClientLocation = (clientName: string): string | null => {
    const profile = clientProfiles.find(
      p => p.clientName.toLowerCase() === clientName.toLowerCase()
    );
    return profile?.defaultLocation || null;
  };

  const saveClientProfile = async (clientName: string, location: string): Promise<boolean> => {
    try {
      // Check if client already exists
      const existingProfile = clientProfiles.find(
        p => p.clientName.toLowerCase() === clientName.toLowerCase()
      );

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('client_profiles' as any)
          .update({ default_location: location })
          .eq('id', existingProfile.id);

        if (error) {
          console.error('Error updating client profile:', error);
          return false;
        }

        // Update local state
        setClientProfiles(prev => prev.map(profile => 
          profile.id === existingProfile.id 
            ? { ...profile, defaultLocation: location, updatedAt: new Date().toISOString() }
            : profile
        ));
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('client_profiles' as any)
          .insert([{
            client_name: clientName,
            default_location: location,
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating client profile:', error);
          return false;
        }

        const newProfile: ClientProfile = {
          id: (data as any).id,
          clientName: (data as any).client_name,
          defaultLocation: (data as any).default_location,
          createdAt: (data as any).created_at,
          updatedAt: (data as any).updated_at,
        };

        setClientProfiles(prev => [...prev, newProfile]);
      }

      return true;
    } catch (error) {
      console.error('Error saving client profile:', error);
      return false;
    }
  };

  return {
    clientProfiles,
    loading,
    findClientLocation,
    saveClientProfile,
    refreshProfiles: loadClientProfiles,
  };
};