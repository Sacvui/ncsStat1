import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/analyze'

    console.log('[Auth Callback] Starting with code:', code ? 'present' : 'missing')

    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    const origin = isLocalEnv
        ? request.nextUrl.origin
        : forwardedHost
            ? `https://${forwardedHost}`
            : request.nextUrl.origin

    if (code) {
        const redirectUrl = `${origin}${next}`

        let cookiesToSet: { name: string; value: string; options: any }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookies) {
                        console.log('[Auth Callback] setAll TRIGGERED with', cookies.length, 'cookies')
                        cookies.forEach((c) => {
                            cookiesToSet.push(c)
                        })
                    },
                },
            }
        )

        console.log('[Auth Callback] Calling exchangeCodeForSession...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log(`[Auth Callback] Exchange success. Initial Cookies collected: ${cookiesToSet.length}`)

            // FALLBACK: If exchange didn't trigger setAll, force it using setSession
            if (cookiesToSet.length === 0 && data?.session) {
                console.warn('[Auth Callback] WARNING: No cookies collected during exchange. Attempting to force setSession...')
                const { error: setSessionError } = await supabase.auth.setSession(data.session)
                if (setSessionError) {
                    console.error('[Auth Callback] Force setSession failed:', setSessionError)
                } else {
                    console.log(`[Auth Callback] Force setSession success. Total Cookies collected: ${cookiesToSet.length}`)
                }
            }

            // HTML Response
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="3;url=${redirectUrl}">
    <title>Logging in...</title>
    <script>
        setTimeout(function() {
            window.location.href = "${redirectUrl}";
        }, 3000);
    </script>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
        .spinner { border: 4px solid #e5e7eb; border-top: 4px solid #2563eb; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .debug { margin-top: 20px; font-size: 12px; color: #6b7280; font-family: monospace; }
    </style>
</head>
<body>
    <div class="spinner"></div>
    <h2>Authenticating...</h2>
    <p>Session confirmed. Redirecting...</p>
    <p class="debug">Target: ${next}</p>
    <noscript>
        <p>If you are not redirected, <a href="${redirectUrl}">click here</a>.</p>
    </noscript>
</body>
</html>
            `.trim()

            const response = new NextResponse(html, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-store, max-age=0',
                },
            })

            const safeOptions = {
                path: '/',
                sameSite: 'lax' as const,
                secure: !isLocalEnv,
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7, // 1 week
            }

            // Apply Collected Cookies
            if (cookiesToSet.length > 0) {
                cookiesToSet.forEach(({ name, value }) => {
                    console.log(`[Auth Callback] Applying cookie: ${name} (len: ${value.length})`)
                    response.cookies.set(name, value, safeOptions)
                })
            } else {
                console.error('[Auth Callback] CRITICAL: No cookies to set even after fallback!')
            }

            // Add Probe v5
            response.cookies.set('test-probe-cookie-v5', 'fallback-trigger-verification', {
                ...safeOptions,
                httpOnly: false,
            })

            console.log('[Auth Callback] Final Cookie Count:', response.cookies.getAll().length)

            return response
        } else {
            console.error('[Auth Callback] Exchange error:', error)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
        }
    }

    return NextResponse.redirect(`${origin}/login?error=no_code`)
}
