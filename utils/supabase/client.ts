import { createBrowserClient } from '@supabase/ssr'

// Fallback for build time when env vars may not be available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
    if (!supabaseInstance) {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('[Supabase] Missing environment variables. Using placeholder values.')
        }
        supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
    }
    return supabaseInstance
}

// Backward compatible alias (optional)
export const createClient = getSupabase
