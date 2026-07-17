'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, User } from 'lucide-react';
import Link from 'next/link';

type TeamMember = {
    id: string;
    name: string;
    role: string;
    image?: string; // Optional: Leave undefined to opt-out of image
    bio: string;
    robloxLink?: string; // Optional: Leave undefined to opt-out of Roblox link
    discordLink?: string; // Optional: Leave undefined to opt-out of Discord link
};

const RobloxIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
        <path d="M4.686 0L0 18.06l19.314 5.94L24 5.94 4.686 0zm7.848 14.73l-2.486-.763.957-3.693 2.486.763-.957 3.693z" />
    </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
);

// Add or remove members from this list. If someone opts out entirely, just remove them from the array.
const teamMembers: TeamMember[] = [
    {
        id: 'creator',
        name: '0k_fr (_.ok)',
        role: 'Founder, Developer / Creator',
        image: '',
        bio: 'This is your captain speaking 🛫 Welcome aboard UGC Leaks! Feel free to unbuckle your seats and roam the cabin for the latest Free Limited UGC drops. ✈️ To keep our trajectory steady, I’d appreciate your support in submitting a follow on my Roblox profile. Enjoy the flight!',
        robloxLink: 'https://www.roblox.com/users/959262997/profile',
        discordLink: 'https://discord.com/users/409214212317904907'
    },
    {
        id: 'founder',
        name: 'Kiddo',
        role: 'Founder, Scheduler',
        image: '',
        bio: 'awkward ugc creator that founded the site or something :steamhappy:',
        robloxLink: 'https://www.roblox.com/users/1376868704/profile'
    },
    {
        id: 'leaker1',
        name: 'Nevn',
        role: 'Certified Goblin & Leaker',
        image: '',
        bio: 'best new UGC leaker 🙂',
        robloxLink: 'https://www.roblox.com/users/1609237016/profile'
    },
    {
        id: 'leaker2',
        name: 'Eyes',
        role: 'notnevn',
        image: '',
        bio: 'better than nevn',
        robloxLink: 'https://www.roblox.com/users/51142286/profile'
    }
];

// Sub-component to automatically fetch Roblox avatar headshot
const AvatarRenderer = ({ robloxLink, fallbackImage }: { robloxLink?: string, fallbackImage?: string }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(fallbackImage || null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!robloxLink) return;

        // Extract userId from the profile URL (e.g., https://www.roblox.com/users/959262997/profile)
        const match = robloxLink.match(/users\/(\d+)/);
        if (match && match[1]) {
            const userId = match[1];
            setIsLoading(true);

            fetch(`/api/roblox-avatar?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.imageUrl) {
                        setImageUrl(data.imageUrl);
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [robloxLink]);

    if (isLoading && !imageUrl) {
        return <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>;
    }

    if (!imageUrl) {
        return <User className="w-12 h-12 text-white" />;
    }

    return <img src={imageUrl} alt="Profile" className="w-full h-full object-cover bg-white/10" />;
};

export default function AboutWidget() {
    const [isExpanded, setIsExpanded] = useState(false);
    const { currentTheme } = useTheme();

    return (
        <>
            {/* Edge Button */}
            <motion.div
                initial={{ x: 100 }}
                animate={{ x: 0 }}
                className="fixed right-2 md:right-4 top-[48%] -translate-y-1/2 z-[60] flex items-center"
            >
                <button
                    onClick={() => setIsExpanded(true)}
                    className="p-1.5 md:p-2 bg-black/40 backdrop-blur-xl border border-white/30 rounded-lg text-white/70 hover:text-white hover:bg-black/60 transition-all flex flex-col items-center gap-2 group shadow-2xl"
                    title="About The Crew"
                >
                    <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] uppercase font-bold tracking-widest hidden md:block" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        CLICK ME!
                    </span>
                </button>
            </motion.div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isExpanded && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setIsExpanded(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="theme-bg-card relative z-10 w-[92vw] max-w-4xl max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-3xl shadow-2xl p-3 sm:p-5 md:p-6 border-4 custom-scrollbar"
                            style={{ borderColor: currentTheme.colors.primary }}
                        >
                            {/* Decorative background blobs */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: currentTheme.colors.primary }} />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: currentTheme.colors.secondary }} />

                            <div className="sticky top-0 right-0 flex justify-end z-20">
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="relativez-10 text-center">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black theme-text-primary uppercase tracking-widest drop-shadow-md">
                                    The Crew
                                </h1>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 lg:gap-4 w-full">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="flex flex-col items-center justify-between p-3 sm:p-5 md:p-6 rounded-2xl border-2 shadow-xl theme-bg-card h-full space-y-2 sm:space-y-4" style={{ borderColor: currentTheme.colors.primary + '30' }}>
                                            {/* Avatar / Placeholder */}
                                            <div
                                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-6 transition-transform overflow-hidden border-4 flex-shrink-0"
                                                style={{
                                                    borderColor: currentTheme.colors.primary,
                                                    background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                                                }}
                                            >
                                                <AvatarRenderer robloxLink={member.robloxLink} fallbackImage={member.image} />
                                            </div>

                                            {/* Name & Role */}
                                            <div className="flex flex-col items-center flex-grow space-y-1 sm:space-y-2">
                                                <h2 className="text-lg sm:text-2xl md:text-3xl font-black theme-text-primary">{member.name}</h2>
                                                <p className="font-bold theme-text-secondary uppercase tracking-widest text-[9px] sm:text-xs md:text-sm" style={{ color: currentTheme.colors.primary }}>
                                                    {member.role}
                                                </p>

                                                {/* Bio / Aviation Message */}
                                                <div className="theme-bg-card border-2 p-2.5 mt-2 sm:p-4 sm:mt-3 rounded-xl text-left shadow-inner w-full flex-grow flex items-center justify-center" style={{ borderColor: currentTheme.colors.secondary + '50' }}>
                                                    <p className="theme-text-primary font-medium text-[10px] sm:text-xs md:text-sm leading-relaxed text-center">
                                                        {member.bio}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Optional Links */}
                                            {(member.robloxLink || member.discordLink) && (
                                                <div className={`w-full pt-2 sm:pt-3 grid gap-1.5 sm:gap-3 ${member.robloxLink && member.discordLink ? 'grid-cols-2' : 'grid-cols-1 max-w-[250px] mx-auto'}`}>
                                                    {member.robloxLink && (
                                                        <Link href={member.robloxLink} target="_blank" className="w-full">
                                                            <button className="w-full py-1.5 px-2 sm:py-2.5 sm:px-4 rounded-lg font-black shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm" style={{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`, border: `2px solid ${currentTheme.colors.primary}50`, color: currentTheme.colors.primary }}>
                                                                <RobloxIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                                                Roblox
                                                            </button>
                                                        </Link>
                                                    )}
                                                    {member.discordLink && (
                                                        <Link href={member.discordLink} target="_blank" className="w-full">
                                                            <button className="w-full py-1.5 px-2 sm:py-2.5 sm:px-4 rounded-lg font-black shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm" style={{ background: `linear-gradient(135deg, ${currentTheme.colors.secondary}20, ${currentTheme.colors.primary}20)`, border: `2px solid ${currentTheme.colors.secondary}50`, color: currentTheme.colors.secondary }}>
                                                                <DiscordIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                                                Discord
                                                            </button>
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
