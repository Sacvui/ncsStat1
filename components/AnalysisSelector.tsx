import React from 'react';
import { BarChart2, Shield, Network, Users, GitCompare, Layers, TrendingUp, Grid3x3, Activity } from 'lucide-react';

interface AnalysisSelectorProps {
    onSelect: (step: string) => void;
    onRunAnalysis: (type: string) => void;
    isAnalyzing: boolean;
}

export function AnalysisSelector({ onSelect, onRunAnalysis, isAnalyzing }: AnalysisSelectorProps) {
    const options = [
        { id: 'descriptive', title: 'Thống kê mô tả', desc: 'Mean, SD, Min, Max, Median', icon: BarChart2, action: 'run', colors: 'hover:border-indigo-500 hover:bg-indigo-50/30' },
        { id: 'cronbach-select', title: "Cronbach's Alpha", desc: 'Kiểm tra độ tin cậy thang đo', icon: Shield, action: 'select', colors: 'hover:border-blue-500 hover:bg-blue-50/30' },
        { id: 'correlation', title: 'Ma trận tương quan', desc: 'Phân tích mối quan hệ giữa các biến', icon: Network, action: 'run', colors: 'hover:border-purple-500 hover:bg-purple-50/30' },
        { id: 'ttest-select', title: 'Independent T-test', desc: 'So sánh 2 nhóm độc lập', icon: GitCompare, action: 'select', colors: 'hover:border-green-500 hover:bg-green-50/30' },
        { id: 'ttest-paired-select', title: 'Paired T-test', desc: 'So sánh trước-sau (cặp đôi)', icon: Users, action: 'select', colors: 'hover:border-emerald-500 hover:bg-emerald-50/30' },
        { id: 'anova-select', title: 'ANOVA', desc: 'So sánh trung bình nhiều nhóm', icon: Layers, action: 'select', colors: 'hover:border-violet-500 hover:bg-violet-50/30' },
        { id: 'efa-select', title: 'EFA', desc: 'Phân tích nhân tố khám phá', icon: Grid3x3, action: 'select', colors: 'hover:border-orange-500 hover:bg-orange-50/30' },
        { id: 'regression-select', title: 'Hồi quy Tuyến tính', desc: 'Multiple Linear Regression', icon: TrendingUp, action: 'select', colors: 'hover:border-pink-500 hover:bg-pink-50/30' },
        { id: 'chisq-select', title: 'Chi-Square Test', desc: 'Kiểm định độc lập (Biến định danh)', icon: Grid3x3, action: 'select', colors: 'hover:border-teal-500 hover:bg-teal-50/30' },
        { id: 'mannwhitney-select', title: 'Mann-Whitney U', desc: 'So sánh 2 nhóm (Phi tham số)', icon: Activity, action: 'select', colors: 'hover:border-cyan-500 hover:bg-cyan-50/30' },
        { id: 'cfa-select', title: 'CFA', desc: 'Phân tích nhân tố khẳng định', icon: Network, action: 'select', colors: 'hover:border-rose-500 hover:bg-rose-50/30' },
        { id: 'sem-select', title: 'SEM', desc: 'Mô hình cấu trúc tuyến tính', icon: Layers, action: 'select', colors: 'hover:border-fuchsia-500 hover:bg-fuchsia-50/30' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {options.map((opt) => {
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.id}
                        onClick={() => opt.action === 'run' ? onRunAnalysis(opt.id) : onSelect(opt.id)}
                        disabled={isAnalyzing}
                        className={`group p-6 bg-white rounded-xl border-2 border-slate-200 ${opt.colors} hover:shadow-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:scale-110 transition-transform">
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">
                            {opt.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                            {opt.desc}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}
