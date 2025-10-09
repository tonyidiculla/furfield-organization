import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppHeader } from '@/components/AppHeader'
import { UserProvider } from '@/contexts/UserContext'

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
        <UserProvider>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
          </div>
        </UserProvider>
      </body>
    </html>
  )
}
