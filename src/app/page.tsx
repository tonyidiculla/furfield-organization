'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/organization')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  )
}
