import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/analyze'

    console.log('[Auth Callback] Starting with code:', code ? 'present' : 'missing')
    console.log('[Auth Callback] Next param:', next)

    // Determine the correct redirect URL based on environment
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    const origin = isLocalEnv
        ? request.nextUrl.origin
        : forwardedHost
            ? `https://${forwardedHost}`
            : request.nextUrl.origin

    console.log('[Auth Callback] Origin:', origin, 'ForwardedHost:', forwardedHost)

    if (code) {
        // Collect cookies that need to be set
        const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        const value = request.cookies.get(name)?.value
                        console.log('[Auth Callback] Cookie GET:', name, value ? 'found' : 'not found')
                        return value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        console.log('[Auth Callback] Cookie SET:', name, 'value length:', value?.length || 0)
                        cookiesToSet.push({ name, value, options })
                    },
                    remove(name: string, options: CookieOptions) {
                        console.log('[Auth Callback] Cookie REMOVE:', name)
                        cookiesToSet.push({ name, value: '', options })
                    },
                },
            }
        )

        console.log('[Auth Callback] Calling exchangeCodeForSession...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        console.log('[Auth Callback] Exchange result - error:', error?.message || 'none')
        console.log('[Auth Callback] Exchange result - session:', data?.session ? 'present' : 'none')
        console.log('[Auth Callback] Cookies to set count:', cookiesToSet.length)

        if (!error) {
            // Create response and apply all collected cookies
            const response = NextResponse.redirect(`${origin}${next}`)

            for (const cookie of cookiesToSet) {
                console.log('[Auth Callback] Applying cookie to response:', cookie.name)
                response.cookies.set({
                    name: cookie.name,
                    value: cookie.value,
                    ...cookie.options,
                })
            }

            console.log('[Auth Callback] Redirecting to:', `${origin}${next}`)
            return response
        } else {
            console.log('[Auth Callback] Exchange error:', error)
        }
    }

    // Return the user to an error page
    console.log('[Auth Callback] Redirecting to error page')
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
