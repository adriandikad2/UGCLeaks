'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGE_MAP: Record<string, string> = {
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'ko': 'Korean',
  'ru': 'Russian',
  'pt': 'Portuguese',
  'it': 'Italian',
  'nl': 'Dutch',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'pl': 'Polish',
  'th': 'Thai',
  'id': 'Indonesian',
};

// Expose the init function to the global window object for Google's script
declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export default function TranslationBanner({ acceptLanguage }: { acceptLanguage: string | null }) {
  const [isVisible, setIsVisible] = useState(false);
  const [targetLang, setTargetLang] = useState<string>('');
  const [targetLangName, setTargetLangName] = useState<string>('');

  useEffect(() => {
    // Check if the user has already dismissed the banner
    const dismissed = localStorage.getItem('translation_dismissed');
    if (dismissed === 'true') return;

    // Check if Google Translate is already active (by looking for the googtrans cookie)
    const hasGoogtrans = document.cookie.includes('googtrans=');
    if (hasGoogtrans) return;

    // Parse the Accept-Language header or fallback to navigator.language
    let langCode = 'en';
    
    if (acceptLanguage) {
      // e.g. "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7" -> "es"
      const parts = acceptLanguage.split(',');
      if (parts.length > 0) {
        const primary = parts[0].split('-')[0].trim().toLowerCase();
        langCode = primary;
      }
    } else if (typeof navigator !== 'undefined') {
      langCode = navigator.language.split('-')[0].toLowerCase();
    }

    if (langCode && langCode !== 'en') {
      setTargetLang(langCode);
      setTargetLangName(LANGUAGE_MAP[langCode] || langCode.toUpperCase());
      
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [acceptLanguage]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('translation_dismissed', 'true');
  };

  const handleTranslate = () => {
    setIsVisible(false);
    
    // Create the target div if it doesn't exist
    let targetDiv = document.getElementById('google_translate_element');
    if (!targetDiv) {
      targetDiv = document.createElement('div');
      targetDiv.id = 'google_translate_element';
      targetDiv.style.display = 'none'; // Keep it hidden, we just use it for the API
      document.body.appendChild(targetDiv);
    }

    // Set up the initialization callback
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        // We can restrict to specific languages if we want, or leave it open
        autoDisplay: false,
      }, 'google_translate_element');
      
      // We set the cookie to force Google Translate into the target language immediately
      document.cookie = `googtrans=/en/${targetLang}; path=/`;
      document.cookie = `googtrans=/en/${targetLang}; domain=.${location.hostname}; path=/`;
      
      // Trigger a reload to apply the translation immediately
      window.location.reload();
    };

    // Check if script is already loaded
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.head.appendChild(script);
    } else {
      // If script is already there, just reload with cookie set
      document.cookie = `googtrans=/en/${targetLang}; path=/`;
      document.cookie = `googtrans=/en/${targetLang}; domain=.${location.hostname}; path=/`;
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4"
        >
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-2xl p-4 border-2 border-blue-500/50 flex flex-col sm:flex-row items-center gap-4 max-w-2xl w-full">
            <div className="text-3xl">🌍</div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                Would you like to translate this page to {targetLangName}?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by Google Translate
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleTranslate}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Translate
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-lg transition-colors text-sm"
              >
                No Thanks
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
