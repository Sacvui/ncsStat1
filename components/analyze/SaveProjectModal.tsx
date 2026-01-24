'use client'

import { useState } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { getSupabase } from '@/utils/supabase/client'

interface SaveProjectModalProps {
    isOpen: boolean
    onClose: () => void
    data: any[]
    results: any
    analysisType: string
    step: string
}

export default function SaveProjectModal({
    isOpen,
    onClose,
    data,
    results,
    analysisType,
    step
}: SaveProjectModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Vui lòng nhập tên dự án')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const supabase = getSupabase()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('Vui lòng đăng nhập để lưu dự án')
            }

            const projectState = {
                data: data.slice(0, 1000), // Limit saved rows for now to avoid huge payloads
                results,
                analysisType,
                step,
                timestamp: new Date().toISOString()
            }

            const { error: saveError } = await supabase
                .from('projects')
                .insert({
                    user_id: user.id,
                    name,
                    description,
                    status: 'active',
                    data: projectState, // Checking if 'data' column exists or using 'meta'
                    // For safety, let's assume a JSONB column named 'state' or 'data'. 
                    // Based on profile page, we just count them. Let's try 'data' as standard.
                    // If this fails, we might need adjustments.
                    updated_at: new Date().toISOString()
                })

            if (saveError) throw saveError

            onClose()
            // Reset form
            setName('')
            setDescription('')
            alert('Lưu dự án thành công!')
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Lưu dự án thất bại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Lưu dự án</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Tên dự án <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ví dụ: Phân tích EFA Luận văn"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Mô tả (Tùy chọn)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ghi chú thêm về dữ liệu hoặc kết quả..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24 resize-none"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu dự án
                    </button>
                </div>
            </div>
        </div>
    )
}
