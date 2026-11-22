import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export const DEFAULT_PROFILE = {
  location: 'Delhi NCR',
  adults: 2,
  children: 1,
  elderly: 0,
  conditions: ['asthma'], // 'asthma' | 'heart' | 'pregnancy'
  commute: 'two_wheeler', // 'walk' | 'cycle' | 'two_wheeler' | 'car' | 'bus_metro' | 'wfh'
  cookingFuel: 'lpg', // 'lpg' | 'electric_induction' | 'piped_gas' | 'biomass_wood'
  homeType: 'apartment', // 'apartment' | 'independent_house' | 'floor' | 'informal'
  purifierOwned: 'diy', // 'none' | 'portable' | 'diy'
  monthlyBudgetBand: 'medium', // 'low' | 'medium' | 'high'
  preferredLanguage: 'en', // 'en' | 'hi' | 'pa'
  calibratedIndoorPm25: null
};

export const PERSONA_PRESETS = {
  family: {
    id: 'family',
    title: 'Family with Young Children',
    adults: 2,
    children: 2,
    elderly: 0,
    conditions: [],
    commute: 'car',
    cookingFuel: 'lpg',
    homeType: 'apartment',
    purifierOwned: 'diy',
    monthlyBudgetBand: 'medium'
  },
  commuter: {
    id: 'commuter',
    title: 'Daily Commuter & Office Worker',
    adults: 1,
    children: 0,
    elderly: 0,
    conditions: [],
    commute: 'two_wheeler',
    cookingFuel: 'piped_gas',
    homeType: 'floor',
    purifierOwned: 'portable',
    monthlyBudgetBand: 'medium'
  },
  elderly: {
    id: 'elderly',
    title: 'Senior / Asthmatic Resident',
    adults: 1,
    children: 0,
    elderly: 1,
    conditions: ['asthma', 'heart'],
    commute: 'walk',
    cookingFuel: 'lpg',
    homeType: 'independent_house',
    purifierOwned: 'portable',
    monthlyBudgetBand: 'medium'
  },
  apartment: {
    id: 'apartment',
    title: 'High-Density Apartment Resident',
    adults: 2,
    children: 1,
    elderly: 0,
    conditions: [],
    commute: 'bus_metro',
    cookingFuel: 'piped_gas',
    homeType: 'apartment',
    purifierOwned: 'portable',
    monthlyBudgetBand: 'high'
  },
  budget: {
    id: 'budget',
    title: 'Budget-Conscious / Low-Income Household',
    adults: 3,
    children: 2,
    elderly: 1,
    conditions: [],
    commute: 'bus_metro',
    cookingFuel: 'lpg',
    homeType: 'floor',
    purifierOwned: 'none',
    monthlyBudgetBand: 'low'
  }
};

const CHOICES = {
  commute: ['walk', 'cycle', 'two_wheeler', 'car', 'bus_metro', 'wfh'],
  cookingFuel: ['lpg', 'electric_induction', 'piped_gas', 'biomass_wood'],
  homeType: ['apartment', 'independent_house', 'floor', 'informal'],
  purifierOwned: ['none', 'portable', 'diy'],
  monthlyBudgetBand: ['low', 'medium', 'high'],
  preferredLanguage: ['en', 'hi', 'pa']
};
const CONDITION_IDS = ['asthma', 'heart', 'pregnancy'];
const PROFILE_STORAGE_KEY = 'aura_household_profile';

function normalizeIndoorReading(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
  const reading = Number(value);
  return Number.isFinite(reading) && reading >= 0 && reading <= 5000 ? reading : null;
}

function normalizeProfile(saved) {
  const profile = { ...DEFAULT_PROFILE, ...saved };
  if (typeof profile.commute === 'object') profile.commute = profile.commute?.mode;
  if (profile.cookingFuel === 'kerosene') profile.cookingFuel = 'biomass_wood';
  for (const [field, choices] of Object.entries(CHOICES)) {
    if (!choices.includes(profile[field])) profile[field] = DEFAULT_PROFILE[field];
  }
  for (const field of ['adults', 'children', 'elderly']) {
    if (!Number.isInteger(profile[field]) || profile[field] < 0 || profile[field] > 20) {
      profile[field] = DEFAULT_PROFILE[field];
    }
  }
  profile.conditions = Array.isArray(profile.conditions)
    ? CONDITION_IDS.filter((condition) => profile.conditions.includes(condition))
    : DEFAULT_PROFILE.conditions;
  profile.calibratedIndoorPm25 = normalizeIndoorReading(profile.calibratedIndoorPm25);
  return profile;
}

export function findMatchingPreset(profile) {
  return Object.values(PERSONA_PRESETS).find(({ id: _id, title: _title, conditions, ...traits }) => (
    conditions.length === profile.conditions.length
    && conditions.every((condition) => profile.conditions.includes(condition))
    && Object.entries(traits).every(([field, value]) => profile[field] === value)
  ))?.id;
}

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      return normalizeProfile(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)));
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // The current session can still use the in-memory profile.
    }
  }, [profile]);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return localStorage.getItem('aura_onboarding_completed') !== 'true';
    } catch {
      return false;
    }
  });

  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_simple_mode');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // on by default for first-time users
  });

  const toggleSimpleMode = useCallback(() => {
    setIsSimpleMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aura_simple_mode', String(next));
      } catch {}
      return next;
    });
  }, []);

  const updateProfile = useCallback((fields) => {
    setProfile((previous) => ({ ...previous, ...fields }));
  }, []);

  // Apply a preset persona to the profile
  const applyPreset = useCallback((presetId) => {
    const preset = PERSONA_PRESETS[presetId];
    if (preset) {
      updateProfile(preset);
    }
  }, [updateProfile]);

  // Calibrate indoor reading with user's own monitor
  const calibrateIndoor = useCallback((pm25Val) => {
    updateProfile({ calibratedIndoorPm25: normalizeIndoorReading(pm25Val) });
  }, [updateProfile]);

  const resetCalibration = useCallback(() => {
    updateProfile({ calibratedIndoorPm25: null });
  }, [updateProfile]);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
    try {
      localStorage.setItem('aura_onboarding_completed', 'true');
    } catch {}
  }, []);

  return React.createElement(
    ProfileContext.Provider,
    {
      value: {
        profile,
        updateProfile,
        applyPreset,
        calibrateIndoor,
        resetCalibration,
        isOnboardingOpen,
        setIsOnboardingOpen,
        completeOnboarding,
        isSimpleMode,
        toggleSimpleMode
      }
    },
    children
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
