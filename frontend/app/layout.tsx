import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Caregiver AI Agent',
  description: 'Dementia caregiver-support AI agent using Gemini, Google Cloud, and Elastic MCP.',
}

import { AuthProvider } from '../lib/auth'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
