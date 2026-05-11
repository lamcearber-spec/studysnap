import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Difficulty } from "@/constants/data";

export interface UserProfile {
  name: string;
  countryCode: string;
  countryName: string;
  language: string;
  grade: string;
  subjects: string[];
  difficulty: Difficulty;
  autoGrade?: boolean;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  saveProfile: (p: UserProfile) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);
// Legacy AsyncStorage key — preserved across the StudySnap → MarmotMakesMath rebrand
// so existing users' on-device profile survives the migration.
const STORAGE_KEY = "@studysnap_profile";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setProfile(JSON.parse(raw) as UserProfile);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const saveProfile = useCallback(async (p: UserProfile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
  }, []);

  const updateProfile = useCallback(async (partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const clearProfile = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, isLoading, saveProfile, updateProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
