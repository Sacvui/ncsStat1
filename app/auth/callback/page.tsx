'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
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

            const supabase = createClient()

            try {
                // Client-side exchange! 
                // Uses browser cookies/storage for PKCE verifier automatically.
                console.log('Exchanging code for session on client...')
                const { data, error } = await supabase.auth.exchangeCodeForSession(code)

                if (error) throw error

                if (data.session) {
                    console.log('Exchange successful:', data.session.user.id)
                    setStatus('Đăng nhập thành công! Đang chuyển hướng...')

                    // Force a hard navigation to ensure cookies are sent freshly to the server middleware
                    // This avoids any SPA caching issues with middleware states
                    window.location.href = next
                }
            } catch (error: any) {
                console.error('Auth error:', error)
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
