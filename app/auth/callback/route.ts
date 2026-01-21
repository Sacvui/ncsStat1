import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/analyze'

    console.log('[Auth Callback] Starting with code:', code ? 'present' : 'missing')

    // Determine the correct redirect URL based on environment
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    const origin = isLocalEnv
        ? request.nextUrl.origin
        : forwardedHost
            ? `https://${forwardedHost}`
            : request.nextUrl.origin

    // Log all cookies for debugging
    const allCookies = request.cookies.getAll()
    console.log('[Auth Callback] All cookies:', allCookies.map(c => c.name).join(', '))

    if (code) {
        // Create the redirect response first
        const response = NextResponse.redirect(`${origin}${next}`)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        // Return all cookies from the request
                        const cookies = request.cookies.getAll()
                        console.log('[Auth Callback] getAll called, returning', cookies.length, 'cookies')
                        return cookies
                    },
                    setAll(cookiesToSet) {
                        // Set all cookies on the response
                        console.log('[Auth Callback] setAll called with', cookiesToSet.length, 'cookies')
                        cookiesToSet.forEach(({ name, value, options }) => {
                            console.log('[Auth Callback] Setting cookie:', name)
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        console.log('[Auth Callback] Calling exchangeCodeForSession...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        console.log('[Auth Callback] Exchange result - error:', error?.message || 'none')
        console.log('[Auth Callback] Exchange result - session:', data?.session ? 'present' : 'none')

        if (!error) {
            console.log('[Auth Callback] Success! Redirecting to:', `${origin}${next}`)
            return response
        } else {
            console.log('[Auth Callback] Error during exchange:', error)
        }
    }

    // Return the user to an error page
    console.log('[Auth Callback] Redirecting to error page')
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
