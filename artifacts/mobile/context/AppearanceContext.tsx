import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type AppearancePref = "system" | "light" | "dark";

interface AppearanceContextType {
  appearance: AppearancePref;
  effectiveScheme: "light" | "dark";
  setAppearance: (pref: AppearancePref) => Promise<void>;
}

const AppearanceContext = createContext<AppearanceContextType>({
  appearance: "system",
  effectiveScheme: "light",
  setAppearance: async () => {},
});

const STORAGE_KEY = "@appearance";

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [appearance, setAppearancePref] = useState<AppearancePref>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setAppearancePref(stored);
      }
    });
  }, []);

  const effectiveScheme: "light" | "dark" =
    appearance === "system" ? (systemScheme ?? "light") : appearance;

  const setAppearance = async (pref: AppearancePref) => {
    setAppearancePref(pref);
    await AsyncStorage.setItem(STORAGE_KEY, pref);
  };

  return (
    <AppearanceContext.Provider value={{ appearance, effectiveScheme, setAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
