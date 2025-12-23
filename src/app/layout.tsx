import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { FloatingBlocks } from './FloatingBlocks'

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
      <body className={inter.className}>
        <FloatingBlocks />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}