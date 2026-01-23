'use client';
import React, { useState, useEffect } from 'react';
import { FeedbackService, AIFeedbackData } from '@/lib/feedback-service';
import { Star, MessageSquarePlus, Check, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface AIInterpretationFeedbackProps {
    analysisType: string;
    onClose?: () => void;
}

export function AIInterpretationFeedback({ analysisType, onClose }: AIInterpretationFeedbackProps) {
    const [submitted, setSubmitted] = useState(false);
    const [hasAlreadyGivenFeedback, setHasAlreadyGivenFeedback] = useState(false);
    const [data, setData] = useState<Partial<AIFeedbackData>>({});

    // Check if user has already given feedback (for suppression)
    useEffect(() => {
        if (FeedbackService.hasGivenAIFeedback()) {
            setHasAlreadyGivenFeedback(true);
        }
    }, []);

    // Don't render if user has already given feedback
    if (hasAlreadyGivenFeedback) {
        return null;
    }


    const handleSubmit = () => {
        if (!data.accuracy || !data.formatting || !data.statisticalSignificance) {
            alert("Vui lòng trả lời đầy đủ 3 câu hỏi đánh giá.");
            return;
        }

        FeedbackService.saveAIFeedback({
            ...data as AIFeedbackData,
            testType: analysisType
        });
        setSubmitted(true);
        if (onClose) setTimeout(onClose, 2000);
    };

    if (submitted) {
        return (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-green-100 p-2 rounded-full">
                    <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h4 className="font-bold text-green-800 text-sm">Cảm ơn đánh giá của bạn!</h4>
                    <p className="text-green-600 text-xs">Phản hồi của bạn giúp AI ngày càng thông minh hơn.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                    <MessageSquarePlus className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                        PHẦN 2: ĐÁNH GIÁ ĐỘ TIN CẬY
                    </h3>
                </div>

                <div className="space-y-6">
                    {/* Q5: Accuracy */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Câu 5: Dựa trên kết quả thực tế, độ chính xác của đoạn giải thích trên đạt bao nhiêu %?
                        </label>
                        <div className="space-y-2">
                            {[
                                { val: '100%', label: '100% (Hoàn toàn khớp)' },
                                { val: '80-95%', label: '80% - 95% (Chính xác trọng yếu, cần tinh chỉnh nhỏ)' },
                                { val: '50-79%', label: '50% - 79% (Lỗi logic hoặc nhầm lẫn chỉ số)' },
                                { val: '<50%', label: 'Dưới 50% (Ảo giác AI - Hallucination)' }
                            ].map((opt) => (
                                <label key={opt.val} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all cursor-pointer">
                                    <input
                                        type="radio"
                                        name="accuracy"
                                        className="w-4 h-4 text-indigo-600"
                                        checked={data.accuracy === opt.val}
                                        onChange={() => setData({ ...data, accuracy: opt.val })}
                                    />
                                    <span className="text-sm text-gray-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Q6: Formatting (Likert 1-5) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Câu 6: Đánh giá tính chuẩn xác đối với quy tắc báo cáo khoa học (ví dụ: chuẩn APA)?
                        </label>
                        <div className="flex justify-between items-center max-w-sm px-2">
                            {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                    key={score}
                                    onClick={() => setData({ ...data, formatting: score })}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                                        ${data.formatting === score
                                            ? 'bg-indigo-600 text-white shadow-lg scale-110'
                                            : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                                        }`}
                                >
                                    {score}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between max-w-sm px-2 mt-1 text-[10px] text-gray-500 uppercase font-medium">
                            <span>Không chuẩn</span>
                            <span>Hoàn toàn chuẩn</span>
                        </div>
                    </div>

                    {/* Q7: Statistical Significance Check */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Câu 7: (Kiểm tra) Kết quả phân tích vừa rồi có ý nghĩa thống kê không?
                        </label>
                        <div className="space-y-2">
                            {[
                                { val: 'significant', label: 'Có ý nghĩa thống kê (p < 0.05)' },
                                { val: 'not_significant', label: 'Không có ý nghĩa thống kê (p >= 0.05)' },
                                { val: 'inconclusive', label: 'Kết quả mâu thuẫn / Không đủ dữ liệu' }
                            ].map((opt) => (
                                <label key={opt.val} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all cursor-pointer">
                                    <input
                                        type="radio"
                                        name="significance"
                                        className="w-4 h-4 text-indigo-600"
                                        checked={data.statisticalSignificance === opt.val}
                                        onChange={() => setData({ ...data, statisticalSignificance: opt.val })}
                                    />
                                    <span className="text-sm text-gray-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={!data.accuracy || !data.formatting || !data.statisticalSignificance}
                            className="bg-indigo-600 disabled:bg-gray-300 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Gửi đánh giá
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
