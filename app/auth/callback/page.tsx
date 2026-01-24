'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/utils/supabase/client'
import { createClientOnly } from '@/utils/supabase/client-only'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Sometimes the code comes as a query param, sometimes hash (implicit), but for PKCE flow it's usually query
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/analyze'
    const errorParam = searchParams.get('error')

    const [status, setStatus] = useState('Đang xử lý đăng nhập...')

    useEffect(() => {
        const handleAuth = async () => {
            if (errorParam) {
                setStatus(`Lỗi: ${errorParam}`)
                setTimeout(() => router.push('/login'), 2000)
                return
            }

            if (!code) {
                // If no code, maybe we're already logged in or it's a direct visit?
                // Just redirect to login to be safe
                console.log('No code found, redirecting to login')
                router.push('/login?error=no_code_client')
                return
            }

            // 1. Initialize logic clients
            // clientOnly: Uses localStorage, where the code_verifier was saved during login
            const clientOnly = createClientOnly()
            // clientSSR: Uses cookies, where we want to put the final session for middleware
            const clientSSR = getSupabase()

            try {
                // Client-side exchange! 
                // Uses localStorage for PKCE verifier automatically.
                console.log('Phase 1: Exchanging code via LocalStorage client...')
                const { data, error } = await clientOnly.auth.exchangeCodeForSession(code)

                if (error) throw error

                if (data.session) {
                    console.log('Phase 1 Success. User:', data.session.user.id)
                    setStatus('Xác thực thành công. Đang đồng bộ phiên...')

                    // 2. Sync to Cookies
                    // We take the session we got from LS client and force it into the Cookie client
                    const { error: syncError } = await clientSSR.auth.setSession({
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token,
                    })

                    if (syncError) {
                        console.error('Phase 2 Error:', syncError)
                        throw syncError
                    }

                    console.log('Phase 2 Success: Session synced to cookies.')
                    setStatus('Đăng nhập hoàn tất! Đang chuyển hướng...')

                    // Force a hard navigation to ensure cookies are sent freshly to the server middleware
                    // This avoids any SPA caching issues with middleware states
                    window.location.href = next
                }
            } catch (error: any) {
                console.error('Auth Hybrid Error:', error)
                // If it's a PKCE error, it might be due to stale cookies. 
                // We should clear them or just ask user to try again.
                router.push(`/login?error=${encodeURIComponent(error.message)}`)
            }
        }

        handleAuth()
    }, [code, next, errorParam, router])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fafe] text-gray-600">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold">{status}</h2>
            <p className="text-sm text-gray-400 mt-2">Dữ liệu đang được xác thực trực tiếp trên trình duyệt...</p>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fafe] text-gray-600">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <h2 className="text-xl font-semibold">Đang tải...</h2>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    )
}
