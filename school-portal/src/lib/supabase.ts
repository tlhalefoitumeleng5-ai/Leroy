import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const schoolName =
  (import.meta.env.VITE_SCHOOL_NAME as string | undefined) || 'Horizon High School'

/** Demo mode is intentionally disabled. The app requires a live Supabase project. */
export const isDemoMode = false

export const hasSupabaseConfig = Boolean(
  url &&
    anon &&
    !url.includes('your-project') &&
    url.startsWith('https://') &&
    anon.length > 20,
)

export const supabaseUrl = url ?? ''
export const supabaseAnonKey = anon ?? ''

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in school-portal/.env',
    )
  }
  return supabase
}
