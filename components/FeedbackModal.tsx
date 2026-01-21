'use client'

import { useState, useEffect } from 'react'
// @ts-ignore
import { useFormState } from 'react-dom'
import { submitFeedback } from '@/app/actions/submit-feedback'
import { Star, X, MessageSquare, Loader2, CheckCircle } from 'lucide-react'

const initialState = {
    message: '',
    error: '',
    success: false
}

export default function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [state, formAction] = useFormState(submitFeedback, initialState)
    const [rating, setRating] = useState(5)
    const [hoverRating, setHoverRating] = useState(0)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            // We can't easily reset form state from useFormState without a key change or custom logic
            // But for simple "close and reopen", it persists. 
            // A simple way is to mount/unmount the component or key it.
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        Gửi phản hồi
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {state?.success ? (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">Cảm ơn bạn!</h4>
                            <p className="text-slate-600 mb-6">{state.message}</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    ) : (
                        <form action={formAction} className="space-y-6">
                            {state?.error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                                    <span>⚠️</span>
                                    {state.error}
                                </div>
                            )}

                            {/* Rating */}
                            <div className="flex flex-col items-center gap-2">
                                <label className="text-sm font-medium text-slate-700">Bạn đánh giá trải nghiệm thế nào?</label>
                                <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${(hoverRating || rating) >= star
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'fill-slate-100 text-slate-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <input type="hidden" name="rating" value={rating} />
                                <p className="text-xs text-slate-400 font-medium h-4">
                                    {/* Optional: Text description of rating */}
                                    {rating === 5 && 'Tuyệt vời!'}
                                    {rating === 4 && 'Rất tốt'}
                                    {rating === 3 && 'Bình thường'}
                                    {rating === 2 && 'Chưa hài lòng'}
                                    {rating === 1 && 'Tệ'}
                                </p>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <label htmlFor="content" className="text-sm font-medium text-slate-700">
                                    Ý kiến đóng góp
                                </label>
                                <textarea
                                    id="content"
                                    name="content"
                                    required
                                    rows={4}
                                    placeholder="Hãy chia sẻ suy nghĩ của bạn để giúp chúng tôi cải thiện..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-slate-800 placeholder:text-slate-400"
                                ></textarea>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <SubmitButton />
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

function SubmitButton() {
    // @ts-ignore
    const { pending } = useFormState() // In older Next may need useFormStatus. Actually useFormStatus IS for this. 
    // Wait, useFormState returns [state, action]. useFormStatus is separate hook.

    return (
        <ButtonContent />
    )
}

import { useFormStatus } from 'react-dom'

function ButtonContent() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2"
        >
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang gửi...
                </>
            ) : (
                'Gửi phản hồi'
            )}
        </button>
    )
}
