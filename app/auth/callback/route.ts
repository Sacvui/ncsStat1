import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    // Get true origin for redirection
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host')

    // Construct the public origin
    const publicOrigin = (forwardedHost)
        ? `${forwardedProto}://${forwardedHost}`
        : requestUrl.origin

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
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // This can be ignored if middleware is refreshing
                        }
                    },
                },
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
