'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataProfiler } from '@/components/DataProfiler';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { SmartGroupSelector, VariableSelector, AISettings } from '@/components/VariableSelector';
import { profileData, DataProfile } from '@/lib/data-profiler';
import { runCronbachAlpha, runCorrelation, runDescriptiveStats, runTTestIndependent, runTTestPaired, runOneWayANOVA, runEFA, runLinearRegression, runChiSquare, runMannWhitneyU, initWebR, getWebRStatus, setProgressCallback } from '@/lib/webr-wrapper';
import { BarChart3, FileText, Shield, Trash2, Eye, EyeOff } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';
import { WebRStatus } from '@/components/WebRStatus';
import { AnalysisSelector } from '@/components/AnalysisSelector';
import { useAnalysisSession } from '@/hooks/useAnalysisSession';
import { AnalysisStep } from '@/types/analysis';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Badge } from '@/components/ui/Badge';
import CFASelection from '@/components/CFASelection';
import SEMSelection from '@/components/SEMSelection';
import { runCFA, runSEM } from '@/lib/webr-wrapper';

export default function AnalyzePage() {
    // Session State Management
    const {
        isPrivateMode, setIsPrivateMode,
        clearSession,
        step, setStep,
        data, setData,
        filename, setFilename,
        profile, setProfile,
        analysisType, setAnalysisType,
        results, setResults,
        multipleResults, setMultipleResults,
        scaleName, setScaleName,
        regressionVars, setRegressionVars
    } = useAnalysisSession();

    // Local ephemeral state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Auto-initialize WebR on page load (eager loading)
    useEffect(() => {
        const status = getWebRStatus();
        if (!status.isReady && !status.isLoading) {
            console.log('[WebR] Starting auto-initialization...');
            initWebR()
                .then(() => {
                    console.log('[WebR] Auto-initialization successful');
                })
                .catch(err => {
                    console.error('[WebR] Auto-initialization failed:', err);
                    // Don't show toast on initial fail - will retry when needed
                });
        }
    }, []); // Run once on mount

    // Additional check when entering analyze step
    useEffect(() => {
        if (step === 'analyze') {
            const status = getWebRStatus();
            if (!status.isReady && !status.isLoading) {
                setToast({ message: 'Đang khởi tạo R Engine...', type: 'info' });
                initWebR().then(() => {
                    setToast({ message: 'R Engine sẵn sàng!', type: 'success' });
                }).catch(err => {
                    setToast({ message: `Lỗi khởi tạo: ${err.message || err}`, type: 'error' });
                });
            }
        }
    }, [step]);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    };

    const handleAnalysisError = (err: any) => {
        const msg = err.message || String(err);
        console.error("Analysis Error:", err);

        if (msg.includes('subscript out of bounds')) {
            showToast('Lỗi: Không tìm thấy dữ liệu biến (Kiểm tra tên cột).', 'error');
        } else if (msg.includes('singular matrix') || msg.includes('computational singular')) {
            showToast('Lỗi: Ma trận đặc dị (Có đa cộng tuyến hoàn hảo hoặc biến hằng số).', 'error');
        } else if (msg.includes('missing value') || msg.includes('NA/NaN')) {
            showToast('Lỗi: Dữ liệu chứa giá trị trống (NA) hoặc lỗi. Vui lòng làm sạch dữ liệu.', 'error');
        } else {
            // Translate common R errors if possible
            showToast(`Lỗi: ${msg.replace('Error in', '').substring(0, 100)}...`, 'error');
        }
    };

    const handleDataLoaded = (loadedData: any[], fname: string) => {
        // Validation: check file size
        if (loadedData.length > 50000) {
            showToast('Cảnh báo: File lớn (>50000 dòng) có thể gây chậm', 'info');
        }
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
        if (selectedColumns.length < 2) {
            showToast('Cronbach Alpha cần ít nhất 2 biến', 'error');
            return;
        }

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
            showToast('Phân tích hoàn thành!', 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Run Cronbach for multiple groups (batch analysis)
    const runCronbachBatch = async (groups: { name: string; columns: string[] }[]) => {
        // Validate each group has at least 2 items
        for (const group of groups) {
            if (group.columns.length < 2) {
                showToast(`Nhóm "${group.name}" cần ít nhất 2 biến`, 'error');
                return;
            }
        }

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
            showToast(`Phân tích ${allResults.length} thang đo hoàn thành!`, 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runAnalysis = async (type: string) => {
        setIsAnalyzing(true);
        setAnalysisType(type);

        try {
            const numericColumns = getNumericColumns();

            if (numericColumns.length < 2) {
                showToast('Cần ít nhất 2 biến số để phân tích', 'error');
                setIsAnalyzing(false);
                return;
            }

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
                case 'chisq':
                    analysisResults = await runChiSquare(numericData);
                    break;
                case 'mannwhitney':
                    analysisResults = await runMannWhitneyU(numericData);
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
            showToast('Phân tích hoàn thành!', 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Handle PDF Export (fixed for batch)
    const handleExportPDF = async () => {
        try {
            const { exportToPDF } = await import('@/lib/pdf-exporter');

            if (analysisType === 'cronbach-batch' && multipleResults.length > 0) {
                // Export first result for batch (or could loop through all)
                for (const r of multipleResults) {
                    await exportToPDF({
                        title: `Cronbach's Alpha - ${r.scaleName}`,
                        analysisType: 'cronbach',
                        results: r.data,
                        columns: r.columns,
                        filename: `statviet_cronbach_${r.scaleName}_${Date.now()}.pdf`
                    });
                }
                showToast(`Đã xuất ${multipleResults.length} file PDF`, 'success');
            } else if (results) {
                await exportToPDF({
                    title: `Phân tích ${analysisType}`,
                    analysisType,
                    results: results.data,
                    columns: results.columns,
                    filename: `statviet_${analysisType}_${Date.now()}.pdf`
                });
                showToast('Đã xuất PDF thành công!', 'success');
            }
        } catch (error) {
            showToast(`Lỗi xuất PDF: ${error}`, 'error');
        }
    };

    // Map steps for StepIndicator
    const getStepId = (): string => {
        if (step === 'upload') return 'upload';
        if (step === 'profile') return 'profile';
        if (step === 'results') return 'results';
        return 'analyze'; // All selection/analysis steps
    };

    const steps = [
        { id: 'upload', label: 'Tải dữ liệu' },
        { id: 'profile', label: 'Kiểm tra' },
        { id: 'analyze', label: 'Phân tích' },
        { id: 'results', label: 'Kết quả' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-indigo-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">ncsStat</h1>
                                <p className="text-sm text-slate-600">Phân tích thống kê cho NCS Việt Nam</p>
                            </div>
                        </div>

                        {/* Privacy & Settings */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Badge variant={isPrivateMode ? 'default' : 'info'} className="cursor-pointer" onClick={() => setIsPrivateMode(!isPrivateMode)}>
                                    {isPrivateMode ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                    {isPrivateMode ? 'Riêng tư' : 'Đang lưu'}
                                </Badge>
                                <button
                                    onClick={() => {
                                        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu phiên làm việc?')) {
                                            clearSession();
                                            showToast('Đã xóa dữ liệu phiên làm việc', 'info');
                                        }
                                    }}
                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                    title="Xóa phiên làm việc"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <WebRStatus />
                            {filename && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border px-3 py-1 rounded-full">
                                    <FileText className="w-4 h-4" />
                                    <span className="truncate max-w-[150px]">{filename}</span>
                                </div>
                            )}
                            <AISettings />
                        </div>
                    </div>
                </div>

                {/* Privacy Disclaimer */}
                <div className="bg-blue-50 border-b border-blue-100 py-1.5">
                    <div className="container mx-auto px-6 flex items-center justify-center gap-2 text-xs text-blue-700">
                        <Shield className="w-3 h-3" />
                        <span className="font-medium">Bảo mật:</span>
                        <span>Dữ liệu của bạn được xử lý 100% trên trình duyệt và không bao giờ được gửi đi đâu.</span>
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

                            <AnalysisSelector
                                onSelect={(s) => setStep(s as AnalysisStep)}
                                onRunAnalysis={runAnalysis}
                                isAnalyzing={isAnalyzing}
                            />

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
                                        if (!g1 || !g2) { showToast('Vui lòng chọn cả 2 biến', 'error'); return; }
                                        if (g1 === g2) { showToast('Vui lòng chọn 2 biến khác nhau', 'error'); return; }
                                        setIsAnalyzing(true);
                                        setAnalysisType('ttest');
                                        try {
                                            const group1Data = data.map(row => Number(row[g1]) || 0);
                                            const group2Data = data.map(row => Number(row[g2]) || 0);
                                            const result = await runTTestIndependent(group1Data, group2Data);
                                            setResults({ type: 'ttest', data: result, columns: [g1, g2] });
                                            setStep('results');
                                            showToast('Phân tích T-test hoàn thành!', 'success');
                                        } catch (err) { showToast('Lỗi: ' + err, 'error'); }
                                        finally { setIsAnalyzing(false); }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                                >
                                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy Independent T-test'}
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

                    {/* Paired T-test Selection - NEW */}
                    {step === 'ttest-paired-select' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Paired Samples T-test
                                </h2>
                                <p className="text-gray-600">
                                    So sánh trước-sau (cùng một nhóm đối tượng)
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <p className="text-sm text-gray-600 mb-4">
                                    Chọn biến trước và sau để so sánh:
                                </p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trước (Before)</label>
                                        <select
                                            id="paired-before"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sau (After)</label>
                                        <select
                                            id="paired-after"
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
                                        const before = (document.getElementById('paired-before') as HTMLSelectElement).value;
                                        const after = (document.getElementById('paired-after') as HTMLSelectElement).value;
                                        if (!before || !after) { showToast('Vui lòng chọn cả 2 biến', 'error'); return; }
                                        if (before === after) { showToast('Vui lòng chọn 2 biến khác nhau', 'error'); return; }
                                        setIsAnalyzing(true);
                                        setAnalysisType('ttest-paired');
                                        try {
                                            const beforeData = data.map(row => Number(row[before]) || 0);
                                            const afterData = data.map(row => Number(row[after]) || 0);
                                            const result = await runTTestPaired(beforeData, afterData);
                                            setResults({ type: 'ttest-paired', data: result, columns: [before, after] });
                                            setStep('results');
                                            showToast('Phân tích Paired T-test hoàn thành!', 'success');
                                        } catch (err) { showToast('Lỗi: ' + err, 'error'); }
                                        finally { setIsAnalyzing(false); }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                                >
                                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy Paired T-test'}
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
                                        if (selectedCols.length < 3) { showToast('Cần chọn ít nhất 3 biến', 'error'); return; }
                                        setIsAnalyzing(true);
                                        setAnalysisType('anova');
                                        try {
                                            const groups = selectedCols.map(col => data.map(row => Number(row[col]) || 0));
                                            const result = await runOneWayANOVA(groups);
                                            setResults({ type: 'anova', data: result, columns: selectedCols });
                                            setStep('results');
                                            showToast('Phân tích ANOVA hoàn thành!', 'success');
                                        } catch (err) { showToast('Lỗi: ' + err, 'error'); }
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

                    {/* EFA Selection - NEW */}
                    {step === 'efa-select' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Exploratory Factor Analysis (EFA)
                                </h2>
                                <p className="text-gray-600">
                                    Phân tích nhân tố khám phá
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <p className="text-sm text-gray-600 mb-4">
                                    Chọn các biến để phân tích nhân tố:
                                </p>
                                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                    {getNumericColumns().map(col => (
                                        <label key={col} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                            <input
                                                type="checkbox"
                                                value={col}
                                                className="efa-checkbox w-4 h-4 text-orange-600"
                                            />
                                            <span>{col}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số nhân tố dự kiến</label>
                                    <input
                                        type="number"
                                        id="efa-nfactors"
                                        className="w-full px-3 py-2 border rounded-lg"
                                        defaultValue={3}
                                        min={1}
                                        max={10}
                                    />
                                </div>

                                <button
                                    onClick={async () => {
                                        const checkboxes = document.querySelectorAll('.efa-checkbox:checked') as NodeListOf<HTMLInputElement>;
                                        const selectedCols = Array.from(checkboxes).map(cb => cb.value);
                                        const nfactors = parseInt((document.getElementById('efa-nfactors') as HTMLInputElement).value) || 3;

                                        if (selectedCols.length < 4) {
                                            showToast('Cần chọn ít nhất 4 biến để phân tích EFA', 'error');
                                            return;
                                        }

                                        if (nfactors > selectedCols.length / 2) {
                                            showToast('Số nhân tố không nên lớn hơn số biến / 2', 'error');
                                            return;
                                        }

                                        setIsAnalyzing(true);
                                        setAnalysisType('efa');
                                        try {
                                            const efaData = data.map(row =>
                                                selectedCols.map(col => Number(row[col]) || 0)
                                            );
                                            const result = await runEFA(efaData, nfactors);
                                            setResults({ type: 'efa', data: result, columns: selectedCols });
                                            setStep('results');
                                            showToast('Phân tích EFA hoàn thành!', 'success');
                                        } catch (err) {
                                            showToast('Lỗi EFA: ' + err, 'error');
                                        }
                                        finally { setIsAnalyzing(false); }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
                                >
                                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy EFA'}
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

                    {/* Regression Selection */}
                    {step === 'regression-select' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Hồi quy Tuyến tính Đa biến
                                </h2>
                                <p className="text-gray-600">
                                    Chọn 1 biến phụ thuộc (Y) và các biến độc lập (X)
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <div className="space-y-6">
                                    {/* Dependent Variable (Y) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Biến phụ thuộc (Y) - Chọn 1
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={regressionVars.y}
                                            onChange={(e) => setRegressionVars({ ...regressionVars, y: e.target.value })}
                                        >
                                            <option value="">Chọn biến...</option>
                                            {getNumericColumns().map(col => (
                                                <option key={col} value={col} disabled={regressionVars.xs.includes(col)}>
                                                    {col}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Independent Variables (Xs) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Biến độc lập (X) - Chọn nhiều
                                        </label>
                                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto border rounded-lg p-2">
                                            {getNumericColumns().map(col => (
                                                <label key={col} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        value={col}
                                                        disabled={regressionVars.y === col}
                                                        checked={regressionVars.xs.includes(col)}
                                                        onChange={(e) => {
                                                            const isChecked = e.target.checked;
                                                            setRegressionVars(prev => ({
                                                                ...prev,
                                                                xs: isChecked
                                                                    ? [...prev.xs, col]
                                                                    : prev.xs.filter(x => x !== col)
                                                            }));
                                                        }}
                                                        className="w-4 h-4 text-pink-600"
                                                    />
                                                    <span className={regressionVars.y === col ? 'text-gray-400' : ''}>{col}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        if (!regressionVars.y) { showToast('Vui lòng chọn biến phụ thuộc (Y)', 'error'); return; }
                                        if (regressionVars.xs.length === 0) { showToast('Vui lòng chọn ít nhất 1 biến độc lập (X)', 'error'); return; }

                                        setIsAnalyzing(true);
                                        setAnalysisType('regression');
                                        try {
                                            // Prepare Data Matrix [Y, X1, X2...]
                                            const cols = [regressionVars.y, ...regressionVars.xs];
                                            const regData = data.map(row =>
                                                cols.map(c => Number(row[c]) || 0)
                                            );

                                            const result = await runLinearRegression(regData, cols);
                                            setResults({ type: 'regression', data: result, columns: cols });
                                            setStep('results');
                                            showToast('Phân tích Hồi quy hoàn thành!', 'success');
                                        } catch (err) { showToast('Lỗi: ' + err, 'error'); }
                                        finally { setIsAnalyzing(false); }
                                    }}
                                    disabled={isAnalyzing}
                                    className="mt-6 w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg"
                                >
                                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy Hồi quy'}
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

                    {/* CFA Selection */}
                    {step === 'cfa-select' && (
                        <CFASelection
                            columns={getNumericColumns()}
                            onRunCFA={async (syntax, factors) => {
                                setIsAnalyzing(true);
                                setAnalysisType('cfa');
                                try {
                                    // Extract unique columns needed
                                    const neededCols = Array.from(new Set(factors.flatMap((f: any) => f.indicators)));
                                    // Need to cast correct type for TS, assuming neededCols is string[]
                                    const cfaData = data.map(row => (neededCols as string[]).map((c: string) => Number(row[c]) || 0));

                                    const result = await runCFA(cfaData, neededCols as string[], syntax);
                                    setResults({ type: 'cfa', data: result, columns: neededCols as string[] });
                                    setStep('results');
                                    showToast('Phân tích CFA thành công!', 'success');
                                } catch (err) {
                                    handleAnalysisError(err);
                                } finally {
                                    setIsAnalyzing(false);
                                }
                            }}
                            isAnalyzing={isAnalyzing}
                            onBack={() => setStep('analyze')}
                        />
                    )}

                    {/* SEM Selection */}
                    {step === 'sem-select' && (
                        <SEMSelection
                            columns={getNumericColumns()}
                            onRunSEM={async (syntax, factors) => {
                                setIsAnalyzing(true);
                                setAnalysisType('sem');
                                try {
                                    // Extract unique columns needed from factors (step 1)
                                    // Step 2 paths use factor names which are internal, not columns
                                    const neededCols = Array.from(new Set(factors.flatMap((f: any) => f.indicators)));
                                    const semData = data.map(row => (neededCols as string[]).map((c: string) => Number(row[c]) || 0));

                                    const result = await runSEM(semData, neededCols as string[], syntax);
                                    setResults({ type: 'sem', data: result, columns: neededCols as string[] });
                                    setStep('results');
                                    showToast('Phân tích SEM thành công!', 'success');
                                } catch (err) {
                                    handleAnalysisError(err);
                                } finally {
                                    setIsAnalyzing(false);
                                }
                            }}
                            isAnalyzing={isAnalyzing}
                            onBack={() => setStep('analyze')}
                        />
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
                                    {analysisType === 'ttest-paired' && "Paired Samples T-test"}
                                    {analysisType === 'anova' && "One-Way ANOVA"}
                                    {analysisType === 'efa' && "Exploratory Factor Analysis"}
                                    {analysisType === 'regression' && "Multiple Linear Regression"}
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
                                    onClick={handleExportPDF}
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
                                        setMultipleResults([]);
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

            {/* Footer */}
            <footer className="mt-12 py-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>
                    1 sản phẩm của hệ sinh thái hỗ trợ nghiên cứu khoa học từ{' '}
                    <a
                        href="https://ncskit.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        NCSKit.org
                    </a>
                </p>
            </footer>

            {/* Custom styles for animations */}
            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
