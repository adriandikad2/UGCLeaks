'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from './components/ThemeContext';
import ThemeSwitcher from './components/ThemeSwitcher';
import { isAuthenticated, signout, hasAccess } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import UpdateLogs from './components/UpdateLogs';

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [authenticated, setAuthenticated] = useState(false);
  const [canAccessSchedule, setCanAccessSchedule] = useState(false);
  const { currentTheme } = useTheme();
  const isGrayscale = currentTheme.name === 'bw';
  const router = useRouter();

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setCanAccessSchedule(hasAccess('editor'));
  }, []);

  const handleMouseMove = (e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleSignout = async () => {
    await signout();
    setAuthenticated(false);
    router.push('/');
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-700 ${isGrayscale ? 'bg-gray-900' : ''}`}>

      {/* --- THEME PALETTE SWITCHER --- */}
      <ThemeSwitcher />

      {/* --- AUTH BUTTONS --- */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50 flex gap-2 md:gap-3">
        {authenticated ? (
          <button
            onClick={handleSignout}
            className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm rounded-full text-white font-bold hover:opacity-80 transition-all"
            style={{ background: 'var(--theme-gradient-1)' }}
          >
            <span className="hidden md:inline">🚪 </span>Sign Out
          </button>
        ) : (
          <>
            <Link href="/auth/signin">
              <button
                className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm rounded-full text-white font-bold hover:opacity-80 transition-all"
                style={{ background: 'var(--theme-gradient-2)' }}
              >
                <span className="hidden md:inline">🔑 </span>Sign In
              </button>
            </Link>
            <Link href="/auth/signup">
              <button
                className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm rounded-full text-white font-bold hover:opacity-80 transition-all"
                style={{ background: 'var(--theme-gradient-3)' }}
              >
                <span className="hidden md:inline">📋 </span>Sign Up
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Theme effects are now handled by ThemeEffects component in layout */}

      <div className="max-w-3xl w-full text-center space-y-8 z-10 pop-in">
        <div className="space-y-4">
          <h1 className="text-7xl md:text-8xl font-black rainbow-text drop-shadow-2xl">
            UGC LEAKS
          </h1>
          <div className="h-2 w-64 mx-auto theme-gradient-bar rounded-full glow-pink blocky-shadow"></div>
        </div>

        <div className="space-y-3">
          <p className="text-2xl md:text-3xl font-bold theme-on-bg-text drop-shadow-lg">
            🎮 Track Daily Roblox Limiteds 🎮
          </p>
          <p className="text-lg md:text-xl theme-on-bg-text-secondary drop-shadow-md">
            Get exclusive information on upcoming UGC drops, stock levels, and release methods
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 my-8 px-2">
          <div className="theme-bg-card rounded-lg p-4 md:p-6 blocky-shadow-hover border-4" style={{ borderColor: 'var(--theme-gradient-1)' }}>
            <div className="text-3xl md:text-4xl font-black" style={{ color: 'var(--theme-gradient-1)' }}>New</div>
            <div className="text-xs md:text-sm font-bold theme-text-secondary mt-1">Items Daily</div>
          </div>
          <div className="theme-bg-card rounded-lg p-4 md:p-6 blocky-shadow-hover border-4" style={{ borderColor: 'var(--theme-gradient-2)' }}>
            <div className="text-3xl md:text-4xl font-black" style={{ color: 'var(--theme-gradient-2)' }}>Real-time</div>
            <div className="text-xs md:text-sm font-bold theme-text-secondary mt-1">Updates</div>
          </div>
          <div className="theme-bg-card rounded-lg p-4 md:p-6 blocky-shadow-hover border-4" style={{ borderColor: 'var(--theme-gradient-3)' }}>
            <div className="text-3xl md:text-4xl font-black" style={{ color: 'var(--theme-gradient-3)' }}>100%</div>
            <div className="text-xs md:text-sm font-bold theme-text-secondary mt-1">Accurate (with a margin error of 0.2% during downtimes)</div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/leaks" passHref>
            <button className="gradient-button px-12 py-6 text-xl rounded-2xl font-bold transition-all duration-300 blocky-shadow-hover text-white uppercase tracking-wider hover:shadow-blocky-lg">
              ✨ VIEW LEAKS ✨
            </button>
          </Link>
          {canAccessSchedule && (
            <Link href="/schedule" passHref>
              <button className="px-12 py-6 text-xl rounded-2xl font-bold transition-all duration-300 blocky-shadow-hover text-white uppercase tracking-wider hover:shadow-blocky-lg" style={{ background: 'linear-gradient(to right, var(--theme-gradient-1), var(--theme-gradient-2))' }}>
                📅 SCHEDULE
              </button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 px-2">
          <div className="theme-bg-card rounded-xl p-6 blocky-shadow border-l-8" style={{ borderColor: 'var(--theme-gradient-1)' }}>
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="font-bold text-lg theme-text-primary mb-2">Accurate Data</h3>
            <p className="text-sm theme-text-secondary">Relayed informations from our trusted leakers</p>
          </div>
          <div className="theme-bg-card rounded-xl p-6 blocky-shadow border-l-8" style={{ borderColor: 'var(--theme-gradient-2)' }}>
            <div className="text-4xl mb-2">🎨</div>
            <h3 className="font-bold text-lg theme-text-primary mb-2">Various Themes</h3>
            <p className="text-sm theme-text-secondary">Different color themes with dynamic environments</p>
          </div>
          <div className="theme-bg-card rounded-xl p-6 blocky-shadow border-l-8" style={{ borderColor: 'var(--theme-gradient-3)' }}>
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-bold text-lg theme-text-primary mb-2">Stock Tracking</h3>
            <p className="text-sm theme-text-secondary">Monitor item availability and limits</p>
          </div>
          <div className="theme-bg-card rounded-xl p-6 blocky-shadow border-l-8" style={{ borderColor: 'var(--theme-gradient-4)' }}>
            <div className="text-4xl mb-2">🔗</div>
            <h3 className="font-bold text-lg theme-text-primary mb-2">Easy Access</h3>
            <p className="text-sm theme-text-secondary">Direct links to games and items</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-40 h-40 opacity-10 rounded-full" style={{ background: 'linear-gradient(to top-left, var(--theme-gradient-1))' }}></div>
      <div className="absolute top-0 left-0 w-32 h-32 opacity-10 rounded-full" style={{ background: 'linear-gradient(to bottom-right, var(--theme-gradient-2))' }}></div>
      <UpdateLogs />
    </div>
  );
}