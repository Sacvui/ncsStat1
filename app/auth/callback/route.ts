import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/analyze'

    if (code) {
        // Use relative path for redirect to avoid domain/protocol mismatches
        const redirectUrl = next.startsWith('/') ? next : `/${next}`

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
                        cookies.forEach((c) => cookiesToSet.push(c))
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // FALLBACK: If exchange didn't trigger setAll, force it using setSession
            if (cookiesToSet.length === 0 && data?.session) {
                await supabase.auth.setSession(data.session)
            }

            // HTML Response with Client-Side Redirect
            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
    <script>window.location.href = "${redirectUrl}"</script>
</head>
<body></body>
</html>`.trim()

            const response = new NextResponse(html, {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            })

            const isLocalEnv = process.env.NODE_ENV === 'development'
            const safeOptions = {
                path: '/',
                sameSite: 'lax' as const,
                secure: !isLocalEnv,
                httpOnly: false, // Allow client-side JS to read cookies for Supabase SDK
                maxAge: 60 * 60 * 24 * 7, // 1 week
            }

            // Apply Collected Cookies
            cookiesToSet.forEach(({ name, value }) => {
                response.cookies.set(name, value, safeOptions)
            })

            return response
        } else {
            return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
        }
    }

    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
}
