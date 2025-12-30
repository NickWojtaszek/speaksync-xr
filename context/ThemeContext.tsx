import React, { createContext, useContext, useEffect } from 'react';
import { themes, type Theme, type ThemeId } from '../data/themes';
import { useStorage } from '../hooks/useStorage';

interface ThemeContextType {
  currentTheme: Theme;
  themeId: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId, themeLoading] = useStorage<ThemeId>(
    'speaksync_theme',
    'dark',
    'user_preferences',
    'theme_id'
  );

  const currentTheme = themes[themeId];
  const availableThemes = Object.values(themes);

  useEffect(() => {
    // Apply CSS variables for theme colors
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [themeId, currentTheme]);

  const setTheme = (newThemeId: ThemeId) => {
    setThemeId(newThemeId);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themeId, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
