'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FeedbackService, ApplicabilityData } from '@/lib/feedback-service';
import { FileText, Save, Clock, ShieldCheck } from 'lucide-react';

interface ApplicabilitySurveyProps {
    isOpen: boolean;
    onComplete: () => void;
    onCancel: () => void;
}

export function ApplicabilitySurvey({ isOpen, onComplete, onCancel }: ApplicabilitySurveyProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<Partial<ApplicabilityData>>({});
    const [openAnswer, setOpenAnswer] = useState('');

    const questions = [
        // Q8
        {
            key: 'manuscriptUtility',
            title: 'Câu 8: Mức độ hỗ trợ của đoạn giải thích đối với việc soạn thảo bản thảo nghiên cứu (Manuscript)?',
            icon: <FileText className="w-8 h-8 text-blue-500 mb-3" />,
            options: [
                'Có thể sử dụng trực tiếp hoặc chỉ cần biên tập nhẹ',
                'Chỉ có giá trị tham khảo định hướng',
                'Không có giá trị sử dụng thực tế'
            ]
        },
        // Q9
        {
            key: 'timeSavings',
            title: 'Câu 9: Việc sử dụng ncsStat (Zero-install) giúp tối ưu hóa bao nhiêu % thời gian so với quy trình truyền thống?',
            icon: <Clock className="w-8 h-8 text-green-500 mb-3" />,
            options: [
                'Tiết kiệm dưới 30% thời gian',
                'Tiết kiệm từ 30% - 70% thời gian',
                'Tiết kiệm trên 70% thời gian'
            ]
        },
        // Q10
        {
            key: 'dataSovereignty',
            title: 'Câu 10: Đánh giá về cơ chế "Dữ liệu không rời khỏi trình duyệt" (Local-first) đối với tính liêm chính dữ liệu?',
            icon: <ShieldCheck className="w-8 h-8 text-purple-500 mb-3" />,
            options: [
                'Rất thiết thực và cần thiết cho các nghiên cứu nhạy cảm',
                'Có giá trị nhưng không phải yếu tố quyết định',
                'Không ảnh hưởng đến lựa chọn công cụ của tôi'
            ]
        },
        // Q11 - Open ended
        {
            key: 'openFeedback',
            title: 'Câu 11: Ý kiến đóng góp chuyên môn nhằm hoàn thiện thuật toán giải thích ngữ nghĩa:',
            isText: true
        }
    ];

    const currentQ = questions[step - 1];
    const totalSteps = questions.length;

    const handleNext = (val: string) => {
        const newData = { ...data, [currentQ.key]: val };
        setData(newData);

        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleSubmit(newData as ApplicabilityData);
        }
    };

    const handleSubmit = (finalData: ApplicabilityData) => {
        FeedbackService.saveApplicability(finalData);
        onComplete();
    };

    if (!currentQ) return null;

    return (
        <Modal
            isOpen={isOpen}
            title="Khảo sát Ứng dụng & Đạo đức Dữ liệu"
            onClose={onCancel}
        >
            <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800">
                        <strong>PHẦN 3: ĐÁNH GIÁ TÍNH ỨNG DỤNG</strong><br />
                        Hoàn thành khảo sát ngắn này để mở khóa tính năng Xuất PDF.
                    </p>
                </div>

                {/* Progress */}
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="py-2 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="flex flex-col items-center text-center mb-6">
                        {currentQ.icon && currentQ.icon}
                        <h4 className="text-lg font-bold text-gray-900 leading-snug max-w-md">
                            {currentQ.title}
                        </h4>
                    </div>

                    {!currentQ.isText ? (
                        <div className="grid gap-3">
                            {currentQ.options?.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => handleNext(opt)}
                                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow transition-all text-gray-700 font-medium"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <textarea
                                value={openAnswer}
                                onChange={(e) => setOpenAnswer(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                                placeholder="Nhập ý kiến của bạn (hoặc bỏ qua)..."
                            />
                            <button
                                onClick={() => handleNext(openAnswer || 'No answer')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Hoàn tất & Xuất PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
