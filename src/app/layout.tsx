import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import { AppHeader } from '@/components/AppHeader'
import ClientProviders from './providers'
import { SessionRestorer } from '@/components/session-restorer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FURFIELD Organization Management',
  description: 'FURFIELD helps your teams manage organizations, members, and operations seamlessly.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <ClientProviders>
          <Suspense fallback={null}>
            <SessionRestorer />
          </Suspense>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}
