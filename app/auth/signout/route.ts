import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    // Check if a user is logged in
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        await supabase.auth.signOut()
    }

    revalidatePath('/', 'layout')

    // Handle proxy headers for correct redirect
    const forwardedHost = req.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
        return NextResponse.redirect(new URL('/login', req.url), { status: 302 })
    } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/login`, { status: 302 })
    } else {
        return NextResponse.redirect(new URL('/login', req.url), { status: 302 })
    }
}
