import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/analyze'

    console.log('[Auth Callback] Starting with code:', code ? 'present' : 'missing')

    // Determine the correct redirect URL based on environment
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    const origin = isLocalEnv
        ? request.nextUrl.origin
        : forwardedHost
            ? `https://${forwardedHost}`
            : request.nextUrl.origin

    if (code) {
        // Collect cookies during the exchange
        const cookiesToSet: { name: string; value: string; options: any }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookies) {
                        console.log('[Auth Callback] setAll called with', cookies.length, 'cookies')
                        cookies.forEach(({ name, value, options }) => {
                            cookiesToSet.push({ name, value, options })
                        })
                    },
                },
            }
        )

        console.log('[Auth Callback] Calling exchangeCodeForSession...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        console.log('[Auth Callback] Exchange result - error:', error?.message || 'none')

        if (!error) {
            // SUCCESS: Create HTML response with client-side redirect
            // This ensures cookies are set on a 200 OK response, avoiding 3xx redirect cookie blocking
            const redirectUrl = `${origin}${next}`

            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
    <title>Logging in...</title>
    <script>window.location.href = "${redirectUrl}";</script>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
        .container { text-align: center; }
        .spinner { border: 4px solid #e5e7eb; border-top: 4px solid #2563eb; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <p>Completing login...</p>
        <p style="font-size: 0.875rem; color: #6b7280;">If not redirected automatically, <a href="${redirectUrl}" style="color: #2563eb; text-decoration: none;">click here</a>.</p>
    </div>
</body>
</html>
            `.trim()

            const response = new NextResponse(html, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            })

            // Apply collected cookies to the response
            // We use the exact options provided by Supabase
            cookiesToSet.forEach(({ name, value, options }) => {
                console.log('[Auth Callback] Setting cookie:', name)
                response.cookies.set(name, value, options)
            })

            console.log('[Auth Callback] Success! Returning HTML with redirect to:', redirectUrl)
            return response
        } else {
            console.log('[Auth Callback] Error during exchange:', error)
        }
    }

    // Return the user to an error page
    console.log('[Auth Callback] Redirecting to error page')
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
