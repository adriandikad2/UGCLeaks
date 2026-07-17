'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useTheme, EffectType } from './ThemeContext';

// Configuration for each effect type
const EFFECT_CONFIG = {
    blocks: { count: 5, speed: 2 },
    stars: { count: 50, speed: 1 },
    orbs: { count: 20, speed: 0.5 },
    clouds: { count: 8, speed: 0.3 },
    petals: { count: 30, speed: 1.5 },
    leaves: { count: 25, speed: 1.2 },
    bananas: { count: 15, speed: 1 },
    none: { count: 0, speed: 0 },
};

// Floating Blocks Effect (Colorful theme only)
function FloatingBlocks() {
    const { currentTheme } = useTheme();

    const blocks = useMemo(() => [
        { size: 80, color: currentTheme.colors.gradient1, delay: 0, duration: 6, x: 10, y: 10 },
        { size: 96, color: currentTheme.colors.gradient2, delay: 1, duration: 8, x: 80, y: 25 },
        { size: 64, color: currentTheme.colors.gradient3, delay: 0.5, duration: 5, x: 25, y: 75 },
        { size: 80, color: currentTheme.colors.gradient4, delay: 1.5, duration: 7, x: 75, y: 70 },
        { size: 128, color: currentTheme.colors.accent, delay: 2, duration: 9, x: 60, y: 30 },
    ], [currentTheme.colors]);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {blocks.map((block, i) => (
                <div
                    key={i}
                    className="absolute rounded-lg opacity-20"
                    style={{
                        width: block.size,
                        height: block.size,
                        backgroundColor: block.color,
                        left: `${block.x}%`,
                        top: `${block.y}%`,
                        animation: `float-block ${block.duration}s ease-in-out infinite`,
                        animationDelay: `${block.delay}s`,
                        boxShadow: `0 0 30px ${block.color}60`,
                    }}
                />
            ))}
        </div>
    );
}

