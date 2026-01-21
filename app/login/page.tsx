'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)

    const handleLogin = async (provider: 'google' | 'orcid') => {
        setLoading(true)
        const supabase = createClient()

        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error('Login error:', error)
            alert('Đăng nhập thất bại: ' + error.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <img className="mx-auto h-12 w-auto" src="/logo.svg" alt="ncsStat" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Đăng nhập
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Truy cập công cụ phân tích thống kê mạnh mẽ
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={() => handleLogin('google')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Tiếp tục với Google
                    </button>

                    <button
                        onClick={() => handleLogin('orcid')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-[#A6CE39] hover:bg-[#95b933] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A6CE39] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.948.948 0 0 1-.947-.947c0-.516.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.306v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.212-3.722-4.097-3.722h-2.222z" />
                        </svg>
                        Tiếp tục với ORCID
                    </button>
                </div>
            </div>
        </div>
    )
}
