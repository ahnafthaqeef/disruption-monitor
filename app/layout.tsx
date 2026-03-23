import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Supply Chain Disruption Monitor',
  description: 'AI-powered real-time monitoring of supply chain disruptions across APAC trade routes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
