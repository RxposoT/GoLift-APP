import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme } from "../styles/themes";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeContextValue {
  theme: typeof lightTheme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => Promise<void>;
  isDark: boolean;
}

const STORAGE_KEY = "@golift:theme_preference";

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  preference: "system",
  setPreference: async () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark" || saved === "system") {
          setPreferenceState(saved);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  async function setPreference(pref: ThemePreference) {
    setPreferenceState(pref);
    await AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
  }

  const resolvedDark =
    preference === "system"
      ? deviceScheme === "dark"
      : preference === "dark";

  const theme = resolvedDark ? darkTheme : lightTheme;

  // Avoid flicker — don't render until preference is loaded
  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, isDark: resolvedDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Retorna o objecto de cores do tema activo. Substitui o hook anterior. */
export function useTheme() {
  return useContext(ThemeContext).theme;
}

/** Para aceder e alterar a preferência de tema (usado em Settings). */
export function useThemePreference() {
  const { preference, setPreference, isDark } = useContext(ThemeContext);
  return { preference, setPreference, isDark };
}
