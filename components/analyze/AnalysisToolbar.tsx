'use client'

import { Eye, EyeOff, Trash2, FileText, Settings, Shield, Save, PlusCircle, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { WebRStatus } from '@/components/WebRStatus'

interface ToolbarProps {
    isPrivateMode: boolean
    setIsPrivateMode: (v: boolean) => void
    clearSession: () => void
    filename: string | null
    onSave: () => void
}

export default function AnalysisToolbar({
    isPrivateMode,
    setIsPrivateMode,
    clearSession,
    filename,
    onSave
}: ToolbarProps) {
    return (
        <div className="flex items-center gap-3 md:gap-6 overflow-x-auto no-scrollbar max-w-full">
            {/* File Info */}
            {filename ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium shrink-0 max-w-[100px] md:max-w-[200px]">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">{filename}</span>
                </div>
            ) : (
                <div className="text-slate-400 text-sm italic items-center gap-2 hidden lg:flex shrink-0">
                    <FileText className="w-4 h-4" />
                    <span className="hidden xl:inline">Chưa chọn dữ liệu</span>
                </div>
            )}

            <div className="h-6 w-px bg-slate-200 hidden lg:block shrink-0" />

            <WebRStatus />

            <div className="flex items-center gap-2 shrink-0">
                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />




                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />

                <button
                    onClick={onSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium transition-colors"
                >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Lưu dự án</span>
                </button>

                <button
                    onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn xóa dữ liệu hiện tại để bắt đầu phân tích mới?')) {
                            clearSession();
                        }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
                    title="Bắt đầu phân tích mới"
                >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Phân tích mới</span>
                </button>
            </div>
        </div>
    )
}
