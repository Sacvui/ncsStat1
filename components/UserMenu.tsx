'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/utils/supabase/client'
import { User, LogOut, Settings, ChevronDown, MessageSquare, Database } from 'lucide-react'
import FeedbackModal from './FeedbackModal'
import { getAvatarUrl } from '@/utils/avatarHelper'
import { clearOrcidSession } from '@/hooks/useOrcidSession'

export default function UserMenu({ user, profile, isOrcidUser = false }: { user: any, profile?: any, isOrcidUser?: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const initial = user.email ? user.email[0].toUpperCase() : 'U'
    const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    // Handle logout for both Supabase and ORCID users
    const handleLogout = async () => {
        if (isOrcidUser) {
            clearOrcidSession()
            window.location.href = '/login'
        } else {
            // Submit form for Supabase signout
            const form = document.getElementById('signout-form') as HTMLFormElement
            form?.submit()
        }
    }

    return (
        <>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 shadow-sm">
                        <img
                            src={getAvatarUrl(profile?.avatar_url, user.user_metadata?.avatar_url)}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden md:block max-w-[150px] truncate">
                        {displayName}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">Logged in as</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                        </div>

                        <div className="py-1">
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Database className="w-4 h-4" />
                                Quản lý dự án
                            </Link>

                            <Link
                                href="/profile"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <User className="w-4 h-4" />
                                Hồ sơ cá nhân
                            </Link>
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    setIsFeedbackOpen(true)
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Send Feedback
                            </button>
                        </div>

                        <div className="border-t border-slate-100 py-1">
                            <form id="signout-form" action="/auth/signout" method="post" className="hidden" />
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        </>
    )
}
