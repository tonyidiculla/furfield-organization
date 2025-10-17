'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@furfield/auth-service'

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
