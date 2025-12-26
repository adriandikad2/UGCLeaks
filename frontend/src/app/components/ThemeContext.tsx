'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Theme definitions
export type ThemeName = 'default' | 'bw' | 'midnight' | 'cosmic' | 'skies' | 'sakura' | 'nature' | 'noob' | 'clean';
export type EffectType = 'blocks' | 'stars' | 'orbs' | 'clouds' | 'petals' | 'leaves' | 'none';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  background: string;
  cardBg: string;
  textPrimary: string;      // Text on cards/light surfaces
  textSecondary: string;    // Secondary text on cards
  onBgText: string;         // Text directly on gradient background
  onBgTextSecondary: string; // Secondary text on gradient background
  // Additional colors for card gradients
  gradient1: string;
  gradient2: string;
  gradient3: string;
  gradient4: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  emoji: string;
  colors: ThemeColors;
  effectType: EffectType;
  isSpecial?: boolean;
}

export const THEMES: Theme[] = [
  {
    name: 'default',
    label: 'Colorful',
    emoji: '🌈',
    effectType: 'blocks',
    colors: {
      primary: '#ff006e',
      secondary: '#00d9ff',
      accent: '#ffbe0b',
      success: '#00ff41',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff006e 100%)',
      cardBg: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      onBgText: '#ffffff',
      onBgTextSecondary: 'rgba(255,255,255,0.85)',
      gradient1: '#ff006e',
      gradient2: '#00d9ff',
      gradient3: '#ffbe0b',
      gradient4: '#00ff41',
    },
  },
  {
    name: 'bw',
    label: 'B&W',
    emoji: '🖤',
    effectType: 'none',
    colors: {
      primary: '#888888',
      secondary: '#666666',
      accent: '#aaaaaa',
      success: '#888888',
      background: '#1a1a1a',
      cardBg: '#2a2a2a',
      textPrimary: '#e5e5e5',
      textSecondary: '#a3a3a3',
      onBgText: '#e5e5e5',
      onBgTextSecondary: '#a3a3a3',
      gradient1: '#888888',
      gradient2: '#666666',
      gradient3: '#aaaaaa',
      gradient4: '#999999',
    },
    isSpecial: true,
  },
  {
    name: 'midnight',
    label: 'Midnight',
    emoji: '🌙',
    effectType: 'stars',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      success: '#22d3ee',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      cardBg: '#1e293b',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      onBgText: '#f1f5f9',
      onBgTextSecondary: '#c7d2fe',
      gradient1: '#6366f1',
      gradient2: '#8b5cf6',
      gradient3: '#a78bfa',
      gradient4: '#22d3ee',
    },
  },
  {
    name: 'cosmic',
    label: 'Cosmic',
    emoji: '🌌',
    effectType: 'orbs',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      success: '#a855f7',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #831843 100%)',
      cardBg: '#2e1065',
      textPrimary: '#fdf4ff',
      textSecondary: '#d8b4fe',
      onBgText: '#fdf4ff',
      onBgTextSecondary: '#f5d0fe',
      gradient1: '#ec4899',
      gradient2: '#8b5cf6',
      gradient3: '#06b6d4',
      gradient4: '#a855f7',
    },
  },
  {
    name: 'skies',
    label: 'Skies',
    emoji: '☁️',
    effectType: 'clouds',
    colors: {
      primary: '#0ea5e9',
      secondary: '#38bdf8',
      accent: '#7dd3fc',
      success: '#2dd4bf',
      background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
      cardBg: '#f0f9ff',
      textPrimary: '#0c4a6e',
      textSecondary: '#0369a1',
      onBgText: '#ffffff',
      onBgTextSecondary: '#bae6fd',
      gradient1: '#0ea5e9',
      gradient2: '#38bdf8',
      gradient3: '#7dd3fc',
      gradient4: '#2dd4bf',
    },
  },
  {
    name: 'sakura',
    label: 'Sakura',
    emoji: '🌸',
    effectType: 'petals',
    colors: {
      primary: '#fb7185',
      secondary: '#f472b6',
      accent: '#fda4af',
      success: '#f9a8d4',
      background: 'linear-gradient(135deg, #4c0519 0%, #d66184 50%, #ed90b7 100%)',
      cardBg: '#fff1f2',
      textPrimary: '#881337',
      textSecondary: '#be185d',
      onBgText: '#ffffff',
      onBgTextSecondary: '#fecdd3',
      gradient1: '#fb7185',
      gradient2: '#f472b6',
      gradient3: '#fda4af',
      gradient4: '#f9a8d4',
    },
  },
  {
    name: 'nature',
    label: 'Nature',
    emoji: '🌿',
    effectType: 'leaves',
    colors: {
      primary: '#22c55e',
      secondary: '#4ade80',
      accent: '#a3e635',
      success: '#86efac',
      background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
      cardBg: '#f0fdf4',
      textPrimary: '#14532d',
      textSecondary: '#166534',
      onBgText: '#ffffff',
      onBgTextSecondary: '#bbf7d0',
      gradient1: '#22c55e',
      gradient2: '#4ade80',
      gradient3: '#a3e635',
      gradient4: '#86efac',
    },
  },
  {
    name: 'noob',
    label: 'Noob',
    emoji: '🎮',
    effectType: 'none',
    colors: {
      primary: '#F4CC43',
      secondary: '#176BAA',
      accent: '#A5BC50',
      success: '#e7d400ff',
      background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
      cardBg: '#fafafa',
      textPrimary: '#18181b',
      textSecondary: '#52525b',
      onBgText: '#ffffff',
      onBgTextSecondary: 'rgba(255,255,255,0.8)',
      gradient1: '#F4CC43',
      gradient2: '#176BAA',
      gradient3: '#A5BC50',
      gradient4: '#e7d400ff',
    },
  },
  {
    name: 'clean',
    label: 'Clean',
    emoji: '✨',
    effectType: 'none',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#000000ff',
      success: '#25d6f1ff',
      background: '#f9fafbdd',
      cardBg: '#ffffffb9',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      onBgText: '#111827',
      onBgTextSecondary: '#374151',
      gradient1: '#374151',
      gradient2: '#6b7280',
      gradient3: '#000000ff',
      gradient4: '#25d6f1ff',
    },
  },
];

