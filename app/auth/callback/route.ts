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

    if (code) {
        // Create the redirect response first - this is key for cookie setting
        const redirectUrl = `${origin}${next}`
        const response = NextResponse.redirect(redirectUrl)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        const cookies = request.cookies.getAll()
                        console.log('[Auth Callback] getAll called, returning', cookies.length, 'cookies')
                        return cookies
                    },
                    setAll(cookiesToSet) {
                        console.log('[Auth Callback] setAll called with', cookiesToSet.length, 'cookies')
                        cookiesToSet.forEach(({ name, value, options }) => {
                            console.log('[Auth Callback] Setting cookie:', name, 'domain:', options?.domain, 'path:', options?.path)
                            // Use Supabase's default options - DO NOT OVERRIDE
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        console.log('[Auth Callback] Calling exchangeCodeForSession...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        console.log('[Auth Callback] Exchange result - error:', error?.message || 'none')

        if (!error) {
            console.log('[Auth Callback] Success! Redirecting to:', redirectUrl)
            return response
        } else {
            console.log('[Auth Callback] Error during exchange:', error)
        }
    }

    // Return the user to an error page
    console.log('[Auth Callback] Redirecting to error page')
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
