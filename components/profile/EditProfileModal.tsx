'use client'

// ... imports
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Save, Calendar, GraduationCap, Building2, Phone, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAvatarUrl } from '@/utils/avatarHelper'

type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    role?: string
    phone_number?: string | null
    date_of_birth?: string | null
    academic_level?: string | null
    research_field?: string | null
    organization?: string | null
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
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    // Form States
    const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
    const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '')
    const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || '')
    const [academicLevel, setAcademicLevel] = useState(profile?.academic_level || '')
    const [researchField, setResearchField] = useState(profile?.research_field || '')
    const [organization, setOrganization] = useState(profile?.organization || '')

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
                phone_number: phoneNumber,
                date_of_birth: dateOfBirth || null,
                academic_level: academicLevel,
                research_field: researchField,
                organization: organization,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabase
                .from('profiles')
                .upsert(updates)

            if (error) throw error

            setMessage({ text: 'Cập nhật hồ sơ thành công!', type: 'success' })
            router.refresh()

            setTimeout(() => {
                onClose()
                setMessage(null)
            }, 1000)
        } catch (error: any) {
            setMessage({ text: 'Lỗi: ' + error.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // Image Upload Handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return
        }

        let file = e.target.files[0]

        setLoading(true)
        setMessage(null)

        try {
            // Client-side Compression: Resize to 300x300, WebP, 80% Quality
            try {
                const { compressImage } = await import('@/utils/imageHelper');
                file = await compressImage(file, 300, 300, 0.8);
            } catch (compError) {
                console.warn('Compression failed, falling back to original:', compError);
            }

            const fileName = `${user.id}/${Date.now()}.webp`
            const filePath = `${fileName}`

            // Upload compressed file
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    contentType: 'image/webp',
                    upsert: true
                })

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
            setAvatarUrl(data.publicUrl)
            setMessage({ text: 'Tải ảnh lên thành công!', type: 'success' })
        } catch (error: any) {
            setMessage({ text: 'Lỗi upload: ' + error.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
                {/* ... Header ... */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-lg">Cập nhật thông tin cá nhân</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-6">
                    {/* ... Message ... */}
                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-800 border-b pb-2">Thông tin cơ bản</h4>

                            {/* Avatar Section */}
                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 transition-colors">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md">
                                        <img
                                            src={getAvatarUrl(avatarUrl, user?.user_metadata?.avatar_url)}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                        <span className="text-xs font-medium">Thay đổi</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={loading}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Nhấn vào ảnh để tải lên</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Họ và tên</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    placeholder="Nhập họ tên đầy đủ"
                                />
                            </div>
                            {/* Hidden Avatar URL Input (for manual override if needed, or remove) */}
                            {/* <input type="hidden" value={avatarUrl} /> */}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" /> Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="0912..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" /> Ngày sinh
                                </label>
                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600"
                                />
                            </div>
                        </div>

                        {/* Academic Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-800 border-b pb-2">Thông tin học thuật</h4>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-slate-400" /> Trình độ / Học vị
                                </label>
                                <select
                                    value={academicLevel}
                                    onChange={(e) => setAcademicLevel(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white"
                                >
                                    <option value="">-- Chọn trình độ --</option>
                                    <option value="Sinh viên">Sinh viên</option>
                                    <option value="Học viên cao học">Học viên Cao học</option>
                                    <option value="Nghiên cứu sinh">Nghiên cứu sinh (PhD Candidate)</option>
                                    <option value="Giảng viên">Giảng viên</option>
                                    <option value="Nghiên cứu viên">Nghiên cứu viên</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-slate-400" /> Lĩnh vực nghiên cứu
                                </label>
                                <input
                                    type="text"
                                    value={researchField}
                                    onChange={(e) => setResearchField(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="VD: Y tế công cộng, Kinh tế học..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" /> Đơn vị công tác
                                </label>
                                <input
                                    type="text"
                                    value={organization}
                                    onChange={(e) => setOrganization(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Tên trường ĐH, Viện..."
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    💡 <strong>Mẹo:</strong> Cập nhật đầy đủ thông tin học thuật giúp AI đưa ra các gợi ý và giải thích phù hợp hơn với chuyên ngành của bạn.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang lưu...</span>
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Lưu hồ sơ
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
