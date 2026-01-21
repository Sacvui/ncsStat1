'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    )
}

function LoginForm() {
    const searchParams = useSearchParams()
    const next = searchParams.get('next')
    const [loading, setLoading] = useState<string | null>(null)

    const handleLogin = async (provider: 'google' | 'linkedin_oidc') => {
        setLoading(provider)
        const supabase = createClient()

        const redirectTo = next
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
            : `${window.location.origin}/auth/callback`

        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo,
            },
        })

        if (error) {
            console.error('Login error:', error)
            alert('Đăng nhập thất bại: ' + error.message)
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                {/* Header */}
                <div className="text-center mb-8">
                    <img className="mx-auto h-14 w-auto" src="/logo.svg" alt="ncsStat" />
                    <h2 className="mt-6 text-2xl font-bold text-gray-900">
                        Chào mừng đến ncsStat
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Đăng nhập để sử dụng công cụ phân tích thống kê
                    </p>
                </div>

                {/* Login Buttons */}
                <div className="space-y-3">
                    {/* Google */}
                    <button
                        onClick={() => handleLogin('google')}
                        disabled={loading !== null}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading === 'google' ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        Tiếp tục với Google
                    </button>

                    {/* LinkedIn */}
                    <button
                        onClick={() => handleLogin('linkedin_oidc')}
                        disabled={loading !== null}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-[#0A66C2] hover:bg-[#004182] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A66C2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading === 'linkedin_oidc' ? (
                            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        )}
                        Tiếp tục với LinkedIn
                    </button>

                    {/* ORCID - Disabled */}
                    <button
                        disabled
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-100 shadow-sm text-sm font-medium rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.948.948 0 0 1-.947-.947c0-.516.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.306v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.212-3.722-4.097-3.722h-2.222z" />
                        </svg>
                        ORCID (Sắp ra mắt)
                    </button>
                </div>

                {/* Divider */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-center text-xs text-gray-400">
                        Bằng việc đăng nhập, bạn đồng ý với{' '}
                        <a href="#" className="text-blue-600 hover:underline">Điều khoản sử dụng</a>
                        {' '}và{' '}
                        <a href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</a>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        ← Quay về trang chủ
                    </a>
                </div>
            </div>
        </div>
    )
}
