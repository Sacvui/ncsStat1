import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/analyze'

    // Determine the correct redirect URL based on environment
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    let redirectUrl: string
    if (isLocalEnv) {
        redirectUrl = `${origin}${next}`
    } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
    } else {
        redirectUrl = `${origin}${next}`
    }

    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(redirectUrl)
        }
    }

    // Return the user to an error page
    const errorUrl = isLocalEnv
        ? `${origin}/login?error=auth-code-error`
        : forwardedHost
            ? `https://${forwardedHost}/login?error=auth-code-error`
            : `${origin}/login?error=auth-code-error`

    return NextResponse.redirect(errorUrl)
}
