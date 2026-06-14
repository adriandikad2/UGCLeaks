'use client';

import { useState } from 'react';

export default function ServiceAlert() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full relative z-50">
      <div className="bg-yellow-400/90 backdrop-blur-md text-black py-4 px-6 shadow-xl border-b-4 border-yellow-600 flex items-center justify-between gap-4 animate-slide-down">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <h3 className="font-black text-lg sm:text-xl uppercase tracking-wider">Notice</h3>
            <p className="font-medium text-black/80 text-sm sm:text-base">
              Some schedules are missing and will be restored until further notice.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 bg-yellow-600/30 hover:bg-yellow-600/50 text-black rounded-full p-2 transition-all"
          aria-label="Close alert"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
