'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataProfiler } from '@/components/DataProfiler';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { profileData, DataProfile } from '@/lib/data-profiler';
import { runCronbachAlpha, runCorrelation, runDescriptiveStats } from '@/lib/webr-wrapper';
import { BarChart3, Brain, FileText } from 'lucide-react';

type AnalysisStep = 'upload' | 'profile' | 'analyze' | 'results';

export default function AnalyzePage() {
    const [step, setStep] = useState<AnalysisStep>('upload');
    const [data, setData] = useState<any[]>([]);
    const [filename, setFilename] = useState('');
    const [profile, setProfile] = useState<DataProfile | null>(null);
    const [analysisType, setAnalysisType] = useState<string>('');
    const [results, setResults] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleDataLoaded = (loadedData: any[], fname: string) => {
        setData(loadedData);
        setFilename(fname);
        const dataProfile = profileData(loadedData);
        setProfile(dataProfile);
        setStep('profile');
    };

    const handleProceedToAnalysis = () => {
        setStep('analyze');
    };

    const runAnalysis = async (type: string) => {
        setIsAnalyzing(true);
        setAnalysisType(type);

        try {
            // Extract numeric columns only
            const numericColumns = Object.entries(profile!.columnStats)
                .filter(([_, stats]) => stats.type === 'numeric')
                .map(([name, _]) => name);

            const numericData = data.map(row =>
                numericColumns.map(col => Number(row[col]) || 0)
            );

            let analysisResults;

            switch (type) {
                case 'cronbach':
                    analysisResults = await runCronbachAlpha(numericData);
                    break;
                case 'correlation':
                    analysisResults = await runCorrelation(numericData);
                    break;
                case 'descriptive':
                    analysisResults = await runDescriptiveStats(numericData);
                    break;
                default:
                    throw new Error('Unknown analysis type');
            }

            setResults({
                type,
                data: analysisResults,
                columns: numericColumns
            });
            setStep('results');
        } catch (error) {
            console.error('Analysis error:', error);
            alert(`Lỗi phân tích: ${error}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">ncsStat</h1>
                                <p className="text-sm text-gray-500">Phân tích thống kê cho NCS Việt Nam</p>
                            </div>
                        </div>
                        {filename && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FileText className="w-4 h-4" />
                                <span>{filename}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Progress Steps */}
            <div className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-center gap-4 mb-8">
                    {['upload', 'profile', 'analyze', 'results'].map((s, idx) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold
                  ${step === s ? 'bg-blue-600 text-white' :
                                        ['upload', 'profile', 'analyze', 'results'].indexOf(step) > idx ?
                                            'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                `}
                            >
                                {idx + 1}
                            </div>
                            {idx < 3 && (
                                <div className={`w-16 h-1 ${['upload', 'profile', 'analyze', 'results'].indexOf(step) > idx ?
                                    'bg-green-500' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="py-8">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Tải lên dữ liệu của bạn
                                </h2>
                                <p className="text-gray-600">
                                    Hỗ trợ file CSV và Excel (.xlsx, .xls)
                                </p>
                            </div>
                            <FileUpload onDataLoaded={handleDataLoaded} />
                        </div>
                    )}

                    {step === 'profile' && profile && (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Báo cáo chất lượng dữ liệu
                                </h2>
                                <p className="text-gray-600">
                                    Kiểm tra và xác nhận dữ liệu trước khi phân tích
                                </p>
                            </div>
                            <DataProfiler profile={profile} onProceed={handleProceedToAnalysis} />
                        </div>
                    )}

                    {step === 'analyze' && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Chọn phương pháp phân tích
                                </h2>
                                <p className="text-gray-600">
                                    Chọn phương pháp phù hợp với mục tiêu nghiên cứu
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => runAnalysis('descriptive')}
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
                                    onClick={() => runAnalysis('cronbach')}
                                    disabled={isAnalyzing}
                                    className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left disabled:opacity-50"
                                >
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        Cronbach's Alpha
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        Kiểm tra độ tin cậy thang đo
                                    </p>
                                </button>

                                <button
                                    onClick={() => runAnalysis('correlation')}
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
                                    disabled
                                    className="p-6 bg-gray-100 rounded-xl shadow text-left opacity-50 cursor-not-allowed"
                                >
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        EFA (Coming Soon)
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        Phân tích nhân tố khám phá
                                    </p>
                                </button>
                            </div>

                            {isAnalyzing && (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                                    <p className="mt-4 text-gray-600">Đang phân tích...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'results' && results && (
                        <div className="max-w-6xl mx-auto space-y-6" id="results-container">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Kết quả phân tích
                                </h2>
                                <p className="text-gray-600">
                                    {analysisType === 'cronbach' && "Cronbach's Alpha"}
                                    {analysisType === 'correlation' && "Ma trận tương quan"}
                                    {analysisType === 'descriptive' && "Thống kê mô tả"}
                                </p>
                            </div>

                            {/* Enhanced Results Display */}
                            <ResultsDisplay
                                analysisType={analysisType}
                                results={results.data}
                                columns={results.columns}
                            />

                            {/* Action Buttons */}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setStep('analyze')}
                                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                                >
                                    ← Phân tích khác
                                </button>
                                <button
                                    onClick={async () => {
                                        const { exportToPDF } = await import('@/lib/pdf-exporter');
                                        await exportToPDF({
                                            title: `Phân tích ${analysisType}`,
                                            analysisType,
                                            results: results.data,
                                            columns: results.columns,
                                            filename: `statviet_${analysisType}_${Date.now()}.pdf`
                                        });
                                    }}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-5 h-5" />
                                    Xuất PDF
                                </button>
                                <button
                                    onClick={() => {
                                        setStep('upload');
                                        setData([]);
                                        setProfile(null);
                                        setResults(null);
                                    }}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                >
                                    Tải file mới
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
