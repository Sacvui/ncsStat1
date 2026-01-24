import React, { useState } from 'react';
import { BarChart2, Shield, Network, Users, GitCompare, Layers, TrendingUp, Grid3x3, Activity, ChevronDown, ChevronRight, Star } from 'lucide-react';

interface AnalysisSelectorProps {
    onSelect: (step: string) => void;
    onRunAnalysis: (type: string) => void;
    isAnalyzing: boolean;
}

interface AnalysisOption {
    id: string;
    title: string;
    desc: string;
    icon: any;
    action: 'select' | 'run';
    recommended?: boolean;
}

interface AnalysisCategory {
    name: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    options: AnalysisOption[];
}

export function AnalysisSelector({ onSelect, onRunAnalysis, isAnalyzing }: AnalysisSelectorProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['reliability', 'comparison']);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const categories: { id: string; category: AnalysisCategory }[] = [
        {
            id: 'reliability',
            category: {
                name: 'Độ tin cậy & Mô tả',
                description: 'Thống kê cơ bản và kiểm tra thang đo',
                color: 'text-blue-700',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                options: [
                    { id: 'descriptive-select', title: 'Thống kê mô tả', desc: 'Mean, SD, Min, Max, Median', icon: BarChart2, action: 'select' },
                    { id: 'cronbach-select', title: "Cronbach's Alpha", desc: 'Kiểm tra độ tin cậy thang đo', icon: Shield, action: 'select', recommended: true },
                ]
            }
        },
        {
            id: 'comparison',
            category: {
                name: 'So sánh nhóm',
                description: 'So sánh trung bình giữa các nhóm',
                color: 'text-green-700',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                options: [
                    { id: 'ttest-select', title: 'Independent T-test', desc: 'So sánh 2 nhóm độc lập', icon: GitCompare, action: 'select' },
                    { id: 'ttest-paired-select', title: 'Paired T-test', desc: 'So sánh trước-sau (cặp đôi)', icon: Users, action: 'select' },
                    { id: 'anova-select', title: 'ANOVA', desc: 'So sánh trung bình nhiều nhóm', icon: Layers, action: 'select' },
                    { id: 'mannwhitney-select', title: 'Mann-Whitney U', desc: 'So sánh 2 nhóm (Phi tham số)', icon: Activity, action: 'select' },
                ]
            }
        },
        {
            id: 'relationship',
            category: {
                name: 'Tương quan & Hồi quy',
                description: 'Phân tích mối quan hệ giữa biến',
                color: 'text-purple-700',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                options: [
                    { id: 'correlation', title: 'Ma trận tương quan', desc: 'Phân tích mối quan hệ giữa các biến', icon: Network, action: 'run' },
                    { id: 'regression-select', title: 'Hồi quy Tuyến tính', desc: 'Multiple Linear Regression', icon: TrendingUp, action: 'select' },
                ]
            }
        },
        {
            id: 'factor',
            category: {
                name: 'Phân tích nhân tố',
                description: 'EFA, CFA, SEM cho mô hình đo lường',
                color: 'text-orange-700',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                options: [
                    { id: 'efa-select', title: 'EFA', desc: 'Phân tích nhân tố khám phá', icon: Grid3x3, action: 'select', recommended: true },
                    { id: 'cfa-select', title: 'CFA', desc: 'Phân tích nhân tố khẳng định', icon: Network, action: 'select' },
                    { id: 'sem-select', title: 'SEM', desc: 'Mô hình cấu trúc tuyến tính', icon: Layers, action: 'select' },
                ]
            }
        },
        {
            id: 'categorical',
            category: {
                name: 'Biến định danh',
                description: 'Kiểm định cho biến phân loại',
                color: 'text-teal-700',
                bgColor: 'bg-teal-50',
                borderColor: 'border-teal-200',
                options: [
                    { id: 'chisq-select', title: 'Chi-Square Test', desc: 'Kiểm định độc lập (Biến định danh)', icon: Grid3x3, action: 'select' },
                ]
            }
        }
    ];

    return (
        <div className="space-y-4">
            {/* Quick Stats */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <span className="px-2 py-1 bg-slate-100 rounded font-medium">12 phương pháp</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    Được khuyến nghị
                </span>
            </div>

            {categories.map(({ id, category }) => {
                const isExpanded = expandedCategories.includes(id);

                return (
                    <div key={id} className={`rounded-xl border-2 ${category.borderColor} overflow-hidden transition-all`}>
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(id)}
                            className={`w-full px-5 py-4 flex items-center justify-between ${category.bgColor} hover:brightness-95 transition-all`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center ${category.color}`}>
                                    {id === 'reliability' && <Shield className="w-5 h-5" />}
                                    {id === 'comparison' && <GitCompare className="w-5 h-5" />}
                                    {id === 'relationship' && <Network className="w-5 h-5" />}
                                    {id === 'factor' && <Layers className="w-5 h-5" />}
                                    {id === 'categorical' && <Grid3x3 className="w-5 h-5" />}
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-semibold ${category.color}`}>{category.name}</h3>
                                    <p className="text-xs text-slate-500">{category.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{category.options.length} phương pháp</span>
                                {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        </button>

                        {/* Category Content */}
                        {isExpanded && (
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-3">
                                {category.options.map((opt) => {
                                    const Icon = opt.icon;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => opt.action === 'run' ? onRunAnalysis(opt.id) : onSelect(opt.id)}
                                            disabled={isAnalyzing}
                                            className={`group relative p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-white hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {opt.recommended && (
                                                <div className="absolute -top-2 -right-2">
                                                    <Star className="w-5 h-5 text-amber-500 fill-current drop-shadow" />
                                                </div>
                                            )}
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 group-hover:scale-110 transition-transform shrink-0">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-slate-800 text-sm leading-tight">
                                                        {opt.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                        {opt.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