// Twinkling Stars Effect (Midnight theme)
function TwinklingStars() {
    const stars = useMemo(() =>
        Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 5,
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {stars.map(star => (
                <div
                    key={star.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        width: star.size,
                        height: star.size,
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        animation: `twinkle ${star.duration}s ease-in-out infinite`,
                        animationDelay: `${star.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}

// Glowing Orbs Effect (Cosmic theme)
function GlowingOrbs() {
    const { currentTheme } = useTheme();

    const orbs = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 20 + 10,
            color: i % 2 === 0 ? currentTheme.colors.primary : currentTheme.colors.secondary,
            duration: Math.random() * 10 + 8,
            delay: Math.random() * 5,
        })), [currentTheme.colors]
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {orbs.map(orb => (
                <div
                    key={orb.id}
                    className="absolute rounded-full opacity-30"
                    style={{
                        width: orb.size,
                        height: orb.size,
                        backgroundColor: orb.color,
                        left: `${orb.x}%`,
                        top: `${orb.y}%`,
                        boxShadow: `0 0 ${orb.size}px ${orb.color}`,
                        animation: `float-orb ${orb.duration}s ease-in-out infinite`,
                        animationDelay: `${orb.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}

// Drifting Clouds Effect (Skies theme)
function DriftingClouds() {
    const clouds = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            y: 10 + Math.random() * 70,
            width: 80 + Math.random() * 120,
            height: 30 + Math.random() * 40,
            duration: 30 + Math.random() * 20,
            delay: Math.random() * 30,
            opacity: 0.1 + Math.random() * 0.15,
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {clouds.map(cloud => (
                <div
                    key={cloud.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        width: cloud.width,
                        height: cloud.height,
                        top: `${cloud.y}%`,
                        opacity: cloud.opacity,
                        filter: 'blur(10px)',
                        animation: `drift-cloud ${cloud.duration}s linear infinite`,
                        animationDelay: `${cloud.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}

// Falling Petals Effect (Sakura theme)
function FallingPetals() {
    const { currentTheme } = useTheme();

    const petals = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 6 + Math.random() * 8,
            duration: 8 + Math.random() * 6,
            delay: Math.random() * 10,
            swayDuration: 2 + Math.random() * 2,
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {petals.map(petal => (
                <div
                    key={petal.id}
                    className="absolute"
                    style={{
                        left: `${petal.x}%`,
                        width: petal.size,
                        height: petal.size,
                        backgroundColor: currentTheme.colors.primary,
                        borderRadius: '50% 0 50% 0',
                        opacity: 0.6,
                        animation: `fall-petal ${petal.duration}s linear infinite, sway ${petal.swayDuration}s ease-in-out infinite alternate`,
                        animationDelay: `${petal.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}

// Falling Leaves Effect (Nature theme)
function FallingLeaves() {
    const { currentTheme } = useTheme();

    const leaves = useMemo(() =>
        Array.from({ length: 25 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 8 + Math.random() * 10,
            duration: 10 + Math.random() * 8,
            delay: Math.random() * 12,
            rotateDuration: 3 + Math.random() * 2,
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {leaves.map(leaf => (
                <div
                    key={leaf.id}
                    className="absolute"
                    style={{
                        left: `${leaf.x}%`,
                        width: leaf.size,
                        height: leaf.size * 1.5,
                        backgroundColor: currentTheme.colors.primary,
                        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                        opacity: 0.5,
                        animation: `fall-leaf ${leaf.duration}s linear infinite, rotate-leaf ${leaf.rotateDuration}s ease-in-out infinite alternate`,
                        animationDelay: `${leaf.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}

// Falling Bananas Effect (Banana theme)
function FallingBananas() {
    const bananas = useMemo(() =>
        Array.from({ length: 15 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 30 + Math.random() * 20,
            duration: 12 + Math.random() * 15,
            delay: Math.random() * 15,
            rotateDuration: 3 + Math.random() * 5,
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {bananas.map(banana => (
                <div
                    key={banana.id}
                    className="absolute"
                    style={{
                        left: `${banana.x}%`,
                        fontSize: `${banana.size}px`,
                        opacity: 0.6,
                        animation: `fall-leaf ${banana.duration}s linear infinite, sway ${banana.rotateDuration}s ease-in-out infinite alternate`,
                        animationDelay: `${banana.delay}s`,
                    }}
                >
                    🍌
                </div>
            ))}
        </div>
    );
}

// Steamhappy Effect (:steamhappy: wide-eyed open-mouth emoticons & chaotic steam puffs)
function SteamEffect() {
    const steamItems = useMemo(() =>
        Array.from({ length: 28 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 26 + Math.random() * 32,
            duration: 8 + Math.random() * 12,
            delay: Math.random() * 10,
            swayDuration: 2 + Math.random() * 3,
            isEmoticon: i % 3 === 0,
            symbol: ['😃', '🤪', '😁', '🌝', '💨', '⚡', '☁️', '😃'][i % 8],
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {steamItems.map(item => (
                <div
                    key={item.id}
                    className="absolute flex items-center justify-center font-bold select-none"
                    style={{
                        left: `${item.x}%`,
                        bottom: '-12%',
                        fontSize: `${item.size}px`,
                        opacity: item.isEmoticon ? 0.75 : 0.45,
                        animation: `fall-petal ${item.duration}s linear infinite reverse, sway ${item.swayDuration}s ease-in-out infinite alternate`,
                        animationDelay: `${item.delay}s`,
                    }}
                >
                    {item.isEmoticon ? (
                        /* Custom chaotic bright yellow wide-eyed open-mouth :steamhappy: face */
                        <div
                            className="relative flex items-center justify-center rounded-full shadow-lg transition-transform duration-500"
                            style={{
                                width: `${item.size}px`,
                                height: `${item.size}px`,
                                background: 'radial-gradient(circle at 35% 35%, #fffb00 0%, #ffcc00 60%, #e6a800 100%)',
                                border: '2px solid #1b2838',
                                boxShadow: '0 0 15px rgba(255, 204, 0, 0.5)',
                            }}
                            title=":steamhappy:"
                        >
                            {/* Wide eyes */}
                            <div className="absolute top-[22%] left-[18%] w-[26%] h-[28%] bg-white rounded-full border border-[#1b2838] flex items-center justify-center overflow-hidden shadow-inner">
                                <div className="w-[55%] h-[55%] bg-[#1b2838] rounded-full" />
                            </div>
                            <div className="absolute top-[22%] right-[18%] w-[26%] h-[28%] bg-white rounded-full border border-[#1b2838] flex items-center justify-center overflow-hidden shadow-inner">
                                <div className="w-[55%] h-[55%] bg-[#1b2838] rounded-full" />
                            </div>
                            {/* Huge wide open mouth */}
                            <div
                                className="absolute bottom-[14%] w-[64%] h-[38%] bg-[#1b2838] rounded-b-full border border-[#1b2838] flex items-top justify-center overflow-hidden"
                                style={{ borderRadius: '10% 10% 85% 85% / 20% 20% 90% 90%' }}
                            >
                                {/* Tongue/inside mouth highlight */}
                                <div className="w-[60%] h-[50%] bg-[#ff4d4d] rounded-t-full mt-[auto] mb-[-10%]" />
                            </div>
                        </div>
                    ) : (
                        item.symbol
                    )}
                </div>
            ))}
        </div>
    );
}

// Space Effect (Planets, Moons & Rockets drifting around)
function PlanetsEffect() {
    const planets = useMemo(() =>
        Array.from({ length: 25 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 24 + Math.random() * 36,
            duration: 15 + Math.random() * 20,
            delay: Math.random() * 10,
            symbol: ['🪐', '🌕', '🚀', '⭐', '🛰️', '✨', '☄️'][i % 7],
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {planets.map(planet => (
                <div
                    key={planet.id}
                    className="absolute"
                    style={{
                        left: `${planet.x}%`,
                        top: `${planet.y}%`,
                        fontSize: `${planet.size}px`,
                        opacity: 0.5,
                        animation: `float-orb ${planet.duration}s ease-in-out infinite`,
                        animationDelay: `${planet.delay}s`,
                    }}
                >
                    {planet.symbol}
                </div>
            ))}
        </div>
    );
}

// Tech / Matrix Effect (Falling Cyber Code & Binary Rain)
function MatrixEffect() {
    const matrixChars = useMemo(() =>
        Array.from({ length: 35 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 16 + Math.random() * 16,
            duration: 6 + Math.random() * 8,
            delay: Math.random() * 8,
            symbol: ['0', '1', '0101', '⚡', '< />', '{ }', '💻', '1010'][i % 8],
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {matrixChars.map(item => (
                <div
                    key={item.id}
                    className="absolute font-mono font-black tracking-widest text-green-400"
                    style={{
                        left: `${item.x}%`,
                        fontSize: `${item.size}px`,
                        opacity: 0.6,
                        textShadow: '0 0 8px #00ff66',
                        animation: `fall-leaf ${item.duration}s linear infinite`,
                        animationDelay: `${item.delay}s`,
                    }}
                >
                    {item.symbol}
                </div>
            ))}
        </div>
    );
}

// Ocean Effect (Rising bubbles & sea creatures)
function BubblesEffect() {
    const bubbles = useMemo(() =>
        Array.from({ length: 28 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 20 + Math.random() * 26,
            duration: 8 + Math.random() * 10,
            delay: Math.random() * 10,
            swayDuration: 2 + Math.random() * 3,
            symbol: ['🫧', '🫧', '🐠', '🐙', '🐚', '🐡'][i % 6],
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {bubbles.map(bubble => (
                <div
                    key={bubble.id}
                    className="absolute"
                    style={{
                        left: `${bubble.x}%`,
                        bottom: '-10%',
                        fontSize: `${bubble.size}px`,
                        opacity: 0.6,
                        animation: `fall-petal ${bubble.duration}s linear infinite reverse, sway ${bubble.swayDuration}s ease-in-out infinite alternate`,
                        animationDelay: `${bubble.delay}s`,
                    }}
                >
                    {bubble.symbol}
                </div>
            ))}
        </div>
    );
}

// Sunset / Vaporwave Effect
function VaporwaveEffect() {
    const vaporItems = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 28 + Math.random() * 28,
            duration: 12 + Math.random() * 15,
            delay: Math.random() * 8,
            symbol: ['🌅', '🌴', '⚡', '💾', '☀️', '✨'][i % 6],
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {vaporItems.map(item => (
                <div
                    key={item.id}
                    className="absolute"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        fontSize: `${item.size}px`,
                        opacity: 0.55,
                        animation: `float-orb ${item.duration}s ease-in-out infinite`,
                        animationDelay: `${item.delay}s`,
                    }}
                >
                    {item.symbol}
                </div>
            ))}
        </div>
    );
}

// Candy Effect (Falling Sweets)
function SweetsEffect() {
    const sweets = useMemo(() =>
        Array.from({ length: 25 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 24 + Math.random() * 20,
            duration: 10 + Math.random() * 10,
            delay: Math.random() * 10,
            rotateDuration: 2 + Math.random() * 4,
            symbol: ['🍭', '🍬', '🍩', '🧁', '🪅', '🍓'][i % 6],
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {sweets.map(item => (
                <div
                    key={item.id}
                    className="absolute"
                    style={{
                        left: `${item.x}%`,
                        fontSize: `${item.size}px`,
                        opacity: 0.65,
                        animation: `fall-leaf ${item.duration}s linear infinite, sway ${item.rotateDuration}s ease-in-out infinite alternate`,
                        animationDelay: `${item.delay}s`,
                    }}
                >
                    {item.symbol}
                </div>
            ))}
        </div>
    );
}

// Inferno Effect (Rising Embers & Flames)
function EmbersEffect() {
    const embers = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 18 + Math.random() * 24,
            duration: 6 + Math.random() * 8,
            delay: Math.random() * 8,
            swayDuration: 1.5 + Math.random() * 2.5,
            symbol: ['🔥', '💥', '⚡', '🟠', '✨', '🟡'][i % 6],
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {embers.map(item => (
                <div
                    key={item.id}
                    className="absolute"
                    style={{
                        left: `${item.x}%`,
                        bottom: '-10%',
                        fontSize: `${item.size}px`,
                        opacity: 0.7,
                        animation: `fall-petal ${item.duration}s linear infinite reverse, sway ${item.swayDuration}s ease-in-out infinite alternate`,
                        animationDelay: `${item.delay}s`,
                    }}
                >
                    {item.symbol}
                </div>
            ))}
        </div>
    );
}

// Winter / Glacial Effect (Falling Snowflakes)
function SnowEffect() {
    const snowflakes = useMemo(() =>
        Array.from({ length: 35 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 16 + Math.random() * 20,
            duration: 8 + Math.random() * 12,
            delay: Math.random() * 12,
            swayDuration: 2 + Math.random() * 3,
            symbol: ['❄️', '🌨️', '🧊', '✨', '❄️'][i % 5],
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {snowflakes.map(item => (
                <div
                    key={item.id}
                    className="absolute"
                    style={{
                        left: `${item.x}%`,
                        fontSize: `${item.size}px`,
                        opacity: 0.7,
                        animation: `fall-leaf ${item.duration}s linear infinite, sway ${item.swayDuration}s ease-in-out infinite alternate`,
                        animationDelay: `${item.delay}s`,
                    }}
                >
                    {item.symbol}
                </div>
            ))}
        </div>
    );
}

// Main ThemeEffects component
export default function ThemeEffects() {
    const { currentTheme } = useTheme();

    // Render the appropriate effect based on theme
    switch (currentTheme.effectType) {
        case 'blocks':
            return <FloatingBlocks />;
        case 'stars':
            return <TwinklingStars />;
        case 'orbs':
            return <GlowingOrbs />;
        case 'clouds':
            return <DriftingClouds />;
        case 'petals':
            return <FallingPetals />;
        case 'leaves':
            return <FallingLeaves />;
        case 'bananas':
            return <FallingBananas />;
        case 'steam':
            return <SteamEffect />;
        case 'planets':
            return <PlanetsEffect />;
        case 'matrix':
            return <MatrixEffect />;
        case 'bubbles':
            return <BubblesEffect />;
        case 'vaporwave':
            return <VaporwaveEffect />;
        case 'sweets':
            return <SweetsEffect />;
        case 'embers':
            return <EmbersEffect />;
        case 'snow':
            return <SnowEffect />;
        case 'none':
        default:
            return null;
    }
}
