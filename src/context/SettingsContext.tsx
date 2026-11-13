import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types';

const SETTINGS_STORAGE_KEY = '@iron_track_user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  unit: 'lbs',
  defaultRestSeconds: 90,
  defaultRepRangeMin: 8,
  defaultRepRangeMax: 12,
  barWeightLbs: 45,
  barWeightKg: 20,
  hapticsEnabled: true,
  autoRestTimer: true,
  notificationBarEnabled: true,
  rpeScale: 'RPE',
  userName: ''
};

interface SettingsContextValue {
  settings: UserSettings;
  isLoaded: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  toggleUnit: () => Promise<void>;
  currentBarWeight: number;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  const toggleUnit = async () => {
    const nextUnit = settings.unit === 'lbs' ? 'kg' : 'lbs';
    await updateSettings({ unit: nextUnit });
  };

  const currentBarWeight = settings.unit === 'lbs' ? settings.barWeightLbs : settings.barWeightKg;

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, updateSettings, toggleUnit, currentBarWeight }}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
