'use client'

import { SessionRestorer as SharedSessionRestorer } from '@furfield/auth-service'
import { createClient } from '@/lib/supabase'

/**
 * Organization SessionRestorer
 * 
 * Wrapper around the shared SessionRestorer component that provides
 * the Organization app's Supabase client instance.
 */
export function SessionRestorer() {
  const supabaseClient = createClient()
  return <SharedSessionRestorer supabaseClient={supabaseClient} appName="Organization" />
}
