import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_household_profile');
      if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_PROFILE;
  });

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    try {
      return localStorage.getItem('aura_onboarding_completed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return localStorage.getItem('aura_onboarding_completed') !== 'true';
    } catch (e) {
      return false;
    }
  });

  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_simple_mode');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true; // on by default for first-time users
  });

  const toggleSimpleMode = useCallback(() => {
    setIsSimpleMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aura_simple_mode', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Persist profile to localStorage
  const updateProfile = useCallback((fields) => {
    setProfile((prev) => {
      const updated = { ...prev, ...fields };
      try {
        localStorage.setItem('aura_household_profile', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
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
    const parsed = pm25Val != null && String(pm25Val).trim() !== '' ? Number(pm25Val) : NaN;
    const num = Number.isFinite(parsed) && parsed >= 0 && parsed <= 5000 ? parsed : null;
    updateProfile({ calibratedIndoorPm25: num });
  }, [updateProfile]);

  const resetCalibration = useCallback(() => {
    updateProfile({ calibratedIndoorPm25: null });
  }, [updateProfile]);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    setIsOnboardingOpen(false);
    try {
      localStorage.setItem('aura_onboarding_completed', 'true');
    } catch (e) {}
  }, []);

  const totalHouseholdMembers = (profile.adults || 0) + (profile.children || 0) + (profile.elderly || 0);

  return React.createElement(
    ProfileContext.Provider,
    {
      value: {
        profile,
        updateProfile,
        applyPreset,
        calibrateIndoor,
        resetCalibration,
        hasCompletedOnboarding,
        isOnboardingOpen,
        setIsOnboardingOpen,
        completeOnboarding,
        isSimpleMode,
        setIsSimpleMode,
        toggleSimpleMode,
        totalHouseholdMembers: Math.max(1, totalHouseholdMembers),
        presets: PERSONA_PRESETS
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
