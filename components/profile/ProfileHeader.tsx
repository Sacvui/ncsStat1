'use client'

import { useState } from 'react'
import { Mail, Shield, Edit2 } from 'lucide-react'
import EditProfileModal from './EditProfileModal'

type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    role?: string
    referral_code?: string
    email?: string
}

export default function ProfileHeader({ user, profile }: { user: any, profile: Profile | null }) {
    const [isEditOpen, setIsEditOpen] = useState(false)

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
                {profile?.avatar_url ? (
                    <div className="relative">
                        <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full mb-4 ring-4 ring-blue-50 object-cover" />
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="absolute bottom-4 right-0 w-8 h-8 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold mb-4 ring-4 ring-blue-50 cursor-pointer" onClick={() => setIsEditOpen(true)}>
                            {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </div>
                    </div>
                )}

                <h2 className="text-xl font-bold text-slate-900 text-center flex items-center gap-2">
                    {profile?.full_name || 'Người dùng'}
                </h2>

                <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full">
                    <Mail className="w-3 h-3" />
                    {profile?.email || user.email}
                </div>

                <div className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border flex items-center gap-1.5
                    ${profile?.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}
                `}>
                    <Shield className="w-3 h-3" />
                    {profile?.role === 'admin' ? 'Administrator' : 'Researcher'}
                </div>
            </div>

            <EditProfileModal
                user={user}
                profile={profile}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
            />
        </div>
    )
}