type ThemeContextType = {
  currentTheme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  nextTheme: () => void;
  prevTheme: () => void;
  themes: Theme[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [isMounted, setIsMounted] = useState(false);

  const currentTheme = THEMES.find(t => t.name === themeName) || THEMES[0];

  // Apply theme to document
  const applyTheme = useCallback((theme: Theme) => {
    // Remove all theme classes
    THEMES.forEach(t => {
      document.body.classList.remove(`theme-${t.name}`);
    });

    // Add current theme class
    document.body.classList.add(`theme-${theme.name}`);

    // Set CSS variables
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-success', theme.colors.success);
    root.style.setProperty('--theme-card-bg', theme.colors.cardBg);
    root.style.setProperty('--theme-text-primary', theme.colors.textPrimary);
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--theme-on-bg-text', theme.colors.onBgText);
    root.style.setProperty('--theme-on-bg-text-secondary', theme.colors.onBgTextSecondary);
    root.style.setProperty('--theme-gradient-1', theme.colors.gradient1);
    root.style.setProperty('--theme-gradient-2', theme.colors.gradient2);
    root.style.setProperty('--theme-gradient-3', theme.colors.gradient3);
    root.style.setProperty('--theme-gradient-4', theme.colors.gradient4);

    // Handle background
    if (theme.colors.background.includes('gradient')) {
      root.style.setProperty('--theme-background', theme.colors.background);
    } else {
      root.style.setProperty('--theme-background', theme.colors.background);
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('ugc-theme') as ThemeName | null;
    if (savedTheme && THEMES.find(t => t.name === savedTheme)) {
      setThemeName(savedTheme);
      applyTheme(THEMES.find(t => t.name === savedTheme)!);
    } else {
      applyTheme(THEMES[0]);
    }
    setIsMounted(true);
  }, [applyTheme]);

  const setTheme = useCallback((name: ThemeName) => {
    const theme = THEMES.find(t => t.name === name);
    if (theme) {
      setThemeName(name);
      localStorage.setItem('ugc-theme', name);
      applyTheme(theme);
    }
  }, [applyTheme]);

  const nextTheme = useCallback(() => {
    const currentIndex = THEMES.findIndex(t => t.name === themeName);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex].name);
  }, [themeName, setTheme]);

  const prevTheme = useCallback(() => {
    const currentIndex = THEMES.findIndex(t => t.name === themeName);
    const prevIndex = (currentIndex - 1 + THEMES.length) % THEMES.length;
    setTheme(THEMES[prevIndex].name);
  }, [themeName, setTheme]);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      themeName,
      setTheme,
      nextTheme,
      prevTheme,
      themes: THEMES
    }}>
      <div style={{ opacity: isMounted ? 1 : 0, transition: 'opacity 0.3s' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}