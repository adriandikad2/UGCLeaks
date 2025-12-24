'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeContextType = {
  isGrayscale: boolean;
  toggleTheme: () => void;
  buttonText: string;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with false, but this will be corrected on mount
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // --- UPDATED LOGIC FOR DYNAMIC TEXT ---
  // If grayscale is active, show "COLOR". If not, show "B&W".
  const buttonText = isGrayscale ? "SWITCH TO COLOR" : "SWITCH TO B&W"; 

  // Load from localStorage on mount BEFORE rendering and apply to body
  useEffect(() => {
    // 1. Read from local storage
    const savedTheme = localStorage.getItem('ugc-theme-grayscale');
    const shouldBeGrayscale = savedTheme === 'true';
    
    setIsGrayscale(shouldBeGrayscale);
    
    // 2. Apply class immediately to body
    if (shouldBeGrayscale) {
      document.body.classList.add('grayscale');
    }
    
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setIsGrayscale((prev) => {
      const newValue = !prev;
      localStorage.setItem('ugc-theme-grayscale', String(newValue));
      
      // Update body class
      if (newValue) {
        document.body.classList.add('grayscale');
      } else {
        document.body.classList.remove('grayscale');
      }
      
      return newValue;
    });
  };

  return (
    // FIX: Provider must ALWAYS wrap children, even before mount
    <ThemeContext.Provider value={{ isGrayscale, toggleTheme, buttonText }}>
      <div style={{ opacity: isMounted ? 1 : 0, transition: 'opacity 0.2s' }}>
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