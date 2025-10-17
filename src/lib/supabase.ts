import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { authClient } from '@furfield/auth-service'

type AppSupabaseClient = SupabaseClient<any, 'master_data'>

let cachedClient: AppSupabaseClient | null = null

export function createClient(): AppSupabaseClient {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl) {
		throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
	}

	if (!supabaseAnonKey) {
		throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
	}

	if (typeof window === 'undefined') {
		return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
				detectSessionInUrl: false,
			},
			db: {
				schema: 'master_data',
			},
		}) as AppSupabaseClient
	}

	if (!cachedClient) {
		const authSupabase = authClient.getSupabaseClient()
		cachedClient = authSupabase as unknown as AppSupabaseClient
	}

	return cachedClient
}

export const supabase = createClient()
