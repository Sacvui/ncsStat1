'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CompleteProfilePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
            <CompleteProfileForm />
        </Suspense>
    )
}

function CompleteProfileForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createClient()

    const orcid = searchParams.get('orcid')
    const name = searchParams.get('name')

    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Check for ORCID pending cookie
    useEffect(() => {
        const cookies = document.cookie.split(';')
        const orcidPending = cookies.find(c => c.trim().startsWith('orcid_pending='))
        if (orcidPending) {
            try {
                const data = JSON.parse(decodeURIComponent(orcidPending.split('=')[1]))
                if (data.email) setEmail(data.email)
            } catch { }
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            if (!email || !orcid) {
                throw new Error('Vui lòng nhập email')
            }

            // Create user profile in Supabase
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    orcid_id: orcid,
                    full_name: name || 'ORCID User',
                    email: email,
                    created_at: new Date().toISOString(),
                    last_active: new Date().toISOString(),
                })

            if (insertError) {
                // If profile exists, try to update
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        orcid_id: orcid,
                        full_name: name || 'ORCID User',
                        last_active: new Date().toISOString(),
                    })
                    .eq('email', email)

                if (updateError) {
                    throw updateError
                }
            }

            // Clear ORCID pending cookie
            document.cookie = 'orcid_pending=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

            // Redirect to analyze
            router.push('/analyze')
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#A6CE39]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#A6CE39">
                            <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.948.948 0 0 1-.947-.947c0-.516.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.306v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.212-3.722-4.097-3.722h-2.222z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Hoàn tất hồ sơ ORCID</h1>
                    <p className="text-slate-500 mt-2">Chào mừng {name || 'Người dùng mới'}!</p>
                </div>

                {/* ORCID Info */}
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-slate-500">ORCID của bạn</p>
                    <p className="font-mono text-lg text-[#A6CE39] font-semibold">{orcid}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email (bắt buộc)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            required
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#A6CE39] focus:border-[#A6CE39] outline-none transition"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[#A6CE39] text-white font-medium rounded-lg hover:bg-[#8FB62F] transition disabled:opacity-50"
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất & Bắt đầu phân tích'}
                    </button>
                </form>

                {/* Skip option */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/analyze')}
                        className="text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                        Bỏ qua và đăng nhập bằng cách khác
                    </button>
                </div>
            </div>
        </div>
    )
}
