import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === 'true' || !url || !anon || url.includes('your-project')

export const schoolName =
  (import.meta.env.VITE_SCHOOL_NAME as string | undefined) || 'Horizon High School'

export const supabase: SupabaseClient | null =
  !isDemoMode && url && anon ? createClient(url, anon) : null
