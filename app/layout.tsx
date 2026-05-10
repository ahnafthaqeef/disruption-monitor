import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Supply Chain Disruption Monitor — APAC Risk in 20 Seconds',
  description: 'Know which APAC trade routes are about to cost you money. AI scans live news across 10 corridors and tells you which lanes are at risk, why, and what to do. No login.',
  openGraph: {
    title: 'Supply Chain Disruption Monitor',
    description: 'AI-powered APAC trade route risk monitoring. Built by Ahnaf Thaqeef.',
    url: 'https://monitor.aibizmy.com',
    siteName: 'Supply Chain Disruption Monitor',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
