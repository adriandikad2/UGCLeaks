'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeContext';

const LANGUAGES = [
    { code: 'en', name: 'English', emoji: '🇺🇸' },
    { code: 'id', name: 'Indonesia', emoji: '🇮🇩' },
    { code: 'es', name: 'Español', emoji: '🇪🇸' },
    { code: 'fr', name: 'Français', emoji: '🇫🇷' },
    { code: 'de', name: 'Deutsch', emoji: '🇩🇪' },
    { code: 'ja', name: '日本語', emoji: '🇯🇵' },
    { code: 'ko', name: '한국어', emoji: '🇰🇷' },
    { code: 'zh-CN', name: '中文', emoji: '🇨🇳' },
    { code: 'ru', name: 'Русский', emoji: '🇷🇺' },
    { code: 'pt', name: 'Português', emoji: '🇧🇷' },
];

export default function TranslateWidget({ inline = false }: { inline?: boolean }) {
    const { currentTheme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentLang, setCurrentLang] = useState(LANGUAGES[0]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Read current language from cookie
        const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
        if (match && match[1]) {
            const found = LANGUAGES.find(l => l.code === match[1]) || LANGUAGES[0];
            setCurrentLang(found);
        }

        // Only add the script if it doesn't exist
        if (!document.querySelector('script[src*="translate.google.com"]')) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInitWidget';
            document.head.appendChild(script);

            window.googleTranslateElementInitWidget = () => {
                new window.google.translate.TranslateElement({
                    pageLanguage: 'en',
                    autoDisplay: false,
                }, 'google_translate_hidden_widget');
            };
        }

        // Close dropdown when clicking outside
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTranslate = (langCode: string) => {
        // Set the translation cookie
        document.cookie = `googtrans=/en/${langCode}; path=/`;
        document.cookie = `googtrans=/en/${langCode}; domain=.${location.hostname}; path=/`;
        
        // Reload to apply translation via the injected script reading the new cookie
        window.location.reload();
    };

    return (
        <div
            ref={containerRef}
            className={inline ? "relative z-40" : "fixed top-6 right-36 z-40"}
        >
            {/* Hidden container for Google's native script initialization */}
            <div id="google_translate_hidden_widget" className="hidden"></div>

            {/* Custom UI Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="relative px-4 py-3 rounded-2xl border-2 backdrop-blur-md font-bold tracking-wide transition-all duration-300 group overflow-hidden"
                style={{
                    borderColor: currentTheme.colors.primary,
                    background: `linear-gradient(135deg, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`,
                    color: currentTheme.colors.primary,
                    boxShadow: `0 4px 20px ${currentTheme.colors.primary}40`,
                }}
            >
                {/* Animated background */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        background: `linear-gradient(135deg, ${currentTheme.colors.primary}30, ${currentTheme.colors.secondary}30)`,
                    }}
                />

                <span className="relative flex items-center gap-2">
                    <span className="text-xl">{currentLang.emoji}</span>
                    <span className="hidden sm:inline uppercase text-sm tracking-wider">{currentLang.code}</span>
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            {/* Expanded Language Palette */}
            <div
                className={`absolute top-full right-0 mt-3 transition-all duration-300 origin-top-right ${isExpanded
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
            >
                <div
                    className="p-4 rounded-2xl backdrop-blur-xl border-2 shadow-2xl min-w-[280px]"
                    style={{
                        background: `linear-gradient(135deg, ${currentTheme.colors.cardBg}f0, ${currentTheme.colors.cardBg}e0)`,
                        borderColor: currentTheme.colors.primary + '40',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3
                            className="font-black text-sm uppercase tracking-widest"
                            style={{ color: currentTheme.colors.textPrimary }}
                        >
                            🌍 Translate
                        </h3>
                    </div>

                    {/* Language Grid */}
                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {LANGUAGES.map((lang) => {
                            const isActive = lang.code === currentLang.code;
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => handleTranslate(lang.code)}
                                    className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-105 hover:bg-white/5'
                                        }`}
                                    style={{
                                        background: isActive
                                            ? `linear-gradient(135deg, ${currentTheme.colors.primary}30, ${currentTheme.colors.secondary}30)`
                                            : 'transparent',
                                        border: isActive ? `2px solid ${currentTheme.colors.primary}` : '2px solid transparent',
                                    }}
                                >
                                    <span className="text-2xl drop-shadow-md">{lang.emoji}</span>
                                    <span
                                        className="text-sm font-bold truncate"
                                        style={{ color: isActive ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}
                                    >
                                        {lang.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
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
