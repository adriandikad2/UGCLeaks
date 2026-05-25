'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';

export default function AnnouncementAlert() {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { currentTheme } = useTheme();

    // Close modal function
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            {/* The Floating Alert (Middle Right) */}
            <div className="fixed top-1/2 right-0 -translate-y-1/2 z-40 flex items-center">
                <AnimatePresence mode="wait">
                    {isExpanded ? (
                        <motion.div
                            key="expanded"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="flex items-center shadow-2xl rounded-l-2xl border-y-2 border-l-2 backdrop-blur-md overflow-hidden"
                            style={{
                                borderColor: currentTheme.colors.primary,
                                background: `linear-gradient(135deg, ${currentTheme.colors.cardBg}f0, ${currentTheme.colors.cardBg}d0)`,
                            }}
                        >
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-4 font-black tracking-widest text-lg uppercase transition-all hover:opacity-80"
                                style={{ color: currentTheme.colors.primary }}
                            >
                                🚨 Alert!
                            </button>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="px-3 py-4 bg-black/10 hover:bg-black/20 transition-colors border-l"
                                style={{ borderColor: currentTheme.colors.primary + '40', color: currentTheme.colors.textSecondary }}
                                title="Dismiss"
                            >
                                ✕
                            </button>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="collapsed"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            whileHover={{ x: -5 }}
                            onClick={() => setIsModalOpen(true)}
                            className="py-4 px-2 rounded-l-xl border-y-2 border-l-2 backdrop-blur-md shadow-xl flex items-center justify-center transition-colors hover:brightness-110"
                            style={{
                                borderColor: currentTheme.colors.primary,
                                background: currentTheme.colors.primary,
                                color: '#fff',
                            }}
                            title="View Announcement"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                            </svg>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* The Image Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
                        >
                            <button
                                onClick={closeModal}
                                className="absolute -top-12 right-0 md:-right-12 w-10 h-10 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border-2 border-white/30 backdrop-blur-md transition-all z-10"
                            >
                                ✕
                            </button>
                            
                            <div 
                                className="relative w-full rounded-2xl overflow-hidden border-4 shadow-2xl"
                                style={{ borderColor: currentTheme.colors.primary, boxShadow: `0 0 40px ${currentTheme.colors.primary}40` }}
                            >
                                <img 
                                    src="/annc/1.png" 
                                    alt="Announcement" 
                                    className="w-full h-auto max-h-[85vh] object-contain bg-black/50"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
