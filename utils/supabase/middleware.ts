import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Skip Supabase auth if environment variables are not configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        // Environment variables not set, skip auth middleware
        return response
    }

    try {
        // Debug: log all cookies on request
        const allCookies = request.cookies.getAll()
        console.log('[Middleware] Path:', request.nextUrl.pathname)
        console.log('[Middleware] Cookies received:', allCookies.map(c => c.name).join(', ') || 'none')

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set(name, value)
                        )
                        response = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const {
            data: { user },
        } = await supabase.auth.getUser()

        console.log('[Middleware] User:', user ? user.email : 'none')

        // Protected routes
        if (
            !user &&
            (request.nextUrl.pathname.startsWith('/analyze') ||
                request.nextUrl.pathname.startsWith('/profile') ||
                request.nextUrl.pathname.startsWith('/admin'))
        ) {
            // no user, potentially respond by redirecting the user to the login page
            console.log('[Middleware] No user, redirecting to login')
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('next', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }
    } catch (error) {
        // If Supabase fails, continue without auth
        console.error('[Middleware] Supabase error:', error)
    }

    return response
}
