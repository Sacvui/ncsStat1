import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    const host = request.headers.get('host')
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    console.log(`[AuthCallback] Host: ${host}, ForwardedHost: ${forwardedHost}, ForwardedProto: ${forwardedProto}`)

    const publicOrigin = (forwardedHost)
        ? `https://${forwardedHost}`
        : requestUrl.origin
    console.log(`[AuthCallback] PublicOrigin: ${publicOrigin}`)

    const isHttps = forwardedProto === 'https' || publicOrigin.startsWith('https') || process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    const useSecureCookies = isHttps

    if (code) {
        const cookieStore = await cookies()

        // Standard createServerClient just to do the exchange.
        // We don't rely on it for cookies anymore, but we keep the options consistent.
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        // We still allow this to try, but our main reliance is now on the client-side script
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, {
                                    ...options,
                                    secure: useSecureCookies,
                                    sameSite: 'lax',
                                    path: '/',
                                })
                            )
                        } catch { }
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.session) {
            console.log(`[AuthCallback] Session exchange successful.`)

            // Client-Side Redirect Strategy
            // We return an HTML page that serves as a bridge. 
            // It initializes the Supabase client relative to the browser (so cookies work naturally)
            // and sets the session found by the server.

            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Finalizing Login...</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f9fafe; color: #333; }
                    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
                <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
            </head>
            <body>
                <div class="loader"></div>
                <h2>Hoàn tất đăng nhập...</h2>
                <p>Vui lòng đợi trong giây lát</p>
                
                <script>
                    const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_URL}';
                    const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}';
                    const session = ${JSON.stringify(data.session)};
                    const redirectUrl = '${next}';

                    // Initialize client with a non-conflicting name
                    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

                    async function setSessionAndRedirect() {
                        try {
                            // Manual check first
                            const { error } = await supabaseClient.auth.setSession({
                                access_token: session.access_token,
                                refresh_token: session.refresh_token
                            });
                            
                            if (error) {
                                console.error('Set session error:', error);
                                window.location.href = '/login?error=' + encodeURIComponent(error.message);
                            } else {
                                // Double check if session is active
                                const { data: { user } } = await supabaseClient.auth.getUser();
                                if (user) {
                                     // Success
                                     window.location.href = redirectUrl;
                                } else {
                                     throw new Error('Verification failed');
                                }
                            }
                        } catch (e) {
                            console.error('Finalization error:', e);
                            window.location.href = '/login?error=client-side-error';
                        }
                    }

                    // Run immediately
                    setSessionAndRedirect();
                </script>
            </body>
            </html>
            `

            return new Response(html, {
                headers: {
                    'Content-Type': 'text/html',
                },
            })
        } else if (error) {
            console.log('[AuthCallback] Exchange error:', error.message)
        }
    }

    return NextResponse.redirect(`${publicOrigin}/login?error=auth-code-error`)
}
