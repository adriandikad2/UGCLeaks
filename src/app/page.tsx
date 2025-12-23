'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          UGC Leaks
        </h1>
        <p className="text-lg text-gray-600">
          Track Daily Roblox Limiteds
        </p>
        <div className="pt-4">
          <Link href="/todays-leaks" passHref>
            <button
              className="px-8 py-6 text-lg rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 transform hover:scale-105"
            >
              View Today's Leaks
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}