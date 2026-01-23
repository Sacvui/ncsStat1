"use client";

import { useState } from 'react';
import {
    BarChart3,
    Sparkles,
    Shield,
    Zap,
    Layers,
    Activity,
    Network,
    TrendingUp,
    Grid3x3,
    ChevronDown,
    ArrowRight,
    BookOpen
} from 'lucide-react';

const methods = [
    {
        id: 'descriptive',
        name: 'Thống Kê Mô Tả',
        desc: 'Tóm tắt đặc điểm dữ liệu (Mean, SD, Skewness...)',
        icon: BarChart3,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        content: (
            <div className="space-y-4 text-slate-600">
                <p><strong>Mục đích:</strong> Tóm tắt các đặc điểm cơ bản của dữ liệu như Trung bình, Trung vị, Độ lệch chuẩn, Min, Max, Skewness, Kurtosis.</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-2">Cách thực hiện:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-sm">
                        <li>Chọn menu <span className="font-medium text-indigo-600">Descriptive</span>.</li>
                        <li>Chọn các biến định lượng cần tính toán.</li>
                        <li>Nhấn nút <strong>Chạy Phân Tích</strong>.</li>
                    </ol>
                </div>
            </div>
        )
    },
    {
        id: 'cronbach',
        name: "Cronbach's Alpha",
        desc: 'Kiểm định độ tin cậy thang đo',
        icon: Shield,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        content: (
            <div className="space-y-4 text-slate-600">
                <p><strong>Mục đích:</strong> Đánh giá mức độ chặt chẽ mà các các mục hỏi (items) trong thang đo tương quan với nhau (Internal Consistency).</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-2">Cách thực hiện:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-sm">
                        <li>Chọn menu <span className="font-medium text-indigo-600">Cronbach's Alpha</span>.</li>
                        <li>Chọn tất cả các biến quan sát thuộc cùng một nhân tố (Ví dụ: DL1, DL2, DL3).</li>
                        <li>Nhấn nút <strong>Chạy Phân Tích</strong>.</li>
                    </ol>
                </div>
                <p className="text-sm italic text-slate-500">Kết quả sẽ hiển thị hệ số Cronbach's Alpha tổng và bảng Cronbach's Alpha if Item Deleted giúp bạn loại biến rác.</p>
            </div>
        )
    },
    {
        id: 'efa',
        name: 'EFA (Khám phá)',
        desc: 'Phân tích nhân tố khám phá',
        icon: Layers,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        content: (
            <div className="space-y-4 text-slate-600">
                <p><strong>Mục đích:</strong> Rút gọn một tập hợp nhiều biến quan sát thành một số ít các nhân tố có ý nghĩa.</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-2">Cách thực hiện:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-sm">
                        <li>Chọn menu <span className="font-medium text-indigo-600">EFA</span>.</li>
                        <li>Chọn tất cả các biến quan sát trong mô hình.</li>
                        <li>Điều chỉnh (nếu cần): Số nhân tố (Auto), Phép quay (Promax/Varimax).</li>
                        <li>Nhấn nút <strong>Chạy EFA</strong>.</li>
                    </ol>
                </div>
            </div>
        )
    },
    {
        id: 'ttest',
        name: 'T-Test',
        desc: 'So sánh trung bình 2 nhóm',
        icon: Zap,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        content: (
            <div className="space-y-4 text-slate-600">
                <p><strong>Mục đích:</strong> So sánh xem có sự khác biệt có ý nghĩa thống kê về giá trị trung bình giữa hai nhóm độc lập hay không.</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-2">Cách thực hiện:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-sm">
                        <li>Chọn menu <span className="font-medium text-indigo-600">T-Test</span>.</li>
                        <li><strong>Bước 1:</strong> Chọn biến phân nhóm (Ví dụ: GioiTinh).</li>
                        <li><strong>Bước 2:</strong> Chọn biến cần so sánh (Ví dụ: ThuNhap).</li>
                        <li>Nhấn nút <strong>Chạy T-Test</strong>.</li>
                    </ol>
                </div>
            </div>
        )
    },
    {
        id: 'anova',
        name: 'ANOVA',
        desc: 'So sánh 3 nhóm trở lên',
        icon: Grid3x3, // Using generic grid icon for grouping
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        content: (
            <div className="space-y-4 text-slate-600">
                <p><strong>Mục đích:</strong> Kiểm định sự khác biệt về trung bình giữa 3 nhóm trở lên (One-Way ANOVA).</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-2">Cách thực hiện:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-sm">
                        <li>Chọn menu <span className="font-medium text-indigo-600">ANOVA</span>.</li>
                        <li>Chọn biến phân nhóm (Factor) có từ 3 giá trị trở lên (Ví dụ: HocVan).</li>
                        <li>Chọn biến phụ thuộc (Dependent).</li>
                        <li>Nhấn nút <strong>Chạy ANOVA</strong>.</li>
                    </ol>
                </div>
            </div>
        )
    },
    {
        id: 'correlation',
        name: 'Tương Quan',
        desc: 'Pearson Correlation',
        icon: Network,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        content: (
            <div className="space-y-4 text-slate-600">
                <p><strong>Mục đích:</strong> Đánh giá mối quan hệ tuyến tính giữa hai biến định lượng.</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-2">Cách thực hiện:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-sm">
                        <li>Chọn menu <span className="font-medium text-indigo-600">Correlation</span>.</li>
                        <li>Chọn các biến cần xem xét tương quan.</li>
                        <li>Nhấn nút <strong>Chạy Phân Tích</strong>.</li>
                    </ol>
                </div>
            </div>
        )
    },
    {
        id: 'regression',
        name: 'Hồi Quy',
        desc: 'Linear Regression',
        icon: TrendingUp,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        content: (
            <div className="space-y-4 text-slate-600">
                <p><strong>Mục đích:</strong> Đánh giá tác động của một hoặc nhiều biến độc lập lên một biến phụ thuộc.</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-2">Cách thực hiện:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-sm">
                        <li>Chọn menu <span className="font-medium text-indigo-600">Regression</span>.</li>
                        <li>Chọn biến phụ thuộc (Y).</li>
                        <li>Chọn các biến độc lập (X).</li>
                        <li>Nhấn nút <strong>Chạy Hồi Quy</strong>.</li>
                    </ol>
                </div>
                <p className="text-sm italic text-slate-500">Hệ thống sẽ tự động tính toán R-bình phương, hệ số Beta và kiểm tra đa cộng tuyến (VIF).</p>
            </div>
        )
    },
    {
        id: 'chisq',
        name: 'Chi-Square',
        desc: 'Kiểm định biến định danh',
        icon: Activity, // Reuse generic
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        content: (
            <div className="space-y-4 text-slate-600">
                <p><strong>Mục đích:</strong> Kiểm tra mối liên hệ giữa hai biến định danh (Categorical Variables).</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-2">Cách thực hiện:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-sm">
                        <li>Chọn menu <span className="font-medium text-indigo-600">Chi-Square</span>.</li>
                        <li>Chọn biến Hàng (Row Variable) và biến Cột (Column Variable).</li>
                        <li>Nhấn nút <strong>Chạy Kiểm Định</strong>.</li>
                    </ol>
                </div>
            </div>
        )
    },
    {
        id: 'mannwhitney',
        name: 'Mann-Whitney U',
        desc: 'Kiểm định phi tham số',
        icon: Sparkles,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        content: (
            <div className="space-y-4 text-slate-600">
                <p><strong>Mục đích:</strong> So sánh trung bình hạng của 2 nhóm khi dữ liệu không phân phối chuẩn (Thay thế cho T-Test).</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-2">Cách thực hiện:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-sm">
                        <li>Chọn menu <span className="font-medium text-indigo-600">Mann-Whitney U</span>.</li>
                        <li>Chọn 2 biến số cần so sánh (hoặc 2 nhóm dữ liệu).</li>
                        <li>Nhấn nút <strong>Chạy Kiểm Định</strong>.</li>
                    </ol>
                </div>
            </div>
        )
    }
];

