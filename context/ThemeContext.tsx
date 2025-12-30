import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, type Theme, type ThemeId } from '../data/themes';

interface ThemeContextType {
  currentTheme: Theme;
  themeId: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('themeId');
      return (saved as ThemeId) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const currentTheme = themes[themeId];
  const availableThemes = Object.values(themes);

  useEffect(() => {
    try {
      localStorage.setItem('themeId', themeId);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }

    // Apply CSS variables for theme colors
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [themeId, currentTheme]);

  const setTheme = (newThemeId: ThemeId) => {
    setThemeIdState(newThemeId);
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
