import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    const host = request.headers.get('host')
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    console.log(`[AuthCallback] Host: ${host}, ForwardedHost: ${forwardedHost}, ForwardedProto: ${forwardedProto}`)

    const publicOrigin = (forwardedHost)
        ? `https://${forwardedHost}`
        : requestUrl.origin
    console.log(`[AuthCallback] PublicOrigin: ${publicOrigin}`)

    const isHttps = forwardedProto === 'https' || publicOrigin.startsWith('https') || process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    const useSecureCookies = isHttps

    if (code) {
        const cookieStore = await cookies()
        const cookiesToSetOnResponse: { name: string; value: string; options: any }[] = []

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
                            cookiesToSet.forEach(({ name, value, options }) => {
                                // Update the store for consistency (though redirect might ignore it)
                                cookieStore.set(name, value, {
                                    ...options,
                                    secure: useSecureCookies,
                                    sameSite: 'lax',
                                    path: '/',
                                })
                                // Capture for manual setting on response
                                cookiesToSetOnResponse.push({
                                    name,
                                    value,
                                    options: {
                                        ...options,
                                        secure: useSecureCookies,
                                        sameSite: 'lax',
                                        path: '/',
                                    }
                                })
                            })
                        } catch (err) {
                            console.log('[AuthCallback] cookieStore.set error:', err)
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

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.session) {
            console.log(`[AuthCallback] Session exchange successful. Capturing ${cookiesToSetOnResponse.length} cookies.`)

            const response = NextResponse.redirect(`${publicOrigin}${next}`)

            cookiesToSetOnResponse.forEach(({ name, value, options }) => {
                console.log(`[AuthCallback] Setting On Response: ${name}`)
                response.cookies.set(name, value, options)
            })

            return response
        } else if (error) {
            console.log('[AuthCallback] Exchange error:', error.message)
        }
    }

    return NextResponse.redirect(`${publicOrigin}/login?error=auth-code-error`)
}
