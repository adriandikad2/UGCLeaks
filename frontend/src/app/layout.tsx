import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { FloatingBlocks } from './FloatingBlocks';
import { ThemeProvider } from './components/ThemeContext';
import { Analytics } from "@vercel/analytics/next";
import { PlaygroundProvider } from './components/playground/PlaygroundContext';
import ToolBelt from './components/playground/ToolBelt';
import PlaygroundCanvas from './components/playground/PlaygroundCanvas';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UGC Leaks - Track Daily Roblox Limiteds',
  description: 'Get the latest information on Roblox UGC drops and leaks',
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
            {/* ThemeProvider now handles the mounting/opacity logic internally */}
            <FloatingBlocks />
            <div className="relative z-10">
              {children}
            </div>
            <Analytics />
          </ThemeProvider>
        </PlaygroundProvider>
      </body>
    </html>
  );
}