'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from './ThemeContext';

export default function ThemeSwitcher() {
    const { currentTheme, setTheme, themes, nextTheme, prevTheme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeClick = (theme: Theme) => {
        setTheme(theme.name);
        setIsExpanded(false);
    };

    return (
        <div
            ref={containerRef}
            className="fixed top-6 right-6 z-40"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Main Button / Collapsed State */}
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
                    <span className="text-xl">{currentTheme.emoji}</span>
                    <span className="hidden sm:inline">{currentTheme.label}</span>
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

            {/* Expanded Palette */}
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
                            🎨 Choose Theme
                        </h3>

                        {/* Navigation Arrows */}
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); prevTheme(); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                style={{
                                    background: currentTheme.colors.primary + '20',
                                    color: currentTheme.colors.primary,
                                }}
                            >
                                ◀
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextTheme(); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                style={{
                                    background: currentTheme.colors.primary + '20',
                                    color: currentTheme.colors.primary,
                                }}
                            >
                                ▶
                            </button>
                        </div>
                    </div>

                    {/* Theme Grid */}
                    <div className="grid grid-cols-4 gap-3">
                        {themes.map((theme) => {
                            const isActive = theme.name === currentTheme.name;
                            return (
                                <button
                                    key={theme.name}
                                    onClick={() => handleThemeClick(theme)}
                                    className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-105'
                                        }`}
                                    style={{
                                        background: isActive
                                            ? `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}30)`
                                            : 'transparent',
                                        border: isActive ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                                    }}
                                >
                                    {/* Color Preview Dot */}
                                    <div
                                        className="w-10 h-10 rounded-full shadow-lg transition-all duration-300 group-hover:scale-110"
                                        style={{
                                            background: theme.name === 'bw'
                                                ? 'linear-gradient(135deg, #333 0%, #888 50%, #ccc 100%)'
                                                : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent})`,
                                            boxShadow: isActive ? `0 4px 15px ${theme.colors.primary}60` : 'none',
                                        }}
                                    />

                                    {/* Label */}
                                    <span
                                        className="text-xs font-bold truncate max-w-full"
                                        style={{ color: isActive ? theme.colors.primary : currentTheme.colors.textSecondary }}
                                    >
                                        {theme.emoji}
                                    </span>

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div
                                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                            style={{ background: theme.colors.primary }}
                                        >
                                            ✓
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Current Theme Label */}
                    <div
                        className="mt-4 pt-3 border-t text-center"
                        style={{ borderColor: currentTheme.colors.primary + '30' }}
                    >
                        <p
                            className="text-sm font-bold"
                            style={{ color: currentTheme.colors.textSecondary }}
                        >
                            Current: <span style={{ color: currentTheme.colors.primary }}>{currentTheme.label}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
