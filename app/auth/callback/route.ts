import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/analyze'

    // Determine the correct redirect URL based on environment
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    const origin = isLocalEnv
        ? request.nextUrl.origin
        : forwardedHost
            ? `https://${forwardedHost}`
            : request.nextUrl.origin

    if (code) {
        // Create a response that we can modify with cookies
        const response = NextResponse.redirect(`${origin}${next}`)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // Set cookie on the response
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return response
        }
    }

    // Return the user to an error page
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
