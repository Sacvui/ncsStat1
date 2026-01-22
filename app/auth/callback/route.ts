import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    // Get true origin for redirection
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto')

    // Construct the public origin. If behind a proxy, assume https for safety unless explicitly http
    const publicOrigin = (forwardedHost)
        ? `https://${forwardedHost}` // Force https for the public domain
        : requestUrl.origin

    const isHttps = forwardedProto === 'https' || publicOrigin.startsWith('https') || process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    const isProduction = process.env.NODE_ENV === 'production'
    const useSecureCookies = isHttps || isProduction

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, {
                                    ...options,
                                    secure: useSecureCookies,
                                    sameSite: 'lax',
                                    path: '/',
                                })
                            )
                        } catch {
                            // This can be ignored if middleware is refreshing
                        }
                    },
                },
                cookieOptions: {
                    secure: useSecureCookies,
                    sameSite: 'lax',
                    path: '/',
                }
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Success: redirect to the 'next' destination on the public origin
            return NextResponse.redirect(`${publicOrigin}${next}`)
        }
    }

    // Failure: redirect back to login with error
    return NextResponse.redirect(`${publicOrigin}/login?error=auth-code-error`)
}
