'use client'

import { useEffect, useState } from 'react'
import { Smartphone, Monitor, AlertTriangle, X } from 'lucide-react'

interface MobileWebRFallbackProps {
    error?: string
    onDismiss?: () => void
}

export function MobileWebRFallback({ error, onDismiss }: MobileWebRFallbackProps) {
    const [isMobile, setIsMobile] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        // Detect mobile browser
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
        setIsMobile(mobileRegex.test(userAgent.toLowerCase()))
    }, [])

    if (dismissed || !error) return null

    const handleDismiss = () => {
        setDismissed(true)
        onDismiss?.()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Không thể khởi động R Engine</h3>
                            <p className="text-white/80 text-sm">Trình duyệt của bạn chưa hỗ trợ đầy đủ</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {isMobile ? (
                        <>
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-amber-900 font-medium">Bạn đang dùng thiết bị di động</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        WebR sử dụng công nghệ nâng cao (SharedArrayBuffer) có thể không hoạt động trên một số trình duyệt mobile.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <Monitor className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-900 font-medium">💡 Khuyến nghị</p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Để có trải nghiệm tốt nhất, vui lòng sử dụng <strong>Chrome, Firefox, hoặc Safari</strong> trên <strong>máy tính/laptop</strong>.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-red-900 font-medium">Lỗi khởi tạo WebR</p>
                                <p className="text-xs text-red-700 mt-1 font-mono break-all">
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors text-sm"
                        >
                            Thử lại
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors text-sm"
                        >
                            Đã hiểu
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t text-center">
                    <p className="text-xs text-slate-500">
                        Nếu bạn đang dùng Chrome/Firefox trên máy tính mà vẫn gặp lỗi, vui lòng liên hệ hỗ trợ.
                    </p>
                </div>
            </div>
        </div>
    )
}

// Utility hook to detect if SharedArrayBuffer is available
export function useSharedArrayBufferSupport(): { supported: boolean; checked: boolean } {
    const [state, setState] = useState({ supported: false, checked: false })

    useEffect(() => {
        try {
            const supported = typeof SharedArrayBuffer !== 'undefined'
            setState({ supported, checked: true })
        } catch {
            setState({ supported: false, checked: true })
        }
    }, [])

    return state
}
