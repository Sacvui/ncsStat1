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
                cookieOptions: {
                    // Try to be explicit about security if we are on HTTPS
                    secure: request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                }
            }
        )

        const {
            data: { user },
        } = await supabase.auth.getUser()

        // Protected routes
        if (
            !user &&
            (request.nextUrl.pathname.startsWith('/analyze') ||
                request.nextUrl.pathname.startsWith('/profile') ||
                request.nextUrl.pathname.startsWith('/admin'))
        ) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('next', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }
    } catch (error) {
        // If Supabase fails, continue without auth or log error appropriately
    }

    return response
}
