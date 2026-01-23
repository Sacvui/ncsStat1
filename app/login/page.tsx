'use client'

import { createClientOnly } from '@/utils/supabase/client-only'
import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProjectFlowAnimation } from '@/components/login/ProjectFlowAnimation'
import { Loader2 } from 'lucide-react'

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
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Real OAuth flow with Supabase
    const handleLogin = async (provider: 'google' | 'linkedin_oidc') => {
        setLoading(provider)
        setErrorMsg(null)

        try {
            const supabase = createClientOnly()
            const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next || '/analyze')}`

            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: redirectTo,
                },
            })

            if (error) {
                console.error('OAuth error:', error)
                setErrorMsg(error.message)
                setLoading(null)
            }
            // If no error, browser will redirect to OAuth provider
        } catch (err: any) {
            console.error('Login error:', err)
            setErrorMsg(err.message || 'Đã xảy ra lỗi khi đăng nhập')
            setLoading(null)
        }
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-white flex">
            {/* Left Column: Login Form */}
            <div className="w-full lg:w-1/3 flex items-center justify-center p-8 lg:p-12 border-r border-gray-100 relative z-20 bg-white h-full overflow-y-auto">
                <div className="w-full max-w-sm space-y-8 py-10">
                    {/* Header */}
                    <div className="text-center">
                        <img className="mx-auto h-16 w-auto mb-6" src="/logo.svg" alt="ncsStat" />
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-serif">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Sign in to unlock the power of advanced statistics
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        {errorMsg && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                {errorMsg}
                            </div>
                        )}

                        {/* Google */}
                        <button
                            disabled={!!loading}
                            onClick={() => handleLogin('google')}
                            className={`group relative w-full flex items-center justify-center gap-3 px-4 py-4 border border-gray-200 text-base font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                ${loading === 'google' ? 'bg-gray-50 scale-[0.98]' : 'bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'}
                                ${loading && loading !== 'google' ? 'opacity-50 grayscale' : ''}
                            `}
                        >
                            {loading === 'google' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            <span>{loading === 'google' ? 'Redirecting to Google...' : 'Continue with Google'}</span>
                        </button>

                        {/* LinkedIn */}
                        <button
                            disabled={!!loading}
                            onClick={() => handleLogin('linkedin_oidc')}
                            className={`group relative w-full flex items-center justify-center gap-3 px-4 py-4 border border-transparent text-base font-medium rounded-xl text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A66C2]
                                ${loading === 'linkedin_oidc' ? 'bg-[#004182] scale-[0.98]' : 'bg-[#0A66C2] hover:bg-[#004182] hover:shadow-md'}
                                ${loading && loading !== 'linkedin_oidc' ? 'opacity-50 grayscale' : ''}
                            `}
                        >
                            {loading === 'linkedin_oidc' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                            ) : (
                                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            )}
                            <span>{loading === 'linkedin_oidc' ? 'Redirecting to LinkedIn...' : 'Continue with LinkedIn'}</span>
                        </button>

                        {/* Text Carousel for Context (Only show when loading) */}
                        {loading && (
                            <div className="pt-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <LoadingState context={loading} />
                            </div>
                        )}

                        {/* ORCID (Disabled) */}
                        <div className="relative pt-2">
                            <button disabled className="w-full flex items-center justify-center gap-3 px-4 py-4 border border-dashed border-gray-300 text-base font-medium rounded-xl text-gray-400 bg-gray-50/50 cursor-not-allowed">
                                <svg className="h-5 w-5 grayscale opacity-50" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.948.948 0 0 1-.947-.947c0-.516.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.306v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.212-3.722-4.097-3.722h-2.222z" />
                                </svg>
                                <span>ORCID Login</span>
                            </button>
                            <span className="absolute top-0 right-2 -mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">Soon</span>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <p className="text-center text-xs text-gray-400 font-light leading-relaxed">
                            Secured by Supabase and ncsStat Scientific Core. <br />
                            By signing in, you agree to our <a href="#" className="underline hover:text-gray-600">Terms</a> & <a href="#" className="underline hover:text-gray-600">Privacy</a>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column: Animation (2/3 width on desktop, hidden on mobile) */}
            <div className="hidden lg:block lg:w-2/3 bg-gray-900 relative overflow-hidden h-full">
                {/* Trigger Release: 2026-01-22-09-20 */}
                <ProjectFlowAnimation />
            </div>
        </div>
    )
}

function LoadingState({ context }: { context?: string }) {
    const [textIndex, setTextIndex] = useState(0)
    const texts = [
        "Initializing Scientific Core...",
        "Establishing Secure Connection...",
        "Loading R Statistical Engine...",
        "Verifying User Credentials...",
        "Preparing Analytics Workspace..."
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex(prev => (prev + 1) % texts.length)
        }, 1500)
        return () => clearInterval(interval)
    }, [texts.length])

    return (
        <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-500">
            <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-blue-100 animate-pulse"></div>
                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
            </div>
            <div className="h-8">
                <p className="text-sm font-medium text-blue-600 animate-pulse">
                    {texts[textIndex]}
                </p>
            </div>
        </div>
    )
}
