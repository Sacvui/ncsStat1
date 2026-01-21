import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL, defaults to /analyze
    const next = searchParams.get('next') ?? '/analyze'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
        const isLocalEnv = process.env.NODE_ENV === 'development'

        if (isLocalEnv) {
            // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
            redirect(`${origin}${next}`)
        } else if (forwardedHost) {
            redirect(`https://${forwardedHost}${next}`)
        } else {
            redirect(`${origin}${next}`)
        }
    }
}

// return the user to an error page with instructions
redirect(`${origin}/login?error=auth-code-error`)
}
