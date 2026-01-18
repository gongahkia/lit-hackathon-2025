import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we're in standalone mode (no Supabase configured)
export const isStandaloneMode = !supabaseUrl || !supabaseAnonKey

// Create a null-safe supabase client
export const supabase: SupabaseClient | null = isStandaloneMode
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations only
// Returns null in standalone mode instead of throwing
export function getSupabaseAdmin(): SupabaseClient | null {
  if (isStandaloneMode) {
    return null
  }

  // Only available on server side
  if (typeof window !== 'undefined') {
    console.warn('supabaseAdmin is only available on the server side.')
    return null
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set, using standalone mode')
    return null
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
