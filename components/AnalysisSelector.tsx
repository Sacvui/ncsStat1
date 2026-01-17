import React from 'react';

interface AnalysisSelectorProps {
    onSelect: (step: string) => void;
    onRunAnalysis: (type: string) => void;
    isAnalyzing: boolean;
}

export function AnalysisSelector({ onSelect, onRunAnalysis, isAnalyzing }: AnalysisSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
                onClick={() => onRunAnalysis('descriptive')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Thống kê mô tả
                </h3>
                <p className="text-gray-600 text-sm">
                    Mean, SD, Min, Max, Median
                </p>
            </button>

            <button
                onClick={() => onSelect('cronbach-select')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Cronbach&apos;s Alpha
                </h3>
                <p className="text-gray-600 text-sm">
                    Kiểm tra độ tin cậy thang đo
                </p>
            </button>

            <button
                onClick={() => onRunAnalysis('correlation')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Ma trận tương quan
                </h3>
                <p className="text-gray-600 text-sm">
                    Phân tích mối quan hệ giữa các biến
                </p>
            </button>

            <button
                onClick={() => onSelect('ttest-select')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Independent T-test
                </h3>
                <p className="text-gray-600 text-sm">
                    So sánh 2 nhóm độc lập
                </p>
            </button>

            <button
                onClick={() => onSelect('ttest-paired-select')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Paired T-test
                </h3>
                <p className="text-gray-600 text-sm">
                    So sánh trước-sau (cặp đôi)
                </p>
            </button>

            <button
                onClick={() => onSelect('anova-select')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    ANOVA
                </h3>
                <p className="text-gray-600 text-sm">
                    So sánh trung bình nhiều nhóm
                </p>
            </button>

            <button
                onClick={() => onSelect('efa-select')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    EFA
                </h3>
                <p className="text-gray-600 text-sm">
                    Phân tích nhân tố khám phá
                </p>
            </button>

            <button
                onClick={() => onSelect('regression-select')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-pink-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Hồi quy Tuyến tính
                </h3>
                <p className="text-gray-600 text-sm">
                    Multiple Linear Regression
                </p>
            </button>

            <button
                onClick={() => onSelect('chisq-select')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-teal-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Chi-Square Test
                </h3>
                <p className="text-gray-600 text-sm">
                    Kiểm định độc lập (Biến định danh)
                </p>
            </button>

            <button
                onClick={() => onSelect('mannwhitney-select')}
                disabled={isAnalyzing}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-cyan-500 text-left disabled:opacity-50"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Mann-Whitney U
                </h3>
                <p className="text-gray-600 text-sm">
                    So sánh 2 nhóm (Phi tham số)
                </p>
            </button>
        </div>
    );
}
