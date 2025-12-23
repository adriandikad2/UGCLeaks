'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeContextType = {
  isGrayscale: boolean;
  toggleTheme: () => void;
  buttonText: string;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isGrayscale, setIsGrayscale] = useState(false);
  
  // --- UPDATED LOGIC FOR DYNAMIC TEXT ---
  // If grayscale is active, show "COLOR". If not, show "B&W".
  const buttonText = isGrayscale ? "SWITCH TO COLOR" : "SWITCH TO B&W"; 

  // Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('ugc-theme-grayscale');
    if (savedTheme === 'true') {
      setIsGrayscale(true);
    }
  }, []);

  // Toggle function
  const toggleTheme = () => {
    setIsGrayscale((prev) => {
      const newValue = !prev;
      localStorage.setItem('ugc-theme-grayscale', String(newValue));
      return newValue;
    });
  };

  return (
    <ThemeContext.Provider value={{ isGrayscale, toggleTheme, buttonText }}>
      {children}
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