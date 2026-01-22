
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClientOnly() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: 'pkce',
                detectSessionInUrl: false,
                persistSession: true,
                storageKey: 'ncs_auth_token', // Explicit key to ensure consistency
                storage: typeof window !== 'undefined' ? window.localStorage : undefined,
                debug: true // Enable debug logs
            }
        }
    )
}
