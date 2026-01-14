'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataProfiler } from '@/components/DataProfiler';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { SmartGroupSelector, VariableSelector, AISettings } from '@/components/VariableSelector';
import { profileData, DataProfile } from '@/lib/data-profiler';
import { runCronbachAlpha, runCorrelation, runDescriptiveStats } from '@/lib/webr-wrapper';
import { BarChart3, Brain, FileText } from 'lucide-react';

type AnalysisStep = 'upload' | 'profile' | 'analyze' | 'cronbach-select' | 'ttest-select' | 'anova-select' | 'results';

export default function AnalyzePage() {
    const [step, setStep] = useState<AnalysisStep>('upload');
    const [data, setData] = useState<any[]>([]);
    const [filename, setFilename] = useState('');
    const [profile, setProfile] = useState<DataProfile | null>(null);
    const [analysisType, setAnalysisType] = useState<string>('');
    const [results, setResults] = useState<any>(null);
    const [multipleResults, setMultipleResults] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scaleName, setScaleName] = useState('');

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

    // Get numeric columns from profile
    const getNumericColumns = () => {
        if (!profile) return [];
        return Object.entries(profile.columnStats)
            .filter(([_, stats]) => stats.type === 'numeric')
            .map(([name, _]) => name);
    };

    // Run Cronbach with selected variables (scientific approach - per construct)
    const runCronbachWithSelection = async (selectedColumns: string[], name: string) => {
        setIsAnalyzing(true);
        setAnalysisType('cronbach');
        setScaleName(name);
        setMultipleResults([]);

        try {
            const selectedData = data.map(row =>
                selectedColumns.map(col => Number(row[col]) || 0)
            );

            const analysisResults = await runCronbachAlpha(selectedData);

            setResults({
                type: 'cronbach',
                data: analysisResults,
                columns: selectedColumns,
                scaleName: name
            });
            setStep('results');
        } catch (error) {
            console.error('Analysis error:', error);
            alert(`Lỗi phân tích: ${error}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Run Cronbach for multiple groups (batch analysis)
    const runCronbachBatch = async (groups: { name: string; columns: string[] }[]) => {
        setIsAnalyzing(true);
        setAnalysisType('cronbach-batch');
        setResults(null);
        setMultipleResults([]);

        try {
            const allResults = [];
            for (const group of groups) {
                const groupData = data.map(row =>
                    group.columns.map(col => Number(row[col]) || 0)
                );
                const result = await runCronbachAlpha(groupData);
                allResults.push({
                    scaleName: group.name,
                    columns: group.columns,
                    data: result
                });
            }
            setMultipleResults(allResults);
            setStep('results');
        } catch (error) {
            console.error('Batch analysis error:', error);
            alert(`Lỗi phân tích: ${error}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runAnalysis = async (type: string) => {
        setIsAnalyzing(true);
        setAnalysisType(type);

        try {
            const numericColumns = getNumericColumns();
            const numericData = data.map(row =>
                numericColumns.map(col => Number(row[col]) || 0)
            );

            let analysisResults;

            switch (type) {
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
                        <div className="flex items-center gap-4">
                            {filename && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FileText className="w-4 h-4" />
                                    <span>{filename}</span>
                                </div>
                            )}
                            <AISettings />
                        </div>
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
                                    onClick={() => setStep('cronbach-select')}
                                    disabled={isAnalyzing}
                                    className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left disabled:opacity-50"
                                >
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        Cronbach&apos;s Alpha
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        Kiểm tra độ tin cậy thang đo (chọn nhóm biến)
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
                                    onClick={() => setStep('ttest-select')}
                                    disabled={isAnalyzing}
                                    className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500 text-left disabled:opacity-50"
                                >
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        T-test
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        So sánh trung bình 2 nhóm
                                    </p>
                                </button>

                                <button
                                    onClick={() => setStep('anova-select')}
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

                    {step === 'cronbach-select' && (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Cronbach&apos;s Alpha
                                </h2>
                                <p className="text-gray-600">
                                    Tự động nhận diện và gom nhóm biến theo tên (VD: SAT1, SAT2 → SAT)
                                </p>
                            </div>

                            <SmartGroupSelector
                                columns={getNumericColumns()}
                                onAnalyzeGroup={runCronbachWithSelection}
                                onAnalyzeAllGroups={runCronbachBatch}
                                isAnalyzing={isAnalyzing}
                            />

                            <button
                                onClick={() => setStep('analyze')}
                                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                            >
                                ← Quay lại chọn phương pháp
                            </button>

                            {isAnalyzing && (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                                    <p className="mt-4 text-gray-600">Đang phân tích...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* T-test Selection */}
                    {step === 'ttest-select' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Independent Samples T-test
                                </h2>
                                <p className="text-gray-600">
                                    So sánh trung bình giữa 2 nhóm độc lập
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <p className="text-sm text-gray-600 mb-4">
                                    Chọn 2 biến số để so sánh trung bình:
                                </p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm 1</label>
                                        <select
                                            id="ttest-group1"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            defaultValue=""
                                        >
                                            <option value="">Chọn biến...</option>
                                            {getNumericColumns().map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm 2</label>
                                        <select
                                            id="ttest-group2"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            defaultValue=""
                                        >
                                            <option value="">Chọn biến...</option>
                                            {getNumericColumns().map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const g1 = (document.getElementById('ttest-group1') as HTMLSelectElement).value;
                                        const g2 = (document.getElementById('ttest-group2') as HTMLSelectElement).value;
                                        if (!g1 || !g2) { alert('Vui lòng chọn cả 2 biến'); return; }
                                        setIsAnalyzing(true);
                                        setAnalysisType('ttest');
                                        try {
                                            const { runTTestIndependent } = await import('@/lib/webr-wrapper');
                                            const group1Data = data.map(row => Number(row[g1]) || 0);
                                            const group2Data = data.map(row => Number(row[g2]) || 0);
                                            const result = await runTTestIndependent(group1Data, group2Data);
                                            setResults({ type: 'ttest', data: result, columns: [g1, g2] });
                                            setStep('results');
                                        } catch (err) { alert('Lỗi: ' + err); }
                                        finally { setIsAnalyzing(false); }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                                >
                                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy T-test'}
                                </button>
                            </div>

                            <button
                                onClick={() => setStep('analyze')}
                                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg"
                            >
                                ← Quay lại
                            </button>
                        </div>
                    )}

                    {/* ANOVA Selection */}
                    {step === 'anova-select' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    One-Way ANOVA
                                </h2>
                                <p className="text-gray-600">
                                    So sánh trung bình giữa nhiều nhóm (≥3)
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <p className="text-sm text-gray-600 mb-4">
                                    Chọn các biến để so sánh (mỗi biến là 1 nhóm):
                                </p>
                                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                    {getNumericColumns().map(col => (
                                        <label key={col} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                            <input
                                                type="checkbox"
                                                value={col}
                                                className="anova-checkbox w-4 h-4 text-purple-600"
                                            />
                                            <span>{col}</span>
                                        </label>
                                    ))}
                                </div>
                                <button
                                    onClick={async () => {
                                        const checkboxes = document.querySelectorAll('.anova-checkbox:checked') as NodeListOf<HTMLInputElement>;
                                        const selectedCols = Array.from(checkboxes).map(cb => cb.value);
                                        if (selectedCols.length < 3) { alert('Cần chọn ít nhất 3 biến'); return; }
                                        setIsAnalyzing(true);
                                        setAnalysisType('anova');
                                        try {
                                            const { runOneWayANOVA } = await import('@/lib/webr-wrapper');
                                            const groups = selectedCols.map(col => data.map(row => Number(row[col]) || 0));
                                            const result = await runOneWayANOVA(groups);
                                            setResults({ type: 'anova', data: result, columns: selectedCols });
                                            setStep('results');
                                        } catch (err) { alert('Lỗi: ' + err); }
                                        finally { setIsAnalyzing(false); }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
                                >
                                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy ANOVA'}
                                </button>
                            </div>

                            <button
                                onClick={() => setStep('analyze')}
                                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg"
                            >
                                ← Quay lại
                            </button>
                        </div>
                    )}

                    {step === 'results' && (results || multipleResults.length > 0) && (
                        <div className="max-w-6xl mx-auto space-y-6" id="results-container">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Kết quả phân tích
                                </h2>
                                <p className="text-gray-600">
                                    {analysisType === 'cronbach' && `Cronbach's Alpha${results?.scaleName ? ` - ${results.scaleName}` : ''}`}
                                    {analysisType === 'cronbach-batch' && `Cronbach's Alpha - ${multipleResults.length} thang đo`}
                                    {analysisType === 'correlation' && "Ma trận tương quan"}
                                    {analysisType === 'descriptive' && "Thống kê mô tả"}
                                    {analysisType === 'ttest' && "Independent Samples T-test"}
                                    {analysisType === 'anova' && "One-Way ANOVA"}
                                </p>
                            </div>

                            {/* Single Result Display */}
                            {results && analysisType !== 'cronbach-batch' && (
                                <ResultsDisplay
                                    analysisType={analysisType}
                                    results={results.data}
                                    columns={results.columns}
                                />
                            )}

                            {/* Batch Results Display */}
                            {analysisType === 'cronbach-batch' && multipleResults.length > 0 && (
                                <div className="space-y-8">
                                    {/* Summary Table */}
                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">Tổng hợp độ tin cậy các thang đo</h3>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b-2 border-gray-300">
                                                    <th className="py-2 px-3 font-semibold">Thang đo</th>
                                                    <th className="py-2 px-3 font-semibold text-center">Số biến</th>
                                                    <th className="py-2 px-3 font-semibold text-center">Cronbach&apos;s Alpha</th>
                                                    <th className="py-2 px-3 font-semibold text-center">Đánh giá</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {multipleResults.map((r, idx) => {
                                                    const alpha = r.data?.alpha || r.data?.rawAlpha || 0;
                                                    let evaluation = '';
                                                    let evalColor = '';
                                                    if (alpha >= 0.9) { evaluation = 'Xuất sắc'; evalColor = 'text-green-700 bg-green-100'; }
                                                    else if (alpha >= 0.8) { evaluation = 'Tốt'; evalColor = 'text-green-600 bg-green-50'; }
                                                    else if (alpha >= 0.7) { evaluation = 'Chấp nhận'; evalColor = 'text-blue-600 bg-blue-50'; }
                                                    else if (alpha >= 0.6) { evaluation = 'Khá'; evalColor = 'text-yellow-600 bg-yellow-50'; }
                                                    else { evaluation = 'Kém'; evalColor = 'text-red-600 bg-red-50'; }

                                                    return (
                                                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                                            <td className="py-3 px-3 font-medium">{r.scaleName}</td>
                                                            <td className="py-3 px-3 text-center">{r.columns.length}</td>
                                                            <td className="py-3 px-3 text-center font-bold">{alpha.toFixed(3)}</td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className={`px-2 py-1 rounded text-sm font-medium ${evalColor}`}>
                                                                    {evaluation}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Detailed Results for Each Group */}
                                    {multipleResults.map((r, idx) => (
                                        <div key={idx} className="border-t pt-6">
                                            <h4 className="text-lg font-bold text-gray-800 mb-4">
                                                Chi tiết: {r.scaleName} ({r.columns.join(', ')})
                                            </h4>
                                            <ResultsDisplay
                                                analysisType="cronbach"
                                                results={r.data}
                                                columns={r.columns}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

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
