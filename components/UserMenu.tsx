'use client'

import { useState, useRef, useEffect } from 'react'
import { getSupabase } from '@/utils/supabase/client'
import { User, LogOut, Settings, ChevronDown, MessageSquare, Database } from 'lucide-react'
import FeedbackModal from './FeedbackModal'
import { getAvatarUrl } from '@/utils/avatarHelper'

export default function UserMenu({ user, profile }: { user: any, profile?: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
    const [recentProjects, setRecentProjects] = useState<any[]>([])
    const menuRef = useRef<HTMLDivElement>(null)
    const supabase = getSupabase()

    // Fetch projects when menu opens
    useEffect(() => {
        if (isOpen && user) {
            const fetchProjects = async () => {
                const { data } = await supabase
                    .from('projects')
                    .select('id, name, updated_at, status')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(3)
                if (data) setRecentProjects(data)
            }
            fetchProjects()
        }
    }, [isOpen, user])

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
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

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
                            {/* Recent Projects Section */}
                            {recentProjects.length > 0 && (
                                <div className="px-4 py-2 border-b border-slate-50">
                                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Dự án gần đây</p>
                                    <div className="space-y-1">
                                        {recentProjects.map(p => (
                                            <button
                                                key={p.id}
                                                disabled
                                                className="w-full text-left group block"
                                            >
                                                <div className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded hover:bg-slate-50 transition-colors">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                                            {p.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {new Date(p.updated_at).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                            <form action="/auth/signout" method="post">
                                <button
                                    type="submit"
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        </>
    )
}
