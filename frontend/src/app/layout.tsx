import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { FloatingBlocks } from './FloatingBlocks'
import { ThemeProvider } from './components/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UGC Leaks - Track Daily Roblox Limiteds',
  description: 'Get the latest information on Roblox UGC drops and leaks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* 👇 Added 'select-none' here. This effectively disables highlighting globally. */}
      <body className={`${inter.className} select-none`}>
        <ThemeProvider>
          <FloatingBlocks />
          <div className="relative z-10">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}