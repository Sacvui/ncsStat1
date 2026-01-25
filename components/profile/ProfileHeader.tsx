'use client'

import { useState, useEffect } from 'react'
import { Mail, Shield, Edit2, GraduationCap, Building2, BookOpen, Copy, Users, Check } from 'lucide-react'
import EditProfileModal from './EditProfileModal'
import { getAvatarUrl } from '@/utils/avatarHelper'
import { getSupabase } from '@/utils/supabase/client'
import { getOrCreateReferralCode, getReferralStats } from '@/lib/referral'

type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    role?: string
    referral_code?: string
    email?: string
    phone_number?: string | null
    date_of_birth?: string | null
    academic_level?: string | null
    research_field?: string | null
    organization?: string | null
}

export default function ProfileHeader({ user, profile: initialProfile, onUpdate }: { user: any, profile: Profile | null, onUpdate?: () => void }) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [profile, setProfile] = useState<Profile | null>(initialProfile)
    const [referralCode, setReferralCode] = useState<string>('')
    const [referralCount, setReferralCount] = useState(0)
    const [copied, setCopied] = useState(false)
    const supabase = getSupabase()

    useEffect(() => {
        setProfile(initialProfile)
    }, [initialProfile])

    // Load referral code
    useEffect(() => {
        if (!user?.id) return
        getOrCreateReferralCode(user.id).then(setReferralCode)
        getReferralStats(user.id).then(stats => setReferralCount(stats.referralCount))
    }, [user?.id])

    const copyReferralCode = async () => {
        await navigator.clipboard.writeText(referralCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    useEffect(() => {
        if (!user) return

        const channel = supabase
            .channel(`profile-header-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload: any) => {
                    setProfile(payload.new as Profile)
                    if (onUpdate) onUpdate()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, supabase, onUpdate])

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative group">
            <button
                onClick={() => setIsEditOpen(true)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                title="Chỉnh sửa hồ sơ"
            >
                <Edit2 className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center">
                <div className="relative">
                    <img
                        src={getAvatarUrl(profile?.avatar_url, user?.user_metadata?.avatar_url)}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full mb-4 ring-4 ring-blue-50 object-cover"
                    />
                    <button
                        onClick={() => setIsEditOpen(true)}
                        className="absolute bottom-4 right-0 w-8 h-8 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                </div>

                <h2 className="text-xl font-bold text-slate-900 text-center flex items-center gap-2">
                    {profile?.full_name || 'Người dùng'}
                </h2>

                {/* Organization & Academic Level */}
                <div className="mt-2 text-center space-y-1">
                    {profile?.academic_level && (
                        <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-800">
                            <GraduationCap className="w-4 h-4 text-slate-500" />
                            {profile.academic_level}
                        </div>
                    )}

                    {profile?.organization && (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                            <Building2 className="w-3 h-3" />
                            {profile.organization}
                        </div>
                    )}
                </div>

                {/* Contact Info */}
                <div className="flex items-center gap-2 mt-3 text-slate-500 text-xs bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <Mail className="w-3 h-3" />
                    {profile?.email || user.email}
                </div>

                {/* Research Field Badge */}
                {profile?.research_field && (
                    <div className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" />
                        {profile.research_field}
                    </div>
                )}

                {/* Role Badge */}
                <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5
                    ${profile?.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}
                `}>
                    <Shield className="w-3 h-3" />
                    {profile?.role === 'admin' ? 'System Admin' : 'Thành viên'}
                </div>

                {/* Referral Section */}
                {referralCode && (
                    <div className="mt-4 w-full border-t border-slate-100 pt-4">
                        <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Mã giới thiệu của bạn
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-lg text-sm font-mono font-bold text-blue-700 border border-blue-200">
                                {referralCode}
                            </code>
                            <button
                                onClick={copyReferralCode}
                                className={`p-2 rounded-lg transition-all ${copied
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600'
                                    }`}
                                title={copied ? 'Đã sao chép!' : 'Sao chép mã'}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        {referralCount > 0 && (
                            <div className="mt-2 text-xs text-green-600 font-medium">
                                🎉 Đã giới thiệu {referralCount} người dùng
                            </div>
                        )}
                    </div>
                )}
            </div>

            <EditProfileModal
                user={user}
                profile={profile}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSuccess={onUpdate}
            />
        </div>
    )
}
