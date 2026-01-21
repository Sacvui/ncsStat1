'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Save, Key } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    role?: string
}

export default function EditProfileModal({
    user,
    profile,
    isOpen,
    onClose
}: {
    user: any,
    profile: Profile | null,
    isOpen: boolean,
    onClose: () => void
}) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    if (!isOpen) return null

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const updates = {
                id: user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabase
                .from('profiles')
                .upsert(updates)

            if (error) throw error

            setMessage({ text: 'Cập nhật hồ sơ thành công!', type: 'success' })
            router.refresh() // Refresh server data

            // Close after specific time or let user close
            setTimeout(() => {
                onClose()
                setMessage(null)
            }, 1500)
        } catch (error: any) {
            setMessage({ text: 'Lỗi: ' + error.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Chỉnh sửa hồ sơ</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Họ và tên</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            placeholder="Nhập họ tên của bạn"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Avatar URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono text-slate-600"
                                placeholder="https://..."
                            />
                            {avatarUrl && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">Dán link ảnh (JPG, PNG) để làm ảnh đại diện.</p>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang lưu...</span>
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
