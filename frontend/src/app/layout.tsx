import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeEffects from './components/ThemeEffects';
import { ThemeProvider } from './components/ThemeContext';
import { Analytics } from "@vercel/analytics/next";
import { PlaygroundProvider } from './components/playground/PlaygroundContext';
import ToolBelt from './components/playground/ToolBelt';
import PlaygroundCanvas from './components/playground/PlaygroundCanvas';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UGC Leaks - Track Daily Roblox Limiteds',
  description: 'Get the latest information on Roblox UGC drops and leaks',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 'select-none' prevents text highlighting as requested */}
      <body className={`${inter.className} select-none`}>
        <PlaygroundProvider>
          <ToolBelt />
          <PlaygroundCanvas />
          <ThemeProvider>
            {/* Theme-specific particle effects (stars, petals, leaves, etc.) */}
            <ThemeEffects />
            <div className="relative z-10">
              {children}
            </div>
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </ThemeProvider>
        </PlaygroundProvider>
      </body>
    </html>
  );
}