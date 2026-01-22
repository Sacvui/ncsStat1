'use client';

import React, { useEffect, useState } from 'react';
import {
    Database,
    FileSpreadsheet,
    BarChart3,
    BrainCircuit,
    CheckCircle2,
    ArrowRight,
    PieChart
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function ProjectFlowAnimation() {
    // Animation steps:
    // 0: Upload Data
    // 1: Select Variables
    // 2: Run Analysis (Processing)
    // 3: Scientific Results
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 3000); // Change every 3 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full flex flex-col justify-center items-center p-10 overflow-hidden bg-gradient-to-br from-indigo-900 to-blue-900 text-white">
            {/* Background Abstract Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="z-10 w-full max-w-lg space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-white/90">
                        Quy Trình Phân Tích Chuẩn Khoa Học
                    </h2>
                    <p className="text-blue-200">
                        Từ dữ liệu thô đến kết luận tin cậy chỉ trong vài giây.
                    </p>
                </div>

                {/* Workflow Steps Visualization */}
                <div className="relative">
                    {/* Connecting Line */}
                    <div className="absolute left-[28px] top-0 bottom-0 w-0.5 bg-blue-800/50 -z-10"></div>

                    {/* Step 1: Data Upload */}
                    <FlowStep
                        active={step === 0}
                        completed={step > 0}
                        icon={<FileSpreadsheet className="w-6 h-6" />}
                        title="Dữ Liệu Thô (CSV/Excel)"
                        description="Hỗ trợ các định dạng phổ biến, tự động làm sạch dữ liệu."
                    />

                    {/* Step 2: Config */}
                    <FlowStep
                        active={step === 1}
                        completed={step > 1}
                        icon={<Database className="w-6 h-6" />}
                        title="Cấu Hình Phân Tích"
                        description="Chọn biến, mô hình hồi quy, kiểm định giả thuyết."
                    />

                    {/* Step 3: Analysis */}
                    <FlowStep
                        active={step === 2}
                        completed={step > 2}
                        icon={<BrainCircuit className="w-6 h-6" />}
                        title="Xử Lý Thống Kê"
                        description="Chạy R-WASM engine, tính toán VIF, p-value, Cronbach's Alpha..."
                    />

                    {/* Step 4: Results */}
                    <FlowStep
                        active={step === 3}
                        completed={step > 3} // Loop back, so never truly "completed" in cycle visuals loop context usually, but for linear logic it works
                        isLast
                        icon={<BarChart3 className="w-6 h-6" />}
                        title="Kết Quả Chuyên Sâu"
                        description="Bảng chuẩn APA, biểu đồ tương tác, tự động phân giải kết quả."
                    />
                </div>

                {/* Live Card Simulation (appears on Step 3) */}
                <div className={`mt-8 transition-all duration-700 transform ${step === 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}>
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white p-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                            <span className="text-sm font-bold text-green-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Phân Tích Hoàn Tất
                            </span>
                            <span className="text-xs text-white/60">ncsStat Engine v1.0</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">Mô hình:</span>
                                <span className="font-mono text-white">Linear Regression</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">R-Squared:</span>
                                <span className="font-mono text-green-300 font-bold">0.875 (Tốt)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">P-Value:</span>
                                <span className="font-mono text-green-300 font-bold text-xs">&lt; 0.001 ***</span>
                            </div>
                            {/* Fake Chart Bars */}
                            <div className="flex items-end gap-2 h-16 pt-2 border-t border-white/10 mt-2">
                                <div className="w-1/6 bg-blue-400/50 rounded-t h-[40%]" style={{ animation: step === 3 ? 'grow 0.5s ease-out' : 'none' }}></div>
                                <div className="w-1/6 bg-blue-400/60 rounded-t h-[70%]" style={{ animation: step === 3 ? 'grow 0.5s ease-out 0.1s' : 'none' }}></div>
                                <div className="w-1/6 bg-blue-400/70 rounded-t h-[50%]" style={{ animation: step === 3 ? 'grow 0.5s ease-out 0.2s' : 'none' }}></div>
                                <div className="w-1/6 bg-blue-400/80 rounded-t h-[90%]" style={{ animation: step === 3 ? 'grow 0.5s ease-out 0.3s' : 'none' }}></div>
                                <div className="w-1/6 bg-green-400/90 rounded-t h-[100%]" style={{ animation: step === 3 ? 'grow 0.5s ease-out 0.4s' : 'none' }}></div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function FlowStep({ active, completed, display, icon, title, description, isLast }: any) {
    return (
        <div className={`relative flex items-start gap-4 mb-8 ${isLast ? 'mb-0' : ''}`}>
            {/* Dot/Icon Circle */}
            <div
                className={`
                    flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10
                    ${active
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110'
                        : completed
                            ? 'bg-indigo-900 border-indigo-700 text-indigo-300'
                            : 'bg-indigo-950/50 border-indigo-900 text-indigo-700'
                    }
                `}
            >
                {icon}
            </div>

            {/* Content */}
            <div className={`pt-1 transition-all duration-500 ${active ? 'opacity-100 translate-x-0' : 'opacity-60 translate-x-0'}`}>
                <h3 className={`font-bold text-lg mb-1 ${active ? 'text-white' : 'text-indigo-200'}`}>
                    {title}
                </h3>
                <p className="text-sm text-indigo-300/80 leading-snug max-w-xs block">
                    {description}
                </p>
            </div>

            {/* Active Indicator Arrow */}
            {active && (
                <div className="absolute -left-8 top-5 text-blue-400 animate-bounce">
                    <ArrowRight className="w-5 h-5" />
                </div>
            )}
        </div>
    );
}
