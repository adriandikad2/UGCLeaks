'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from './components/ThemeContext'; // <--- Import hook

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { isGrayscale, toggleTheme, buttonText } = useTheme(); // <--- Theme context

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-700 ${isGrayscale ? 'grayscale bg-gray-900' : ''}`}>
      
      {/* --- GLOBAL THEME BUTTON --- */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 px-6 py-2 rounded-full border-2 border-white/50 text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300 group"
      >
        <span className="animate-pulse group-hover:animate-none">
          {buttonText}
        </span>
      </button>

      {/* ... (The rest of your JSX remains exactly the same as before) ... */}
      {/* Decorative floating blocks */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-roblox-pink opacity-20 rounded-lg floating-block-slow glow-pink"></div>
      <div className="absolute top-1/4 right-20 w-24 h-24 bg-roblox-cyan opacity-20 rounded-lg floating-block glow-cyan" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-roblox-yellow opacity-20 rounded-lg floating-block-fast glow-yellow" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-10 right-1/4 w-20 h-20 bg-roblox-purple opacity-20 rounded-lg floating-block glow-purple" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/3 right-10 w-32 h-12 bg-roblox-lime opacity-15 rounded-lg floating-block-slow" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-3xl w-full text-center space-y-8 z-10 pop-in">
        <div className="space-y-4">
          <h1 className="text-7xl md:text-8xl font-black rainbow-text drop-shadow-2xl">
            UGC LEAKS
          </h1>
          <div className="h-2 w-64 mx-auto bg-gradient-to-r from-roblox-pink via-roblox-cyan to-roblox-yellow rounded-full glow-pink blocky-shadow"></div>
        </div>

        <div className="space-y-3">
          <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
            🎮 Track Daily Roblox Limiteds 🎮
          </p>
          <p className="text-lg md:text-xl text-white opacity-90 drop-shadow-md">
            Get exclusive information on upcoming UGC drops, stock levels, and release methods
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 my-8 px-2">
          <div className="bg-white rounded-lg p-4 md:p-6 blocky-shadow-hover border-4 border-roblox-pink">
            <div className="text-3xl md:text-4xl font-black text-roblox-pink">5+</div>
            <div className="text-xs md:text-sm font-bold text-gray-700 mt-1">Items Daily</div>
          </div>
          <div className="bg-white rounded-lg p-4 md:p-6 blocky-shadow-hover border-4 border-roblox-cyan">
            <div className="text-3xl md:text-4xl font-black text-roblox-cyan">Real-time</div>
            <div className="text-xs md:text-sm font-bold text-gray-700 mt-1">Updates</div>
          </div>
          <div className="bg-white rounded-lg p-4 md:p-6 blocky-shadow-hover border-4 border-roblox-yellow">
            <div className="text-3xl md:text-4xl font-black text-roblox-yellow">100%</div>
            <div className="text-xs md:text-sm font-bold text-gray-700 mt-1">Accurate</div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/leaks" passHref>
            <button className="gradient-button px-12 py-6 text-xl rounded-2xl font-bold transition-all duration-300 blocky-shadow-hover text-white uppercase tracking-wider hover:shadow-blocky-lg">
              ✨ VIEW LEAKS ✨
            </button>
          </Link>
          <button className="px-12 py-6 text-xl rounded-2xl font-bold transition-all duration-300 blocky-shadow-hover text-white bg-gradient-to-r from-roblox-purple to-roblox-indigo uppercase tracking-wider hover:shadow-blocky-lg">
            📖 Learn More
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 px-2">
          <div className="bg-white rounded-xl p-6 blocky-shadow border-l-8 border-roblox-pink">
            <div className="text-4xl mb-2">⚡</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-600">Real-time notifications for new UGC drops</p>
          </div>
          <div className="bg-white rounded-xl p-6 blocky-shadow border-l-8 border-roblox-cyan">
            <div className="text-4xl mb-2">🎨</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Colorful UI</h3>
            <p className="text-sm text-gray-600">Beautiful, intuitive interface</p>
          </div>
          <div className="bg-white rounded-xl p-6 blocky-shadow border-l-8 border-roblox-yellow">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Stock Tracking</h3>
            <p className="text-sm text-gray-600">Monitor item availability and limits</p>
          </div>
          <div className="bg-white rounded-xl p-6 blocky-shadow border-l-8 border-roblox-purple">
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Easy Access</h3>
            <p className="text-sm text-gray-600">Direct links to games and items</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-roblox-orange opacity-10 rounded-full"></div>
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-roblox-pink opacity-10 rounded-full"></div>
    </div>
  );
}