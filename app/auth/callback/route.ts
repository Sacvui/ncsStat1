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
        // Create an HTML response that will set cookies and then redirect via JavaScript
        // This ensures the browser processes Set-Cookie headers before navigation
        const redirectUrl = `${origin}${next}`

        // Build cookies array to collect during exchange
        const cookiesToSet: { name: string; value: string; options: any }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        const cookies = request.cookies.getAll()
                        console.log('[Auth Callback] getAll called, returning', cookies.length, 'cookies')
                        return cookies
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
            // Create HTML response with meta refresh and JavaScript redirect
            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
    <title>Đang đăng nhập...</title>
    <script>window.location.href = "${redirectUrl}";</script>
</head>
<body>
    <p>Đang chuyển hướng... <a href="${redirectUrl}">Bấm vào đây nếu không tự động chuyển</a></p>
</body>
</html>
            `.trim()

            // Create response with HTML and set all cookies
            const response = new NextResponse(html, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                },
            })

            // Apply all collected cookies to the response
            for (const cookie of cookiesToSet) {
                console.log('[Auth Callback] Setting cookie:', cookie.name)
                response.cookies.set(cookie.name, cookie.value, {
                    ...cookie.options,
                    path: '/',
                    sameSite: 'lax',
                    secure: !isLocalEnv,
                    httpOnly: true,
                })
            }

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
