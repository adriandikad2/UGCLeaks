'use client';

import { useState } from 'react';
import { ScrollText, X, ChevronUp, Contact } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOGS = [
    {
        version: 'v1.6',
        date: 'Dec 27, 2025',
        changes: [
            '📱 Mobile-friendly buttons to hide overwhelming HUDs.',
            '🍫 Instead of a chocolate bar, you get a navigation bar instead.'
        ]
    },
    {
        version: 'v1.5',
        date: 'Dec 26, 2025',
        changes: [
            '🎨 Themes has arrived! Personalize your experience to your likings! 🎉'
        ]
    },
    {
        version: 'v1.4',
        date: 'Dec 26, 2025',
        changes: [
            '🔑 New Code Drop method.',
            '🏚️ New Abandoned section. How pity items can get forgotten over time.',
            '🎄 crisis is over'
        ]
    },
    {
        version: 'v1.3',
        date: 'Dec 26, 2025',
        changes: [
            '⌚ Finalization to the Timezone Hell situation. Boy do they just not give up at all. That should be the last we see of them.',
            '🛍️ Integration with Roblox\'s market API to scan stocks real-time! Thought this would\'ve been difficult.',
            '0️⃣ Items with exhausted stocks are now marked as sold out!',
            '👤 @Leakers you now own the ability to mark items with no stocks as sold out to ease things up. Also created a much more sleek updating UI. Happy scheduling 🎅',
            '🎄 Still merry crisis!'
        ]
    },
    {
        version: 'v1.2',
        date: 'Dec 26, 2025',
        changes: [
            '⌚ Timezone Hell was not fixed yesterday. Whew, turns out there was a mismatch between local and UTC time. Hopefully nothing else of the same issues appear in the future...',
            '🔄️ Refresh buttons for you that do not want to refresh the /leaks page.',
            '🧮 Leaks now defaults to sorting based on the closest times to drop.',
            '💬 New HUD to show the very next item that is scheduled to drop! Festive!',
            '📱 Several mobile buttons responsiveness.',
            '🎄 Merry crisis!'
        ]
    },
    {
        version: 'v1.1',
        date: 'Dec 25, 2025',
        changes: [
            '🪵 Update logs! Yes! It\'s me, right here! The thing you\'re currently reading right now!',
            '🛝 Added Digital Playground! Includes handy dandy thingamajigs and ridiculous doo-dads such as Paintball, Stickers, and more! You can try them out in the bottom right of the screen. Don\'t get too bored around here!',
            '🎛️ Added appropriate volume sliders for the tools in Digital Playground! Those things can get really loud. Especially the hammer... yikes.',
            '🔧 Fixed Timezone Hell phenomenon! Scheduling should be good to go now.',
            '⚡ Optimized asset loading with API routes. Fancy stuff.'
        ]
    },
    {
        version: 'v1.0',
        date: 'Dec 24, 2025',
        changes: [
            '🚀 Initial Deployment! This project\'s finally ready to utilize =) Have fun hunters!',
        ]
    }
];

export default function UpdateLogs() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-auto">

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-80 max-h-[60vh] overflow-y-auto bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 text-white scrollbar-hide"
                    >
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <ScrollText size={18} className="text-noob-cyan" />
                                Patch Notes
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-1 rounded-lg transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {LOGS.map((log, i) => (
                                <div key={i} className="relative pl-4 border-l-2 border-white/20">
                                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-noob-pink"></div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-noob-yellow">{log.version}</span>
                                        <span className="text-xs text-white/50">{log.date}</span>
                                    </div>
                                    <ul className="text-sm space-y-1 text-white/80">
                                        {log.changes.map((change, j) => (
                                            <li key={j}>• {change}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-4 border-t border-white/10">
                            <h4 className="text-sm font-bold text-noob-cyan mb-2 flex items-center gap-2">
                                <Contact size={14} /> Contact & Inquiries
                            </h4>
                            <p className="text-xs text-white/70 mb-3 leading-relaxed">
                                Found a bug? Perhaps a critical bug? Perchance you got suggestions? Mayhaps want to be a leaker? Away at it.
                            </p>

                            <div className="flex gap-3">
                                <a
                                    href="https://discord.com/users/409214212317904907"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2]/20 hover:bg-[#5865F2] border border-[#5865F2]/50 rounded-lg text-xs transition-all"
                                >
                                    <Contact size={12} /> Discord (_.ok)
                                </a>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 text-center">
                            <p className="text-xs text-white/40">UGC Leaks © 2025</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center gap-2 px-5 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${isOpen
                    ? 'bg-white text-black'
                    : 'bg-black/60 backdrop-blur-md text-white hover:bg-white hover:text-black border border-white/20'
                    }`}
            >
                {isOpen ? (
                    <>Close Logs <ChevronUp size={18} className="rotate-180 transition-transform" /></>
                ) : (
                    <><ScrollText size={18} className="group-hover:animate-bounce" /> Updates</>
                )}
            </button>
        </div>
    );
}