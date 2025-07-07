import { useState, useEffect } from 'react';
import { useShifts } from './useShifts';

interface NameMapping {
  realName: string;
  fakeName: string;
}

const FAKE_FIRST_NAMES = [
  'Alex', 'Emily', 'Noah', 'Mia', 'Liam', 'Ava', 'Lucas', 'Zoe',
  'Oliver', 'Sophie', 'Ethan', 'Grace', 'Mason', 'Chloe', 'James', 'Lily'
];

const FAKE_LAST_NAMES = [
  'Parker', 'Brooks', 'James', 'Evans', 'Carter', 'Clarke', 'Lewis', 'Moore',
  'Taylor', 'Wilson', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'
];

export const useNameAnonymization = () => {
  const { settings, updateSettings } = useShifts();
  const [nameMappings, setNameMappings] = useState<NameMapping[]>([]);

  useEffect(() => {
    loadNameMappings();
  }, []);

  const loadNameMappings = () => {
    const stored = localStorage.getItem('shift-name-mappings');
    if (stored) {
      try {
        setNameMappings(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading name mappings:', error);
      }
    }
  };

  const saveNameMappings = (mappings: NameMapping[]) => {
    setNameMappings(mappings);
    localStorage.setItem('shift-name-mappings', JSON.stringify(mappings));
  };

  const generateFakeName = (realName: string): string => {
    // Create a simple hash from the real name for consistency
    let hash = 0;
    for (let i = 0; i < realName.length; i++) {
      const char = realName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const firstIndex = Math.abs(hash) % FAKE_FIRST_NAMES.length;
    const lastIndex = Math.abs(hash >> 8) % FAKE_LAST_NAMES.length;
    
    return `${FAKE_FIRST_NAMES[firstIndex]} ${FAKE_LAST_NAMES[lastIndex]}`;
  };

  const anonymizeName = (realName: string): string => {
    if (!settings.useAnonymization) {
      return realName;
    }

    // Check for existing mapping
    const existingMapping = nameMappings.find(m => 
      m.realName.toLowerCase() === realName.toLowerCase()
    );
    
    if (existingMapping) {
      return existingMapping.fakeName;
    }

    // Generate new fake name
    const fakeName = generateFakeName(realName);
    
    // Save the mapping
    const newMappings = [...nameMappings, { realName, fakeName }];
    saveNameMappings(newMappings);
    
    return fakeName;
  };

  const addCustomMapping = (realName: string, fakeName: string) => {
    const newMappings = nameMappings.filter(m => 
      m.realName.toLowerCase() !== realName.toLowerCase()
    );
    newMappings.push({ realName, fakeName });
    saveNameMappings(newMappings);
  };

  const removeMapping = (realName: string) => {
    const newMappings = nameMappings.filter(m => 
      m.realName.toLowerCase() !== realName.toLowerCase()
    );
    saveNameMappings(newMappings);
  };

  const clearAllMappings = () => {
    setNameMappings([]);
    localStorage.removeItem('shift-name-mappings');
  };

  const toggleAnonymization = (enabled: boolean) => {
    updateSettings({ useAnonymization: enabled });
  };

  return {
    anonymizeName,
    nameMappings,
    addCustomMapping,
    removeMapping,
    clearAllMappings,
    isAnonymizationEnabled: settings.useAnonymization || false,
    toggleAnonymization,
  };
};