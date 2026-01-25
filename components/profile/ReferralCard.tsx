'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Share2, Facebook } from 'lucide-react'
import { getOrCreateReferralCode } from '@/lib/referral'

export default function ReferralCard({ referralCode: initialCode, userId }: { referralCode: string | null | undefined, userId?: string }) {
    const [copied, setCopied] = useState(false)
    const [code, setCode] = useState(initialCode || '')
    const [isLoading, setIsLoading] = useState(!initialCode && !!userId)

    // Load or create referral code if not provided
    useEffect(() => {
        if (!initialCode && userId) {
            setIsLoading(true)
            getOrCreateReferralCode(userId).then(newCode => {
                setCode(newCode)
                setIsLoading(false)
            }).catch(() => setIsLoading(false))
        } else if (initialCode) {
            setCode(initialCode)
        }
    }, [initialCode, userId])

    // Base URL from env or fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ncsstat1.ncskit.org'
    const referralLink = `${baseUrl}?ref=${code}`

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const shareSocial = (platform: 'facebook' | 'zalo') => {
        const encodedUrl = encodeURIComponent(referralLink)
        let shareUrl = ''
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
                break
            case 'zalo':
                copyToClipboard()
                alert('Đã sao chép link! Bạn có thể dán vào Zalo để chia sẻ.')
                return
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400')
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Share2 className="w-5 h-5 opacity-80" />
                    Giới thiệu bạn bè
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                    Nhận thêm lượt phân tích miễn phí khi mời bạn bè!
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Visual Code */}
                <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mã của bạn</p>
                    <div className="text-3xl font-mono font-bold text-slate-800 tracking-wider bg-slate-50 py-3 rounded-xl border border-slate-100 dashed-border">
                        {code}
                    </div>
                </div>

                {/* Link Input & Copy */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Link giới thiệu (Full)</label>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={referralLink}
                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 text-sm px-4 py-2.5 rounded-xl focus:outline-none font-mono"
                        />
                        <button
                            onClick={copyToClipboard}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm
                                ${copied
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm'
                                }
                            `}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Đã chép' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Social Share Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => shareSocial('facebook')}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 rounded-xl font-medium transition-colors text-sm"
                    >
                        <Facebook className="w-4 h-4" />
                        Facebook
                    </button>
                    <button
                        onClick={() => shareSocial('zalo')}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0068FF]/10 text-[#0068FF] hover:bg-[#0068FF]/20 rounded-xl font-medium transition-colors text-sm"
                    >
                        <span className="font-bold">Zalo</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
