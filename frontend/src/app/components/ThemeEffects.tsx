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
        case 'none':
        default:
            return null;
    }
}
