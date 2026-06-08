import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Caregiver AI Agent',
  description: 'Dementia caregiver-support AI agent using Gemini, Google Cloud, and Elastic MCP.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
