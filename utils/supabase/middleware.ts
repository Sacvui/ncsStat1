import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require full user verification (server-side getUser)
const PROTECTED_ROUTES = ['/analyze', '/profile', '/admin']

// Routes that can skip auth check entirely (public)
const PUBLIC_ROUTES = ['/', '/login', '/terms', '/privacy', '/docs', '/methods', '/auth']

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
        return response
    }

    const pathname = request.nextUrl.pathname

    // OPTIMIZATION: Skip auth for public routes entirely
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )

    // Also skip for static assets and API routes (except auth API)
    const isStaticOrApi = pathname.startsWith('/_next') ||
        pathname.startsWith('/api/') ||
        pathname.includes('.')

    if (isPublicRoute || isStaticOrApi) {
        // Just refresh session cookies if they exist, but don't verify user
        return response
    }

    const host = request.headers.get('host')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const isHttps = forwardedProto === 'https' || request.nextUrl.protocol === 'https:'
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    const useSecureCookies = isHttps || isProduction

    try {
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
                            response.cookies.set(name, value, {
                                ...options,
                                secure: useSecureCookies,
                                sameSite: 'lax',
                                path: '/',
                            })
                        )
                    },
                },
                cookieOptions: {
                    secure: useSecureCookies,
                    sameSite: 'lax',
                    path: '/',
                }
            }
        )

        // OPTIMIZATION: Check if this is a protected route
        const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

        if (isProtectedRoute) {
            // Check for ORCID session cookie first
            const orcidUser = request.cookies.get('orcid_user')?.value
            if (orcidUser) {
                // ORCID user is authenticated via cookie, allow access
                return response
            }

            // For protected routes: Use getSession first (fast, from cookie)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                // No session at all -> redirect to login
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                url.searchParams.set('next', pathname)
                return NextResponse.redirect(url)
            }

            // Session exists - for most cases this is enough
            // Only call getUser() if session is about to expire (optional extra security)
            const sessionAge = session.expires_at ? (session.expires_at * 1000 - Date.now()) : Infinity
            const REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes

            if (sessionAge < REFRESH_THRESHOLD) {
                // Session expiring soon, verify with server
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error || !user) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/login'
                    url.searchParams.set('next', pathname)
                    return NextResponse.redirect(url)
                }
            }
        }
    } catch (error) {
        console.error('[Middleware] Auth error:', error)
        // On auth error for protected routes, redirect to login
        const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
        if (isProtectedRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('next', pathname)
            return NextResponse.redirect(url)
        }
    }

    return response
}
