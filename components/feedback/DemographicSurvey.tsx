'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FeedbackService, DemographicData } from '@/lib/feedback-service';
import { CheckCircle2 } from 'lucide-react';

interface DemographicSurveyProps {
    isOpen: boolean;
    onComplete: () => void;
}

export function DemographicSurvey({ isOpen, onComplete }: DemographicSurveyProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<Partial<DemographicData>>({});

    // Questions configuration
    const questions = [
        {
            key: 'education',
            title: 'Câu 1: Trình độ học vấn cao nhất (hoặc cấp bậc đang theo học):',
            options: [
                'Đại học (Undergraduate)',
                "Thạc sĩ (Master's Degree)",
                'Nghiên cứu sinh (PhD Candidate)',
                'Tiến sĩ (Doctorate/PhD)'
            ]
        },
        {
            key: 'role',
            title: 'Câu 2: Vai trò hiện tại của bạn trong cộng đồng khoa học:',
            options: [
                'Sinh viên/Học viên (Student)',
                'Giảng viên/Giáo viên (Faculty/Academic Staff)',
                'Nhà nghiên cứu độc lập (Independent Researcher)',
                'Chuyên gia phân tích dữ liệu (Data Analyst)'
            ]
        },
        {
            key: 'experience',
            title: 'Câu 3: Thâm niên sử dụng các phần mềm phân tích thống kê (SPSS, AMOS, R, Stata...):',
            options: [
                'Dưới 1 năm (Sơ cấp)',
                '1 - 3 năm (Trung cấp)',
                'Trên 3 năm (Thành thạo/Chuyên gia)'
            ]
        },
        {
            key: 'publication',
            title: 'Câu 4: Kinh nghiệm công bố bài báo khoa học trên các tạp chí có phản biện (Peer-reviewed):',
            options: [
                'Chưa có công bố',
                'Đã có công bố trên tạp chí trong nước',
                'Đã có công bố trên tạp chí quốc tế (ISI/Scopus)'
            ]
        }
    ];

    const currentQuestion = questions[step - 1];
    const totalSteps = questions.length;

    const handleSelect = (value: string) => {
        const newData = { ...data, [currentQuestion.key]: value };
        setData(newData);

        // Auto advance after short delay
        setTimeout(() => {
            if (step < totalSteps) {
                setStep(step + 1);
            } else {
                // Submit
                handleSubmit(newData as DemographicData);
            }
        }, 250);
    };

    const handleSubmit = (finalData: DemographicData) => {
        FeedbackService.saveDemographics(finalData);
        onComplete();
    };

    if (!currentQuestion) return null;

    return (
        <Modal
            isOpen={isOpen}
            title="👋 Chào mừng bạn đến với ncsStat!"
            preventClose={true} // Mandatory first time
        >
            <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <p className="text-sm text-indigo-800">
                        <strong>PHẦN 1: THÔNG TIN NHÂN KHẨU HỌC VÀ NĂNG LỰC NGHIÊN CỨU</strong><br />
                        Giúp chúng tôi phân loại trình độ chuyên gia và tối ưu hóa trải nghiệm của bạn.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-medium uppercase tracking-wide">
                    <span>Câu hỏi {step}/{totalSteps}</span>
                    <span>{Math.round((step / totalSteps) * 100)}% hoàn thành</span>
                </div>

                {/* Question */}
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-lg font-bold text-gray-900 leading-snug">
                        {currentQuestion.title}
                    </h4>

                    <div className="grid gap-3">
                        {currentQuestion.options.map((option) => (
                            <button
                                key={option}
                                onClick={() => handleSelect(option)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group
                                    ${data[currentQuestion.key as keyof DemographicData] === option
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md'
                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                <span className="font-medium">{option}</span>
                                {data[currentQuestion.key as keyof DemographicData] === option && (
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 text-center">
                    <p className="text-xs text-gray-400">
                        Câu trả lời của bạn được bảo mật và chỉ dùng cho mục đích nghiên cứu cải thiện sản phẩm.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