export default function MethodsGuide() {
    const [activeId, setActiveId] = useState<string | null>('descriptive');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar List */}
            <div className="lg:col-span-4 flex flex-col gap-2">
                {methods.map((method) => (
                    <button
                        key={method.id}
                        onClick={() => setActiveId(method.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${activeId === method.id
                                ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200'
                                : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        <div className={`w-10 h-10 ${method.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <method.icon className={`w-5 h-5 ${method.color}`} />
                        </div>
                        <div>
                            <div className={`font-semibold ${activeId === method.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {method.name}
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-1">{method.desc}</div>
                        </div>
                        {activeId === method.id && (
                            <ArrowRight className="w-4 h-4 text-indigo-400 ml-auto" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[500px]">
                    {activeId ? (
                        (() => {
                            const method = methods.find(m => m.id === activeId);
                            if (!method) return null;
                            return (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                        <div className={`w-14 h-14 ${method.bg} rounded-2xl flex items-center justify-center`}>
                                            <method.icon className={`w-7 h-7 ${method.color}`} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">{method.name}</h2>
                                            <p className="text-slate-500">{method.desc}</p>
                                        </div>
                                    </div>

                                    <div className="prose prose-slate max-w-none">
                                        {method.content}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                        <a href="/analyze" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm">
                                            <Zap className="w-4 h-4" />
                                            Thực hiện ngay
                                        </a>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                            <p>Chọn một phương pháp để xem hướng dẫn chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
