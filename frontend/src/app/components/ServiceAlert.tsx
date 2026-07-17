'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ServiceAlert() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Only render on landing page ("/") and "/leaks" page as requested
  if (!pathname || (pathname !== '/' && pathname !== '/leaks')) return null;
  if (isDismissed) return null;

  const discordUrl = 'https://discord.gg/2hX4sZfEhk';

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 pt-14 sm:pt-16 pb-2 relative z-20">
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 text-white transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #2398FC, #E509FC)',
        }}
      >
        {/* Top Header Bar / Compact View */}
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/20 backdrop-blur-md">
          {/* Left Title & Status */}
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <span className="text-2xl sm:text-3xl animate-pulse">🔥</span>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider bg-black/40 px-2.5 py-0.5 rounded-md border border-white/20 shadow">
                  UGC Grinders Discord!
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-white/90 bg-white/10 px-2 py-0.5 rounded">
                  Best Leaks in the Town
                </span>
              </div>
              <p className="font-black text-sm sm:text-base text-white drop-shadow-md mt-0.5">
                Increase your chances in getting free ugc limiteds earlier than anyone can ever get!
              </p>
            </div>
          </div>

          {/* Right Controls: Discord Invite Pill + Expand + Dismiss */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center flex-wrap sm:flex-nowrap">
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white font-mono font-black text-xs sm:text-sm px-4 py-2 rounded-xl border border-white/30 transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <span>🔗</span>
              <span>https://discord.gg/2hX4sZfEhk</span>
            </a>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs uppercase tracking-wider transition-all border border-white/20 shadow whitespace-nowrap"
            >
              {isExpanded ? '▲ Less Info' : '▼ Better Leaks Info'}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-xl bg-black/30 hover:bg-red-500/40 text-white hover:text-red-200 transition-all flex items-center justify-center font-bold text-xs"
              title="Dismiss promotional banner"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Embedded Stationary Feature Showcase (Collapsible) */}
        {isExpanded && (
          <div className="p-4 sm:p-6 bg-gray-950/90 backdrop-blur-xl border-t border-white/20 space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-1 hover:border-[#2398FC]/60 transition-colors">
                <div className="text-xl">⚡</div>
                <h4 className="font-black text-xs sm:text-sm text-[#2398FC] uppercase tracking-wide">90% FASTEST Pings</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Get instant notifications for most sudden UGC drops!
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-1 hover:border-[#E509FC]/60 transition-colors">
                <div className="text-xl">🎟️</div>
                <h4 className="font-black text-xs sm:text-sm text-[#E509FC] uppercase tracking-wide">FASTEST Leaks</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Access early leak discussions before massive widespread leaks!
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-1 hover:border-[#2398FC]/60 transition-colors">
                <div className="text-xl">🗣️</div>
                <h4 className="font-black text-xs sm:text-sm text-[#2398FC] uppercase tracking-wide">Active Chat</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Jump in the bandwagon and talk about anything UGC-related! Pray it doesn't get gatekept.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-1 hover:border-[#E509FC]/60 transition-colors">
                <div className="text-xl">🎉</div>
                <h4 className="font-black text-xs sm:text-sm text-[#E509FC] uppercase tracking-wide">Giveaways</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Occasional giveaways from the people, to the people. We're generous, just not <span className="font-bold text-white">that</span> generous.
                </p>
              </div>
            </div>

            {/* Embedded Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest text-center sm:text-left">
                Ready to never miss another drop?
              </span>
              <a
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-black uppercase text-xs sm:text-sm tracking-wider text-white shadow-xl hover:brightness-110 transition-all text-center"
                style={{
                  background: 'linear-gradient(135deg, #2398FC, #E509FC)',
                }}
              >
                🚀 Join Official Discord Server -&gt;
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
