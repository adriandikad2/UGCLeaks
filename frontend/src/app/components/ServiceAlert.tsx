'use client';

import { useState } from 'react';

export default function ServiceAlert() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full relative z-50">
      <div className="bg-red-600/90 backdrop-blur-md text-white py-4 px-6 shadow-xl border-b-4 border-red-800 flex items-center justify-between gap-4 animate-slide-down">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <h3 className="font-black text-lg sm:text-xl uppercase tracking-wider">High Traffic Overload</h3>
            <p className="font-medium text-red-50 text-sm sm:text-base">
              Wow, we got too popular! We&apos;ve temporarily reached our server capacity limits for the month due to incredible traffic. 
              The site may fail to load items or display errors. We&apos;re working on upgrading our systems to handle everyone. 
              Thank you for your patience!
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 bg-red-800/50 hover:bg-red-800 text-white rounded-full p-2 transition-all"
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
