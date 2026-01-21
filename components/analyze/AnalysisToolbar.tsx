'use client'

import { Eye, EyeOff, Trash2, FileText, Settings, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { WebRStatus } from '@/components/WebRStatus'
import { AISettings } from '@/components/VariableSelector'

interface ToolbarProps {
    isPrivateMode: boolean
    setIsPrivateMode: (v: boolean) => void
    clearSession: () => void
    filename: string | null
}

export default function AnalysisToolbar({
    isPrivateMode,
    setIsPrivateMode,
    clearSession,
    filename
}: ToolbarProps) {
    return (
        <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-40">
            <div className="container mx-auto px-6 h-14 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">

                {/* Left: File Info */}
                <div className="flex items-center gap-4 shrink-0">
                    {filename ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="truncate max-w-[200px]">{filename}</span>
                        </div>
                    ) : (
                        <div className="text-slate-400 text-sm italic flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Chưa chọn dữ liệu
                        </div>
                    )}

                    <div className="h-6 w-px bg-slate-200 mx-2" />

                    <WebRStatus />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 mr-2">
                        <button
                            onClick={() => setIsPrivateMode(!isPrivateMode)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                                ${isPrivateMode
                                    ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }
                            `}
                            title={isPrivateMode ? "Chế độ riêng tư: Đã bật" : "Chế độ riêng tư: Đã tắt"}
                        >
                            {isPrivateMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{isPrivateMode ? 'Riêng tư' : 'Lưu session'}</span>
                        </button>
                    </div>

                    <AISettings />

                    <div className="h-6 w-px bg-slate-200 mx-2" />

                    <button
                        onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu phiên làm việc?')) {
                                clearSession();
                            }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa phiên làm việc"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Security Banner embedded in Toolbar bottom or separate? 
                User complained about height. Let's make it very subtle or remove if Toolbar implies it.
                We'll keep the banner but make it smaller or seamlessly attached.
            */}
        </div>
    )
}
