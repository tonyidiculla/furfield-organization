import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Organization App',
  description: 'Authentication and landing page',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
