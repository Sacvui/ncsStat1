
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClientOnly() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: 'pkce',
                detectSessionInUrl: false, // We handle the code exchange manually
                persistSession: true, // Allow localStorage persistence for the handshake
                storage: typeof window !== 'undefined' ? window.localStorage : undefined
            }
        }
    )
}
