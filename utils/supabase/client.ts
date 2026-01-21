import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                // Ensure cookies are available across redirects and subdomains if needed
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
            }
        }
    )
}
