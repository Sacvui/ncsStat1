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
        if (!error) {
            redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    redirect(`${origin}/login?error=auth-code-error`)
}
