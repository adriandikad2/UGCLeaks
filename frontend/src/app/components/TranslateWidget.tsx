'use client';

import { useEffect } from 'react';
import { useTheme } from './ThemeContext';

export default function TranslateWidget({ inline = false }: { inline?: boolean }) {
  const { currentTheme } = useTheme();

  useEffect(() => {
    // Only add the script if it doesn't exist
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInitWidget';
      document.head.appendChild(script);

      window.googleTranslateElementInitWidget = () => {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        }, 'google_translate_widget');
      };
    }
  }, []);

  return (
    <div
      className={inline ? "relative z-40" : "fixed top-6 right-36 z-40"}
      title="Translate Page"
    >
      <div 
        className="px-2 py-1.5 rounded-2xl border-2 backdrop-blur-md transition-all overflow-hidden"
        style={{
          borderColor: currentTheme.colors.primary,
          background: `linear-gradient(135deg, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`,
          boxShadow: `0 4px 20px ${currentTheme.colors.primary}40`,
        }}
      >
        {/* We use a specific ID for this widget instance */}
        <div id="google_translate_widget" className="text-sm font-bold h-7 flex items-center"></div>
      </div>
    </div>
  );
}

// Add types for Google Translate
declare global {
  interface Window {
    googleTranslateElementInitWidget: () => void;
  }
}
