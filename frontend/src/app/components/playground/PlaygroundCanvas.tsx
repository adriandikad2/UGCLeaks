'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlayground, ToolType } from './PlaygroundContext';
import { motion, AnimatePresence } from 'framer-motion';
import GravityParticles from './tools/GravityParticles';
import { Settings2, X } from 'lucide-react';

// Simple assets mapping (Replace with your actual URLs)
const ASSETS = {
    gun: '/assets/playground/gun-barrel.png',
    crosshair: '/assets/playground/crosshair.png',
    hammer: '/assets/playground/hammer.png',
    crack: ['/assets/playground/crack-1.png', '/assets/playground/crack-2.png'],
    splat: '/assets/playground/splat-1.png',
    sticker: ['/assets/playground/sticker-1.png', '/assets/playground/sticker-2.png'] // Add emojis if images fail
};

type Projectile = {
    id: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
};

type Spark = {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
};

const SOUND_POOLS = {
    shoot: ['shoot.mp3'],
    splat: ['splat1.mp3', 'splat2.mp3'],
    smash: ['smash1.mp3', 'smash2.mp3'],
    pop: ['pop.mp3'],
    laser: ['laser.mp3']
};

export default function PlaygroundCanvas() {
    const { activeTool, addElement, elements } = usePlayground();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);
    const [isHolding, setIsHolding] = useState(false);   // Logic state for hold-to-fire
    const shakeRef = useRef<HTMLDivElement>(null);
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);
    const [previewSticker, setPreviewSticker] = useState<string | null>(null);
    const [sparks, setSparks] = useState<Spark[]>([]);
    const laserSoundRef = useRef<HTMLAudioElement | null>(null);
    const [showMixer, setShowMixer] = useState(false); // Toggle for the UI panel

    // Refs (Crucial for Interval Access)
    const mousePosRef = useRef({ x: 0, y: 0 }); // Tracks mouse without re-renders
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // 1. New State for all dynamic assets
    const [assets, setAssets] = useState({
        stickers: [] as string[],
        splats: [] as string[],
        cracks: [] as string[]
    });

    // Default values (0.0 to 1.0)
    const [volumes, setVolumes] = useState({
        paintball: 0.5, // Controls shoot + splat
        hammer: 0.1,    // Smash
        sticker: 1,   // Pop
        laser: 0.5     // Buzz
    });

    const volumesRef = useRef(volumes);

    const playSfx = (key: keyof typeof SOUND_POOLS, baseVolume = 0.4) => {
        if (typeof window === 'undefined') return;

        try {
            // 1. Pick a random file from the pool
            const pool = SOUND_POOLS[key];
            const fileName = pool[Math.floor(Math.random() * pool.length)];

            const audio = new Audio(`/assets/sounds/${fileName}`);

            const currentVols = volumesRef.current;

            let baseVol = 0.5; // Default fallback
            if (key === 'shoot' || key === 'splat') baseVol = currentVols.paintball;
            if (key === 'smash') baseVol = currentVols.hammer;
            if (key === 'pop') baseVol = currentVols.sticker;
            if (key === 'laser') baseVol = currentVols.laser;

            // 2. Randomize Volume (±10% of base)
            // This prevents "machine gun" effects from sounding robotic
            const volumeVar = 0.9 + Math.random() * 0.2;
            audio.volume = Math.min(1, Math.max(0, baseVol * volumeVar));

            // 3. Randomize Pitch (Playback Rate)
            // 0.8 (Lower/Slower) to 1.2 (Higher/Faster)
            // This makes every shot sound unique
            audio.playbackRate = 0.8 + Math.random() * 0.4;

            // (Optional) Force pitch shift for browsers that try to "time stretch"
            // @ts-ignore
            if (audio.preservesPitch !== undefined) audio.preservesPitch = false;

            audio.play().catch(e => console.error('Audio blocked', e));
        } catch (e) {
            console.error('Audio error', e);
        }
    };

    // 2. Fetch all lists on mount
    useEffect(() => {
        fetch('/api/playground-assets')
            .then(res => res.json())
            .then(data => {
                setAssets({
                    stickers: data.stickers || [],
                    splats: data.splats || [],
                    cracks: data.cracks || []
                });
            })
            .catch(err => console.error('Failed to load playground assets:', err));
    }, []);

    // --- MOUSE TRACKING ---
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const pos = { x: e.clientX, y: e.clientY };
            setMousePos(pos);
            mousePosRef.current = pos; // Update ref for the interval to see
        };

        // Also handle touch moves for mobile
        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (touch) {
                const pos = { x: touch.clientX, y: touch.clientY };
                setMousePos(pos);
                mousePosRef.current = pos;
            }
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleTouchMove);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    // --- STICKER ROTATION EFFECT ---
    useEffect(() => {
        // Only run if sticker tool is active and we don't have a preview yet
        if (activeTool === 'sticker' && !previewSticker) {
            const source = assets.stickers.length > 0
                ? assets.stickers
                : ['😎', '🔥', '🚀'];

            const random = source[Math.floor(Math.random() * source.length)];
            setPreviewSticker(random);
        }
    }, [activeTool, assets.stickers]);

    useEffect(() => {
        if (sparks.length === 0) return;

        let animationFrameId: number;

        const updateSparks = () => {
            setSparks(prev =>
                prev
                    .map(spark => ({
                        ...spark,
                        x: spark.x + spark.vx,
                        y: spark.y + spark.vy,
                        vy: spark.vy + 0.5, // Gravity
                        life: (spark as any).life ? (spark as any).life - 1 : 20 // Decrease life
                    }))
                    .filter(spark => (spark as any).life > 0) // Remove dead sparks
            );
            animationFrameId = requestAnimationFrame(updateSparks);
        };

        animationFrameId = requestAnimationFrame(updateSparks);
        return () => cancelAnimationFrame(animationFrameId);
    }, [sparks.length]);

    useEffect(() => {
        // specific setup for the laser loop
        if (typeof window !== 'undefined') {
            const audio = new Audio('/assets/sounds/laser.mp3');
            audio.loop = true;   // 🔄 Crucial: Make it loop
            audio.volume = 0.15; // Keep it quiet
            laserSoundRef.current = audio;
        }

        // Cleanup: Stop sound if user leaves the page while firing
        return () => {
            if (laserSoundRef.current) {
                laserSoundRef.current.pause();
                laserSoundRef.current.currentTime = 0;
            }
        };
    }, []);

    useEffect(() => {
        volumesRef.current = volumes;

        // Real-time update for the continuous laser loop
        if (laserSoundRef.current) {
            laserSoundRef.current.volume = volumes.laser;
        }
    }, [volumes]);

    // --- TOOL ACTIONS ---
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (activeTool === 'none') return;

        const { clientX, clientY } = e;

        // 1. PAINTBALL LOGIC
        if (activeTool === 'paintball') {
            setIsClicking(true);
            setTimeout(() => setIsClicking(false), 150); // Recoil time

            // Calculate the barrel tip position (approximate)
            // We know the gun is at bottom center. We calculate the vector towards the mouse.
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight; // Bottom of screen

            // Math to find the "tip" of the barrel (approx 100px away from bottom center towards mouse)
            const angle = Math.atan2(clientY - startY, clientX - startX);
            const barrelLen = 120; // Adjust based on your gun size
            const barrelTipX = startX + Math.cos(angle) * barrelLen;
            const barrelTipY = startY + Math.sin(angle) * barrelLen;

            // Add projectile to state
            const newProjectile = {
                id: Date.now(),
                startX: barrelTipX,
                startY: barrelTipY,
                targetX: clientX,
                targetY: clientY
            };

            const splatImg = assets.splats.length > 0
                ? assets.splats[Math.floor(Math.random() * assets.splats.length)]
                : null; // fallback handled in render

            addElement({
                type: 'splat',
                x: clientX,
                y: clientY,
                scale: Math.random() * 0.5 + 0.8,
                rotation: Math.random() * 360,
                content: splatImg || undefined
            });

            setProjectiles(prev => [...prev, newProjectile]);
        }

        // 2. HAMMER LOGIC
        if (activeTool === 'hammer') {
            setIsClicking(true);
            setTimeout(() => setIsClicking(false), 200); // Swing time

            // Screen shake
            if (shakeRef.current) {
                // Reset animation
                shakeRef.current.classList.remove('shake-screen');

                // Force reflow
                void shakeRef.current.offsetWidth;

                // Trigger animation
                shakeRef.current.classList.add('shake-screen');

                // Cleanup
                setTimeout(() => {
                    if (shakeRef.current) {
                        shakeRef.current.classList.remove('shake-screen');
                    }
                }, 150);
            }

            const crackImg = assets.cracks.length > 0
                ? assets.cracks[Math.floor(Math.random() * assets.cracks.length)]
                : '/assets/playground/crack-1.png'; // safe hardcoded fallback

            addElement({
                type: 'crack',
                x: clientX - 64, // Offset to center 128px image
                y: clientY - 64,
                scale: Math.random() * 0.4 + 0.8,
                rotation: Math.random() * 360,
                content: crackImg
            });
        }

        // 3. STICKER LOGIC
        if (activeTool === 'sticker') {
            // Use the fetched list, or fallback to a default if empty
            const contentToPlace = previewSticker || (assets.stickers.length > 0 ? assets.stickers[0] : '😎');

            addElement({
                type: 'sticker',
                x: clientX - 32,
                y: clientY - 32,
                scale: Math.random() * 0.5 + 0.8,
                rotation: Math.random() * 40 - 20,
                content: contentToPlace // Pass the dynamically chosen file path
            });

            const sourceList = assets.stickers.length > 0 ? assets.stickers : ['😎', '🔥'];
            const nextRandom = sourceList[Math.floor(Math.random() * sourceList.length)];

            setPreviewSticker(nextRandom);
        }

        // 4. LASER LOGIC
        if (activeTool === 'laser') {
            setIsClicking(true);
            setTimeout(() => setIsClicking(false), 100);

            // Add Scorch Mark (Persistent)
            addElement({
                type: 'splat', // Re-using splat logic but with fire colors
                x: clientX,
                y: clientY,
                scale: Math.random() * 0.3 + 0.5,
                rotation: Math.random() * 360,
                color: '#220000', // Burnt black/dark red
                // No 'content' means it will fallback to the CSS div we made earlier
            });

            // Spawn Sparks (Temporary)
            const newSparks = Array.from({ length: 8 }).map((_, i) => ({
                id: Date.now() + i,
                x: clientX,
                y: clientY,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5, // Upward bias
                color: Math.random() > 0.5 ? '#FF4500' : '#FFD700', // Orange/Gold
                life: 20 + Math.random() * 10
            }));
            setSparks(prev => [...prev, ...newSparks]);
        }
    };

    // ==========================================================
    //  CORE LOGIC: THE REUSABLE "FIRE" FUNCTION
    // ==========================================================
    const triggerTool = (x: number, y: number) => {
        if (activeTool === 'none') return;

        // Visual Feedback (Recoil)
        setIsClicking(true);
        setTimeout(() => setIsClicking(false), 100);

        // --- PAINTBALL ---
        if (activeTool === 'paintball') {
            playSfx('shoot'); // 🔊 SHOOT SOUND
            const colors = ['#00FF00', '#FF00FF', '#FFFF00', '#00FFFF', '#FF0000'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const startX = window.innerWidth / 2;
            const startY = window.innerHeight;
            const angle = Math.atan2(y - startY, x - startX);
            const barrelLen = 120;

            const newProjectile = {
                id: Date.now() + Math.random(), // Random needed for fast firing
                startX: startX + Math.cos(angle) * barrelLen,
                startY: startY + Math.sin(angle) * barrelLen,
                targetX: x,
                targetY: y,
                color: randomColor
            };
            setProjectiles(prev => [...prev, newProjectile]);
        }

        // --- HAMMER ---
        if (activeTool === 'hammer') {
            playSfx('smash'); // 🔊 SMASH SOUND (Louder)
            // 1. SCREEN SHAKE (Class Toggle Method)
            if (shakeRef.current) {
                // Reset animation
                shakeRef.current.classList.remove('shake-screen');

                // Force browser repaint (Reflow)
                void shakeRef.current.offsetWidth;

                // Trigger animation
                shakeRef.current.classList.add('shake-screen');

                // Cleanup
                setTimeout(() => {
                    if (shakeRef.current) {
                        shakeRef.current.classList.remove('shake-screen');
                    }
                }, 150);
            }

            // 2. Spawn Crack (Existing Logic)
            const crackImg = assets.cracks.length > 0
                ? assets.cracks[Math.floor(Math.random() * assets.cracks.length)]
                : '/assets/playground/crack-1.png';

            addElement({
                type: 'crack',
                x: x - 64,
                y: y - 64,
                scale: Math.random() * 0.4 + 0.8,
                rotation: Math.random() * 360,
                content: crackImg
            });
        }

        // --- STICKER ---
        if (activeTool === 'sticker') {
            playSfx('pop');
            const sourceList = assets.stickers.length > 0 ? assets.stickers : ['😎'];

            // 1. Always pick a FRESH random sticker for the element
            const randomStickerForPlacement = sourceList[Math.floor(Math.random() * sourceList.length)];

            addElement({
                type: 'sticker',
                x: x - 32,
                y: y - 32,
                scale: Math.random() * 0.5 + 0.8,
                rotation: Math.random() * 40 - 20,
                content: randomStickerForPlacement // Use the fresh pick, NOT the preview
            });

            // 2. Update the ghost so it changes visually too
            setPreviewSticker(randomStickerForPlacement);
        }

        // --- LASER ---
        if (activeTool === 'laser') {
            // Scorch Mark
            addElement({
                type: 'splat',
                x: x,
                y: y,
                scale: Math.random() * 0.3 + 0.5,
                rotation: Math.random() * 360,
                color: '#220000',
            });

            // Sparks
            const newSparks = Array.from({ length: 4 }).map((_, i) => ({
                id: Date.now() + i + Math.random(),
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                color: Math.random() > 0.5 ? '#FF4500' : '#FFD700',
                life: 15 + Math.random() * 10
            }));
            setSparks(prev => [...prev, ...newSparks]);
        }
    };

    // ==========================================================
    //  INPUT HANDLING (HOLD TO FIRE)
    // ==========================================================

    const startFiring = () => {
        setIsHolding(true);

        if (activeTool === 'laser' && laserSoundRef.current) {
            // Reset time to 0 so it starts fresh every click
            laserSoundRef.current.currentTime = 0;
            laserSoundRef.current.play().catch(e => console.error("Audio blocked", e));
        }

        // Fire once immediately
        triggerTool(mousePosRef.current.x, mousePosRef.current.y);

        // Clear any existing interval just in case
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Start rapid fire (100ms = 10 shots per second)
        // You can adjust this speed per tool if you want
        const speed = activeTool === 'hammer' ? 200 : 100;

        intervalRef.current = setInterval(() => {
            triggerTool(mousePosRef.current.x, mousePosRef.current.y);
        }, speed);
    };

    const stopFiring = () => {
        setIsHolding(false);

        if (activeTool === 'laser' && laserSoundRef.current) {
            laserSoundRef.current.pause();
            laserSoundRef.current.currentTime = 0; // Rewind for next time
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const handleProjectileHit = (p: Projectile) => {
        playSfx('splat');
        // 1. Remove projectile from screen
        setProjectiles(prev => prev.filter(proj => proj.id !== p.id));

        // 2. Pick a random splat image
        const splatImg = assets.splats.length > 0
            ? assets.splats[Math.floor(Math.random() * assets.splats.length)]
            : null;

        // 3. Add the Splat Mark (The code you previously had in onClick)
        addElement({
            type: 'splat',
            x: p.targetX,
            y: p.targetY,
            scale: Math.random() * 0.5 + 0.8,
            rotation: Math.random() * 360,
            content: splatImg || undefined
        });
    };

    // --- GUN ROTATION MATH ---
    // Assuming gun is at bottom center (50% w, 100% h)
    const gunAngle = typeof window !== 'undefined'
        ? Math.atan2(mousePos.y - window.innerHeight, mousePos.x - window.innerWidth / 2) * (180 / Math.PI) + 90
        : 0;

    // --- CURSOR STYLES ---
    const getCursorStyle = () => {
        switch (activeTool) {
            case 'paintball': return 'none'; // Custom crosshair rendered below
            case 'hammer': return 'none'; // Custom hammer rendered below
            case 'gravity': return 'none'; // Custom circle
            case 'sticker': return 'none'; // Ghost sticker
            default: return 'default';
        }
    };

    if (activeTool === 'none') return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden pointer-events-auto touch-none"
            style={{ cursor: getCursorStyle() }}
            // The Wrapper handles the tool firing
            onPointerDown={startFiring}
            onPointerUp={stopFiring}
            onPointerLeave={stopFiring}
        >

            {/* 2. SHAKE LAYER (The "World" - Only this part moves) */}
            {/* We apply the REF here. 'fixed' inside 'fixed' is fine as long as this parent doesn't transform. */}
            {/* But since we apply transform TO this div, we change it to 'absolute inset-0' so it fits the parent exactly. */}
            <div
                ref={shakeRef}
                className="absolute inset-0 pointer-events-none z-0 transform-gpu backface-hidden"
            >
                {/* 1. RENDERED ELEMENTS LAYER */}
                <AnimatePresence>
                    {elements.map((el) => (
                        <motion.div
                            key={el.id}
                            initial={el.type === 'splat' ? { scale: 0, opacity: 0.8 } : { scale: 0, opacity: 0 }}
                            animate={{ scale: el.scale, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute pointer-events-none"
                            style={{
                                left: el.x,
                                top: el.y,
                                rotate: el.rotation,
                                filter: el.type === 'splat' && !el.content ? `drop-shadow(0 0 5px ${el.color})` : 'none'
                            }}
                        >
                            {el.type === 'splat' && (
                                el.content ? (
                                    // We apply a CSS filter to try and tint it to the random color
                                    <img
                                        src={el.content}
                                        alt="splat"
                                        className="w-32 h-32 object-contain -translate-x-1/2 -translate-y-1/2"
                                        style={{
                                            filter: `drop-shadow(0px 0px 4px ${el.color})` // Glow effect with the random color
                                        }}
                                    />
                                ) : (
                                    // Fallback to div if no image found
                                    <div className="w-16 h-16 rounded-full blur-sm" style={{ backgroundColor: el.color }} />
                                )
                            )}
                            {el.type === 'crack' && (
                                <img src={el.content} alt="crack" className="w-32 h-32 object-contain opacity-80" />
                            )}
                            {el.type === 'sticker' && (
                                <img src={el.content} alt="sticker" className="w-16 h-16 object-contain drop-shadow-lg" />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {projectiles.map((p) => (
                    <motion.img
                        key={p.id}
                        src="/assets/playground/paintball.png" // Make sure this image exists!
                        alt="ball"
                        className="absolute w-6 h-6 object-contain z-40"
                        // Start at barrel tip
                        initial={{
                            left: p.startX,
                            top: p.startY,
                            scale: 0.5
                        }}
                        // Animate to cursor
                        animate={{
                            left: p.targetX,
                            top: p.targetY,
                            scale: 1
                        }}
                        // Speed calculation: 0.2s is fast, linear makes it look like a bullet
                        transition={{ duration: 0.15, ease: "linear" }}
                        // 👇 Trigger the splat when it reaches the end
                        onAnimationComplete={() => handleProjectileHit(p)}
                        style={{
                            // Optional: Tint the ball the same color as the splat
                            filter: `drop-shadow(0 0 2px)`,
                            borderRadius: '50%'
                        }}
                    />
                ))}

                {/* --- SPARKS LAYER --- */}
                {sparks.map(spark => (
                    <div
                        key={spark.id}
                        className="absolute w-2 h-2 rounded-full pointer-events-none z-50"
                        style={{
                            left: spark.x,
                            top: spark.y,
                            backgroundColor: spark.color,
                            boxShadow: `0 0 4px ${spark.color}`
                        }}
                    />
                ))}
                {/* --- VOLUME MIXER TOGGLE --- */}
                <button
                    className="fixed top-20 right-6 z-[60] p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white hover:text-black transition-all pointer-events-auto"
                    onClick={() => setShowMixer(!showMixer)}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Settings2 size={24} />
                </button>

            </div>
            <div className="absolute inset-0 pointer-events-none z-50">
                {/* 2. TOOL CURSORS & AVATARS */}

                {/* Paintball Gun */}
                {activeTool === 'paintball' && (
                    <>
                        {/* The Gun */}
                        <div className="absolute -bottom-16 left-1/2 w-48 h-64 md:w-64 md:h-80 pointer-events-none origin-bottom z-50 transition-transform duration-75"
                            style={{ transform: `translateX(-50%) rotate(${gunAngle}deg) ${isClicking ? 'translateY(10px)' : ''}` }}>
                            <img src={ASSETS.gun} alt="gun" className="w-full h-full object-contain" />
                        </div>
                        {/* The Crosshair */}
                        <div className="absolute pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: mousePos.x, top: mousePos.y }}>
                            <img src={ASSETS.crosshair} alt="target" className="w-6 h-6 md:w-8 md:h-8 opacity-80" />
                        </div>
                    </>
                )}

                {/* Hammer Cursor */}
                {activeTool === 'hammer' && (
                    <motion.div
                        className="absolute pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 origin-bottom-right"
                        style={{ left: mousePos.x, top: mousePos.y }}
                        animate={isClicking ? { rotate: -45 } : { rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                        <img src={ASSETS.hammer} alt="hammer" className="w-24 h-24 object-contain" />
                    </motion.div>
                )}

                {/* Gravity Well & Particles */}
                {activeTool === 'gravity' && (
                    <>
                        <div className="absolute w-24 h-24 rounded-full border-2 border-purple-500/50 bg-purple-900/20 blur-xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
                            style={{ left: mousePos.x, top: mousePos.y }} />
                        <GravityParticles mouseX={mousePos.x} mouseY={mousePos.y} />
                    </>
                )}

                {/* Sticker Ghost */}
                {activeTool === 'sticker' && previewSticker && (
                    <div className="absolute pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 opacity-50"
                        style={{ left: mousePos.x, top: mousePos.y }}>
                        {previewSticker.startsWith('/') ? (
                            <img
                                src={previewSticker}
                                alt="preview"
                                className="w-16 h-16 object-contain grayscale"
                            />
                        ) : (
                            <div className="text-4xl">{previewSticker}</div>
                        )}
                    </div>
                )}

                {/* --- LASER BEAM (SVG LAYER) --- */}
                {activeTool === 'laser' && (
                    <svg className="fixed inset-0 pointer-events-none z-40 overflow-visible">
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Main Beam */}
                        <line
                            x1={window.innerWidth / 2}
                            y1={window.innerHeight}
                            x2={mousePos.x}
                            y2={mousePos.y}
                            stroke="#FF0000"
                            strokeWidth={isHolding || isClicking ? 6 : 2} // Thicker when firing
                            strokeLinecap="round"
                            filter="url(#glow)"
                            className="transition-all duration-75"
                            style={{ opacity: isHolding || isClicking ? 1 : 0.6 }}
                        />

                        {/* Inner White Core (makes it look hot) */}
                        <line
                            x1={window.innerWidth / 2}
                            y1={window.innerHeight}
                            x2={mousePos.x}
                            y2={mousePos.y}
                            stroke="white"
                            strokeWidth={isHolding || isClicking ? 2 : 0.5}
                            strokeLinecap="round"
                            style={{ opacity: isHolding || isClicking ? 1 : 0.8 }}
                        />
                    </svg>
                )}

                {/* 3. VOLUME MIXER PANEL */}
                <AnimatePresence>
                    {showMixer && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            className="fixed top-20 right-20 z-[60] w-64 p-5 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl pointer-events-auto"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <h3 className="text-white font-bold">Sound Mixer</h3>
                                <button onClick={() => setShowMixer(false)} className="text-white/50 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Paintball Slider */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-roblox-cyan font-bold">
                                        <span>Paintball</span>
                                        <span>{Math.round(volumes.paintball * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.05"
                                        value={volumes.paintball}
                                        onChange={(e) => setVolumes(p => ({ ...p, paintball: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-roblox-cyan"
                                    />
                                </div>

                                {/* Hammer Slider */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-blue-400 font-bold">
                                        <span>Hammer</span>
                                        <span>{Math.round(volumes.hammer * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.05"
                                        value={volumes.hammer}
                                        onChange={(e) => setVolumes(p => ({ ...p, hammer: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                {/* Sticker Slider */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-yellow-400 font-bold">
                                        <span>Stickers</span>
                                        <span>{Math.round(volumes.sticker * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.05"
                                        value={volumes.sticker}
                                        onChange={(e) => setVolumes(p => ({ ...p, sticker: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                                    />
                                </div>

                                {/* Laser Slider */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-red-500 font-bold">
                                        <span>Laser Beam</span>
                                        <span>{Math.round(volumes.laser * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.05"
                                        value={volumes.laser}
                                        onChange={(e) => setVolumes(p => ({ ...p, laser: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}