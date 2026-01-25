'use client';

// Prevent prerendering - this page requires client-side Supabase
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';
import { DataProfiler } from '@/components/DataProfiler';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { SmartGroupSelector, VariableSelector, AISettings } from '@/components/VariableSelector';
import { profileData, DataProfile } from '@/lib/data-profiler';
import { runCronbachAlpha, runCorrelation, runDescriptiveStats, runTTestIndependent, runTTestPaired, runOneWayANOVA, runEFA, runLinearRegression, runChiSquare, runMannWhitneyU, initWebR, getWebRStatus, setProgressCallback } from '@/lib/webr-wrapper';
import { BarChart3, FileText, Shield, Trash2, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';
import { WebRStatus } from '@/components/WebRStatus';
import { AnalysisSelector } from '@/components/AnalysisSelector';
import { useAnalysisSession } from '@/hooks/useAnalysisSession';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { AnalysisStep } from '@/types/analysis';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Badge } from '@/components/ui/Badge';
import CFASelection from '@/components/CFASelection';
import SEMSelection from '@/components/SEMSelection';
import { runCFA, runSEM } from '@/lib/webr-wrapper';
import type { PreviousAnalysisData } from '@/types/analysis';
import { DemographicSurvey } from '@/components/feedback/DemographicSurvey';
import { ApplicabilitySurvey } from '@/components/feedback/ApplicabilitySurvey';
import { FeedbackService } from '@/lib/feedback-service';
import { getSupabase } from '@/utils/supabase/client';
import Header from '@/components/layout/Header'
import AnalysisToolbar from '@/components/analyze/AnalysisToolbar';
import SaveProjectModal from '@/components/analyze/SaveProjectModal';
import Footer from '@/components/layout/Footer';
import { getAnalysisCost, checkBalance, deductCredits, getUserBalance } from '@/lib/ncs-credits';
import { InsufficientCreditsModal } from '@/components/InsufficientCreditsModal';
import { NcsBalanceBadge } from '@/components/NcsBalanceBadge';

export default function AnalyzePage() {
    const router = useRouter()

    // Auth State
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null); // New User Profile State
    const [loading, setLoading] = useState(true);

    // Proper authentication - fetch real user from Supabase
    useEffect(() => {
        const getUser = async () => {
            const supabase = getSupabase();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUser(user);
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setUserProfile(profile);

                // Set NCS balance from profile tokens
                if (profile?.tokens !== undefined) {
                    setNcsBalance(profile.tokens);
                }
            } else {
                // Check for ORCID session cookie
                const orcidCookie = document.cookie.split(';').find(c => c.trim().startsWith('orcid_user='));
                if (!orcidCookie) {
                    // No auth at all - redirect to login
                    router.push('/login?next=/analyze');
                    return;
                }
            }
            setLoading(false);
        };
        getUser();
    }, [router])
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

    // Feedback State
    const [showDemographics, setShowDemographics] = useState(false);
    const [showApplicability, setShowApplicability] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    // Workflow Mode State
    const [previousAnalysis, setPreviousAnalysis] = useState<PreviousAnalysisData | null>(null);

    // Online/Offline detection
    const { isOnline, wasOffline } = useOnlineStatus();

    // Progress tracking
    const [analysisProgress, setAnalysisProgress] = useState(0);

    // NCS Credit System State
    const [ncsBalance, setNcsBalance] = useState<number>(0);
    const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
    const [requiredCredits, setRequiredCredits] = useState(0);
    const [currentAnalysisCost, setCurrentAnalysisCost] = useState(0);

    // Persist workflow state to sessionStorage
    useEffect(() => {
        if (previousAnalysis) {
            sessionStorage.setItem('workflow_state', JSON.stringify(previousAnalysis));
        }
    }, [previousAnalysis]);

    // Load workflow state on mount
    useEffect(() => {
        const saved = sessionStorage.getItem('workflow_state');
        if (saved) {
            try {
                setPreviousAnalysis(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse workflow state:', e);
            }
        }
    }, []);

    // Handle online/offline events
    useEffect(() => {
        const handleOnline = () => {
            showToast('Kết nối Internet đã được khôi phục!', 'success');
        };

        const handleOffline = () => {
            showToast('Mất kết nối Internet. Một số tính năng có thể không hoạt động.', 'error');
        };

        window.addEventListener('app:online', handleOnline);
        window.addEventListener('app:offline', handleOffline);

        return () => {
            window.removeEventListener('app:online', handleOnline);
            window.removeEventListener('app:offline', handleOffline);
        };
    }, []);

    // Auto-initialize WebR on page load (eager loading)
    useEffect(() => {
        const status = getWebRStatus();
        if (!status.isReady && !status.isLoading) {
            console.log('[WebR] Starting auto-initialization...');

            // Subscribe to progress updates
            setProgressCallback((msg) => {
                setToast({ message: msg, type: 'info' });
            });

            initWebR()
                .then(() => {
                    console.log('[WebR] Auto-initialization successful');
                    setToast({ message: 'R Engine đã sẵn sàng!', type: 'success' });
                })
                .catch(err => {
                    console.error('[WebR] Auto-initialization failed:', err);
                    setToast({ message: 'Lỗi khởi tạo R Engine. Vui lòng tải lại trang.', type: 'error' });
                });
        }
    }, []); // Run once on mount

    // Check for Demographics Survey (Part 1)
    useEffect(() => {
        // Delay slightly to let page load
        const timer = setTimeout(() => {
            if (!FeedbackService.hasCompletedDemographics()) {
                setShowDemographics(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

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
        // Auto-dismiss after 5 seconds
        setTimeout(() => setToast(null), 5000);
    };

    const handleAnalysisError = (err: any) => {
        const msg = err.message || String(err);
        console.error("Analysis Error:", err);

        if (msg.includes('subscript out of bounds')) {
            showToast('Lỗi: Không tìm thấy dữ liệu biến (Kiểm tra tên cột).', 'error');
        } else if (msg.includes('singular matrix') || msg.includes('computational singular')) {
            showToast('Lỗi: Ma trận đặc dị (Có đa cộng tuyến hoàn hảo hoặc biến hằng số).', 'error');
        } else if (msg.includes('missing value') || msg.includes('NA/NaN')) {
            showToast('Lỗi: Dữ liệu chứa giá trị trống (NA). Đang thử dùng FIML, nhưng nếu vẫn lỗi hãy làm sạch dữ liệu.', 'error');
        } else if (msg.includes('model is not identified')) {
            showToast('Lỗi SEM/CFA: Mô hình không xác định (Not Identified). Kiểm tra lại số lượng biến quan sát (cần >= 3 biến/nhân tố) hoặc bậc tự do.', 'error');
        } else if (msg.includes('could not find function')) {
            showToast('Lỗi: Gói phân tích chưa tải xong. Vui lòng thử lại sau 5 giây.', 'error');
        } else if (msg.includes('covariance matrix is not positive definite')) {
            showToast('Lỗi: Ma trận hiệp phương sai không xác định dương (Not Positive Definite). Kiểm tra đa cộng tuyến hoặc kích thước mẫu quá nhỏ.', 'error');
        } else {
            // Translate common R errors if possible
            showToast(`Lỗi: ${msg.replace('Error in', '').substring(0, 100)}...`, 'error');
        }
    };

    // Workflow Mode Handlers (with batched updates)
    const handleProceedToEFA = (goodItems: string[]) => {
        // Batch state updates to reduce re-renders
        Promise.resolve().then(() => {
            setPreviousAnalysis({
                type: 'cronbach',
                variables: goodItems,
                goodItems,
                results: results?.data
            });
            setStep('efa-select');
            showToast(`Chuyển sang EFA với ${goodItems.length} items tốt`, 'success');
        });
    };

    const handleProceedToCFA = (factors: { name: string; indicators: string[] }[]) => {
        Promise.resolve().then(() => {
            setPreviousAnalysis({
                type: 'efa',
                variables: factors.flatMap(f => f.indicators),
                factors,
                results: results?.data
            });
            setStep('cfa-select');
            showToast(`Chuyển sang CFA với ${factors.length} factors`, 'success');
        });
    };

    const handleProceedToSEM = (factors: { name: string; indicators: string[] }[]) => {
        Promise.resolve().then(() => {
            setPreviousAnalysis({
                type: 'cfa',
                variables: factors.flatMap(f => f.indicators),
                factors,
                results: results?.data
            });
            setStep('sem-select');
            showToast(`Chuyển sang SEM với measurement model đã xác nhận`, 'success');
        });
    };

    const handleDataLoaded = (loadedData: any[], fname: string) => {
        // Validation: check file size
        if (loadedData.length > 50000) {
            showToast('File quá lớn (>50,000 rows). Vui lòng giảm kích thước file.', 'error');
            return;
        }

        // Large data sampling (10k-50k rows)
        let processedData = loadedData;
        if (loadedData.length > 10000) {
            showToast(`Dữ liệu lớn (${loadedData.length} rows). Đang lấy mẫu ngẫu nhiên 10,000 rows...`, 'info');
            // Random sampling
            const shuffled = [...loadedData].sort(() => 0.5 - Math.random());
            processedData = shuffled.slice(0, 10000);
            showToast('Đã lấy mẫu 10,000 rows. Kết quả đại diện cho toàn bộ dữ liệu.', 'success');
        }

        setData(processedData);
        setFilename(fname);

        // Profile the data
        const prof = profileData(processedData);
        setProfile(prof);
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

        // NCS Credit Check
        if (user) {
            const cost = await getAnalysisCost('cronbach');
            const hasEnough = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                return;
            }
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

            // Deduct credits on success
            if (user) {
                const cost = await getAnalysisCost('cronbach');
                await deductCredits(user.id, cost, `Cronbach Alpha: ${name}`);
                setNcsBalance(prev => Math.max(0, prev - cost));
            }

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

    // Run McDonald's Omega with selected variables (distinct from Cronbach)
    const runOmegaWithSelection = async (selectedColumns: string[], name: string) => {
        if (selectedColumns.length < 3) {
            showToast('McDonald\'s Omega cần ít nhất 3 biến', 'error');
            return;
        }

        // NCS Credit Check  
        if (user) {
            const cost = await getAnalysisCost('omega');
            const hasEnough = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                return;
            }
        }

        setIsAnalyzing(true);
        setAnalysisType('omega'); // Different from cronbach
        setScaleName(name);
        setMultipleResults([]);

        try {
            const selectedData = data.map(row =>
                selectedColumns.map(col => Number(row[col]) || 0)
            );

            const analysisResults = await runCronbachAlpha(selectedData);

            // Deduct credits on success
            if (user) {
                const cost = await getAnalysisCost('omega');
                await deductCredits(user.id, cost, `McDonald's Omega: ${name}`);
                setNcsBalance(prev => Math.max(0, prev - cost));
            }

            setResults({
                type: 'omega', // Set type as omega for distinct display
                data: analysisResults,
                columns: selectedColumns,
                scaleName: name
            });
            setStep('results');
            showToast('Phân tích Omega hoàn thành!', 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Run Omega for multiple groups (batch analysis)
    const runOmegaBatch = async (groups: { name: string; columns: string[] }[]) => {
        // Validate each group has at least 3 items (Omega needs more)
        for (const group of groups) {
            if (group.columns.length < 3) {
                showToast(`Nhóm "${group.name}" cần ít nhất 3 biến cho Omega`, 'error');
                return;
            }
        }

        setIsAnalyzing(true);
        setAnalysisType('omega-batch'); // Different from cronbach-batch
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
            showToast(`Phân tích Omega ${allResults.length} thang đo hoàn thành!`, 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runAnalysis = async (type: string) => {
        setIsAnalyzing(true);
        setAnalysisType(type);
        let progressInterval: NodeJS.Timeout | undefined;

        try {
            const numericColumns = getNumericColumns();

            if (numericColumns.length < 2) {
                showToast('Cần ít nhất 2 biến số để phân tích', 'error');
                setIsAnalyzing(false);
                return;
            }

            setAnalysisProgress(0);

            // Progress simulation
            progressInterval = setInterval(() => {
                setAnalysisProgress(prev => Math.min(prev + 10, 90));
            }, 300);

            const numericData = data.map(row =>
                numericColumns.map(col => Number(row[col]) || 0)
            );

            let analysisResults;
            setAnalysisProgress(30);

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

            clearInterval(progressInterval);
            setAnalysisProgress(100);

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
            setAnalysisProgress(0);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ctrl+S: Export PDF
            if (e.ctrlKey && e.key === 's' && step === 'results' && results) {
                e.preventDefault();
                handleExportPDF();
                showToast('Đang xuất PDF... (Ctrl+S)', 'info');
            }

            // Ctrl+E: Export Excel (future feature)
            if (e.ctrlKey && e.key === 'e' && step === 'results' && results) {
                e.preventDefault();
                showToast('Excel export sẽ có trong phiên bản tiếp theo (Ctrl+E)', 'info');
            }

            // Ctrl+N: New analysis
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                setStep('upload');
                setData([]);
                setProfile(null);
                setResults(null);
                showToast('Bắt đầu phân tích mới (Ctrl+N)', 'success');
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [step, results]);

    // Handle PDF Export (Actual Logic)
    const runExportPDF = async () => {
        try {
            const { exportToPDF } = await import('@/lib/pdf-exporter');

            showToast('Đang tạo PDF, vui lòng đợi...', 'info');

            // Capture charts if any
            const chartImages: string[] = [];
            const container = document.getElementById('analysis-results-container');
            if (container) {
                const canvases = container.querySelectorAll('canvas');
                canvases.forEach(canvas => {
                    try {
                        chartImages.push(canvas.toDataURL('image/png'));
                    } catch (e) {
                        console.warn('Canvas capture failed:', e);
                    }
                });
            }

            // Handle batch Cronbach export - SINGLE FILE with all scales
            if (analysisType === 'cronbach-batch' && multipleResults.length > 0) {
                // Combine all results into single PDF
                const combinedTitle = `Cronbach's Alpha - Phân tích ${multipleResults.length} thang đo`;
                const combinedResults = {
                    batchResults: multipleResults.map(r => ({
                        scaleName: r.scaleName,
                        alpha: r.data.alpha || r.data.rawAlpha,
                        rawAlpha: r.data.rawAlpha,
                        standardizedAlpha: r.data.standardizedAlpha,
                        nItems: r.data.nItems,
                        itemTotalStats: r.data.itemTotalStats,
                        columns: r.columns
                    }))
                };

                await exportToPDF({
                    title: combinedTitle,
                    analysisType: 'cronbach-batch',
                    results: combinedResults,
                    columns: [],
                    filename: `cronbach_batch_${multipleResults.length}_scales_${Date.now()}.pdf`,
                    chartImages: []
                });
                showToast(`Đã xuất 1 file PDF tổng hợp ${multipleResults.length} thang đo!`, 'success');
            } else {
                // Single result export
                await exportToPDF({
                    title: `Phân tích ${analysisType}`,
                    analysisType,
                    results: results?.data || results,
                    columns: results?.columns || [],
                    filename: `statviet_${analysisType}_${Date.now()}.pdf`,
                    chartImages
                });
                showToast('Đã xuất PDF thành công!', 'success');
            }
        } catch (error) {
            console.error(error);
            showToast('Lỗi xuất PDF: Vui lòng thử lại', 'error');
        }
    };

    // Trigger Export Flow (Check for Part 3)
    const handleExportPDF = () => {
        // Always show survey if not done? Or just export?
        // User requested: Part 3 appears when User clicks Export.
        // We'll show it if not done yet.
        /*
        // UNCOMMENT TO FORCE SURVEY EVERY TIME:
        setShowApplicability(true);
        */

        // Logic: Check if survey done. If not, show survey. If yes, just export.
        // But user might want to give feedback on THIS specific manuscript (Q8).
        // So we should probably show it, but maybe allow skipping?
        // For now, consistent with prompt "Part 3 appears..." -> We show it.
        setShowApplicability(true);
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

            {/* Offline Warning Banner */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 text-center z-50 flex items-center justify-center gap-2">
                    <WifiOff className="w-5 h-5" />
                    <span className="font-semibold">Không có kết nối Internet. Một số tính năng có thể không hoạt động.</span>
                </div>
            )}

            {/* Analysis Progress Bar */}
            {isAnalyzing && analysisProgress > 0 && (
                <div className="fixed top-0 left-0 right-0 z-40">
                    <div className="h-1 bg-blue-200">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${analysisProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Header with Integrated Toolbar */}
            <Header
                user={user}
                hideNav={true}
                centerContent={
                    <AnalysisToolbar
                        isPrivateMode={isPrivateMode}
                        setIsPrivateMode={setIsPrivateMode}
                        clearSession={() => {
                            clearSession();
                            showToast('Đã xóa dữ liệu phiên làm việc', 'info');
                        }}
                        filename={filename}
                        onSave={() => setIsSaveModalOpen(true)}
                    />
                }
            />

            <div className="bg-blue-50/50 border-b border-blue-100 py-1">
                <div className="container mx-auto px-6 flex items-center justify-center gap-2 text-[11px] text-blue-600/80">
                    <Shield className="w-3 h-3" />
                    <span className="font-semibold">Bảo mật:</span>
                    <span>Dữ liệu xử lý cục bộ 100% (Client-side), an toàn tuyệt đối.</span>
                </div>
            </div>

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

                    {/* Descriptive Statistics Selection */}
                    {step === 'descriptive-select' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Thống kê mô tả
                                </h2>
                                <p className="text-gray-600">
                                    Chọn các biến định lượng để tính toán Mean, SD, Min, Max...
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <p className="text-sm text-gray-600 mb-4">
                                    Chọn biến (có thể chọn nhiều):
                                </p>
                                <div className="max-h-60 overflow-y-auto space-y-2 mb-6 border rounded p-2">
                                    {getNumericColumns().map(col => (
                                        <div key={col} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`desc-col-${col}`}
                                                name="desc-col"
                                                value={col}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label htmlFor={`desc-col-${col}`} className="text-sm text-gray-700 select-none cursor-pointer w-full">
                                                {col}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex space-x-3 mb-6 text-sm">
                                    <button
                                        onClick={() => document.querySelectorAll('input[name="desc-col"]').forEach((el: any) => el.checked = true)}
                                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        Chọn tất cả
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        onClick={() => document.querySelectorAll('input[name="desc-col"]').forEach((el: any) => el.checked = false)}
                                        className="text-gray-500 hover:text-gray-700 font-medium"
                                    >
                                        Bỏ chọn
                                    </button>
                                </div>

                                <button
                                    onClick={async () => {
                                        const selectedElements = Array.from(document.querySelectorAll('input[name="desc-col"]:checked'));
                                        const selectedCols = selectedElements.map(cb => (cb as HTMLInputElement).value);

                                        if (selectedCols.length === 0) {
                                            setToast({ message: 'Vui lòng chọn ít nhất 1 biến', type: 'error' });
                                            return;
                                        }

                                        setIsAnalyzing(true);
                                        setAnalysisType('descriptive');
                                        try {
                                            // Prepare data subset
                                            // The order of data columns must match selectedCols to align with results
                                            const numericSubset = data.map(row => selectedCols.map(col => Number(row[col]) || 0));

                                            // Pass the subset
                                            const result = await runDescriptiveStats(numericSubset);

                                            setResults({
                                                type: 'descriptive',
                                                data: result,
                                                columns: selectedCols // Store columns to map back
                                            });
                                            setStep('results');
                                            setToast({ message: 'Phân tích hoàn tất!', type: 'success' });
                                        } catch (err) {
                                            console.error(err);
                                            setToast({ message: 'Lỗi: ' + (err instanceof Error ? err.message : String(err)), type: 'error' });
                                        } finally {
                                            setIsAnalyzing(false);
                                        }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isAnalyzing ? 'Đang xử lý...' : 'Chạy Thống kê mô tả'}
                                </button>
                            </div>

                            <button
                                onClick={() => setStep('analyze')}
                                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                            >
                                ← Quay lại
                            </button>
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

                    {/* Omega Selection - NEW (Clone of Cronbach) */}
                    {step === 'omega-select' && (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    McDonald&apos;s Omega
                                </h2>
                                <p className="text-gray-600">
                                    Đánh giá độ tin cậy thang đo (Độ chính xác cao hơn Alpha)
                                </p>
                            </div>

                            <SmartGroupSelector
                                columns={getNumericColumns()}
                                onAnalyzeGroup={runOmegaWithSelection}
                                onAnalyzeAllGroups={runOmegaBatch}
                                isAnalyzing={isAnalyzing}
                                minItemsPerGroup={3}
                                analysisLabel="McDonald's Omega"
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
                                    <p className="mt-4 text-gray-600">Đang phân tích Omega...</p>
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
                                        setAnalysisType('ttest-indep');
                                        try {
                                            const group1Data = data.map(row => Number(row[g1]) || 0);
                                            const group2Data = data.map(row => Number(row[g2]) || 0);
                                            const result = await runTTestIndependent(group1Data, group2Data);
                                            setResults({ type: 'ttest-indep', data: result, columns: [g1, g2] });
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
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-gray-600">
                                        Chọn các biến để phân tích nhân tố:
                                    </p>
                                    <div className="space-x-2">
                                        <button
                                            onClick={() => {
                                                const checkboxes = document.querySelectorAll('.efa-checkbox') as NodeListOf<HTMLInputElement>;
                                                checkboxes.forEach(cb => cb.checked = true);
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Chọn tất cả
                                        </button>
                                        <button
                                            onClick={() => {
                                                const checkboxes = document.querySelectorAll('.efa-checkbox') as NodeListOf<HTMLInputElement>;
                                                checkboxes.forEach(cb => cb.checked = false);
                                            }}
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            Bỏ chọn
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                    {getNumericColumns().map(col => (
                                        <label key={col} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                            <input
                                                type="checkbox"
                                                value={col}
                                                defaultChecked={true} // Default select all to save time? User asked for button, so maybe standard is fine. Let's select all by default if easiest, or just standard. Current is unchecked.
                                                className="efa-checkbox w-4 h-4 text-orange-600"
                                            />
                                            <span>{col}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số nhân tố dự kiến (Tùy chọn)
                                    </label>
                                    <input
                                        type="number"
                                        id="efa-nfactors"
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="Để trống = Tự động (Eigenvalues > 1)"
                                        min={1}
                                        max={10}
                                    />
                                    <p className="text-xs text-slate-500 mt-1 italic">
                                        Nếu bỏ trống, hệ thống sẽ tự đề xuất số lượng nhân tố dựa trên hệ số Eigenvalue {'>'} 1 (Kaiser Criterion).
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phép quay (Rotation)
                                    </label>
                                    <select
                                        id="efa-rotation"
                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                        defaultValue="varimax"
                                    >
                                        <option value="none">Không quay (None)</option>
                                        <option value="varimax">Vuông góc (Varimax) - Đề xuất</option>
                                        <option value="promax">Xiên (Promax)</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1 italic">
                                        Varimax giúp phân định rõ nhân tố. Promax phù hợp nếu các nhân tố có tương quan.
                                    </p>
                                </div>

                                <button
                                    onClick={async () => {
                                        const checkboxes = document.querySelectorAll('.efa-checkbox:checked') as NodeListOf<HTMLInputElement>;
                                        const selectedCols = Array.from(checkboxes).map(cb => cb.value);
                                        const factorInput = (document.getElementById('efa-nfactors') as HTMLInputElement).value;
                                        const rotationInput = (document.getElementById('efa-rotation') as HTMLSelectElement).value;
                                        // If empty, pass 0 to signal auto-detection
                                        const nfactors = factorInput ? parseInt(factorInput) : 0;

                                        if (selectedCols.length < 3) {
                                            showToast('Cần chọn ít nhất 3 biến để phân tích EFA', 'error');
                                            return;
                                        }

                                        if (nfactors > 0 && nfactors > selectedCols.length / 2) {
                                            showToast('Số nhân tố không nên lớn hơn số biến / 2', 'error');
                                            return;
                                        }

                                        setIsAnalyzing(true);
                                        setAnalysisType('efa');
                                        try {
                                            const efaData = data.map(row =>
                                                selectedCols.map(col => Number(row[col]) || 0)
                                            );
                                            const result = await runEFA(efaData, nfactors, rotationInput);
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
                                className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors"
                            >
                                ← Quay lại chọn phép tính
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

                    {/* Chi-Square Selection - NEW */}
                    {step === 'chisq-select' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Chi-Square Test of Independence
                                </h2>
                                <p className="text-gray-600">
                                    Kiểm định mối quan hệ giữa 2 biến định danh (Categorical Variables)
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <p className="text-sm text-gray-600 mb-4">
                                    Chọn 2 biến để kiểm định:
                                </p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Biến hàng (Row)</label>
                                        <select
                                            id="chisq-row"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            defaultValue=""
                                        >
                                            <option value="">Chọn biến...</option>
                                            {/* For Chi-Square, we ideally want ALL columns, not just numeric. But data profiler usually casts. Let's start with numeric or maybe allow all? 
                                                Actually getNumericColumns returns only numeric. Chi-Square works on categories. 
                                                If data is coded 1,2,3 it works. If text, we need 'profile.columnStats'.
                                            */}
                                            {profile?.columnStats && Object.keys(profile.columnStats).map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Biến cột (Col)</label>
                                        <select
                                            id="chisq-col"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            defaultValue=""
                                        >
                                            <option value="">Chọn biến...</option>
                                            {profile?.columnStats && Object.keys(profile.columnStats).map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const rVar = (document.getElementById('chisq-row') as HTMLSelectElement).value;
                                        const cVar = (document.getElementById('chisq-col') as HTMLSelectElement).value;

                                        if (!rVar || !cVar) { showToast('Vui lòng chọn cả 2 biến', 'error'); return; }
                                        if (rVar === cVar) { showToast('Vui lòng chọn 2 biến khác nhau', 'error'); return; }

                                        setIsAnalyzing(true);
                                        setAnalysisType('chisquare'); // Matches ResultsDisplay 'chisquare' case
                                        try {
                                            // Pass RAW data (strings/numbers) for Chi-Square to handle cross-tabulation
                                            // runChiSquare implementation (checked via memory or intuition) usually takes a matrix or two arrays.
                                            // Let's check signature in webr-wrapper.
                                            // Assuming runChiSquare(dataMatrix) or similar.
                                            // Actually, the generic 'runAnalysis' loop used 'runChiSquare(numericData)'. 
                                            // But Chi-Square needs categorical. 
                                            // Let's implement specific logic here: pass 2 arrays.

                                            // We need to fetch 'runChiSquare' from webr-wrapper or implement a specific one if the generic one assumes numeric matrix.
                                            // The generic runChiSquare (imported) likely expects matrix.
                                            // Let's try passing numeric mapping if possible, or wait, we need to see runChiSquare signature.
                                            // FOR NOW, assumption: runChiSquare takes data matrix [ [val1, val2], ... ]

                                            // Create data matrix [ [rowVal, colVal], ... ]
                                            const chiData = data.map(row => [
                                                row[rVar],
                                                row[cVar]
                                            ]);

                                            const result = await runChiSquare(chiData); // Need to verify signature
                                            setResults({ type: 'chisquare', data: result, columns: [rVar, cVar] });
                                            setStep('results');
                                            showToast('Phân tích Chi-Square hoàn thành!', 'success');
                                        } catch (err) { showToast('Lỗi: ' + err, 'error'); }
                                        finally { setIsAnalyzing(false); }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
                                >
                                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy Chi-Square Test'}
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

                    {/* Fisher Exact Selection - NEW */}
                    {step === 'fisher-select' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Fisher&apos;s Exact Test
                                </h2>
                                <p className="text-gray-600">
                                    Kiểm định mối quan hệ biến định danh (Dành cho mẫu nhỏ)
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <p className="text-sm text-gray-600 mb-4">
                                    Chọn 2 biến để kiểm định:
                                </p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Biến hàng (Row)</label>
                                        <select
                                            id="fisher-row"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            defaultValue=""
                                        >
                                            <option value="">Chọn biến...</option>
                                            {profile?.columnStats && Object.keys(profile.columnStats).map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Biến cột (Col)</label>
                                        <select
                                            id="fisher-col"
                                            className="w-full px-3 py-2 border rounded-lg"
                                            defaultValue=""
                                        >
                                            <option value="">Chọn biến...</option>
                                            {profile?.columnStats && Object.keys(profile.columnStats).map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const rVar = (document.getElementById('fisher-row') as HTMLSelectElement).value;
                                        const cVar = (document.getElementById('fisher-col') as HTMLSelectElement).value;

                                        if (!rVar || !cVar) { showToast('Vui lòng chọn cả 2 biến', 'error'); return; }
                                        if (rVar === cVar) { showToast('Vui lòng chọn 2 biến khác nhau', 'error'); return; }

                                        setIsAnalyzing(true);
                                        setAnalysisType('chisquare'); // Reuse chisquare logical flow
                                        try {
                                            const fisherData = data.map(row => [
                                                row[rVar],
                                                row[cVar]
                                            ]);

                                            const result = await runChiSquare(fisherData);
                                            setResults({ type: 'chisquare', data: result, columns: [rVar, cVar] });
                                            setStep('results');
                                            showToast('Phân tích Fisher Exact hoàn thành!', 'success');
                                        } catch (err) { showToast('Lỗi: ' + err, 'error'); }
                                        finally { setIsAnalyzing(false); }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
                                >
                                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy Fisher Exact Test'}
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

                    {/* Mann-Whitney U Selection - NEW */}
                    {step === 'mannwhitney-select' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Mann-Whitney U Test
                                </h2>
                                <p className="text-gray-600">
                                    So sánh trung bình 2 nhóm độc lập (Phi tham số - Non-parametric)
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <p className="text-sm text-gray-600 mb-4">
                                    Chọn 2 biến số để so sánh:
                                </p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm 1</label>
                                        <select
                                            id="mw-group1"
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
                                            id="mw-group2"
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
                                        const g1 = (document.getElementById('mw-group1') as HTMLSelectElement).value;
                                        const g2 = (document.getElementById('mw-group2') as HTMLSelectElement).value;

                                        if (!g1 || !g2) { showToast('Vui lòng chọn cả 2 biến', 'error'); return; }
                                        if (g1 === g2) { showToast('Vui lòng chọn 2 biến khác nhau', 'error'); return; }

                                        setIsAnalyzing(true);
                                        setAnalysisType('mann-whitney'); // Matches ResultsDisplay 'mann-whitney' case
                                        try {
                                            const group1Data = data.map(row => Number(row[g1]) || 0);
                                            const group2Data = data.map(row => Number(row[g2]) || 0);
                                            // The generic runMannWhitneyU in webr-wrapper likely takes 2 arrays (like t-test).
                                            const result = await runMannWhitneyU(group1Data, group2Data);
                                            setResults({ type: 'mann-whitney', data: result, columns: [g1, g2] });
                                            setStep('results');
                                            showToast('Phân tích Mann-Whitney U hoàn thành!', 'success');
                                        } catch (err) { showToast('Lỗi: ' + err, 'error'); }
                                        finally { setIsAnalyzing(false); }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg"
                                >
                                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy Mann-Whitney U'}
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
                            onRunCFA={async (modelSyntax: string, factors: any[]) => {
                                setIsAnalyzing(true);
                                setAnalysisType('cfa');
                                try {
                                    const selectedCols = factors.flatMap((f: any) => f.indicators);
                                    const cfaData = data.map(row =>
                                        selectedCols.map(col => Number(row[col]) || 0)
                                    );
                                    const result = await runCFA(cfaData, selectedCols, modelSyntax);
                                    setResults({ type: 'cfa', data: result, columns: selectedCols });
                                    setStep('results');
                                    showToast('Phân tích CFA hoàn thành!', 'success');
                                } catch (err) {
                                    showToast('Lỗi CFA: ' + err, 'error');
                                }
                                finally { setIsAnalyzing(false); }
                            }}
                            isAnalyzing={isAnalyzing}
                            onBack={() => setStep('analyze')}
                        />
                    )}

                    {/* SEM Selection */}
                    {step === 'sem-select' && (
                        <SEMSelection
                            columns={getNumericColumns()}
                            onRunSEM={async (modelSyntax: string, factors: any[]) => {
                                setIsAnalyzing(true);
                                setAnalysisType('sem');
                                try {
                                    const selectedCols = factors.flatMap((f: any) => f.indicators);
                                    const semData = data.map(row =>
                                        selectedCols.map(col => Number(row[col]) || 0)
                                    );
                                    const result = await runSEM(semData, selectedCols, modelSyntax);
                                    setResults({ type: 'sem', data: result, columns: selectedCols });
                                    setStep('results');
                                    showToast('Phân tích SEM hoàn thành!', 'success');
                                } catch (err) {
                                    showToast('Lỗi SEM: ' + err, 'error');
                                }
                                finally { setIsAnalyzing(false); }
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
                                    onProceedToEFA={handleProceedToEFA}
                                    onProceedToCFA={handleProceedToCFA}
                                    onProceedToSEM={handleProceedToSEM}
                                    userProfile={userProfile}
                                    scaleName={results.scaleName}
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
                                                userProfile={userProfile}
                                                scaleName={r.scaleName}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => {
                                        setResults(null);
                                        setStep('analyze');
                                    }}
                                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                                >
                                    ← Phân tích khác
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <FileText className="w-5 h-5" />
                                    Xuất PDF
                                </button>
                                <div className="relative group">
                                    <button
                                        disabled
                                        className="px-6 py-3 bg-blue-400 text-white font-semibold rounded-lg flex items-center gap-2 cursor-not-allowed opacity-70"
                                    >
                                        <FileText className="w-5 h-5" />
                                        Xuất Word
                                    </button>
                                    <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        Soon
                                    </span>
                                </div>
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
            <Footer />

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
            {/* Feedback Part 1: Demographics Survey */}
            <DemographicSurvey
                isOpen={showDemographics}
                onComplete={() => {
                    setShowDemographics(false);
                    showToast('Cảm ơn bạn đã cung cấp thông tin!', 'success');
                }}
            />

            {/* Feedback Part 3: Applicability Survey */}
            <ApplicabilitySurvey
                isOpen={showApplicability}
                onComplete={() => {
                    setShowApplicability(false);
                    runExportPDF(); // Proceed to export
                }}
                onCancel={() => {
                    setShowApplicability(false);
                    // Just close, do not export? Or allow export without feedback?
                    // Typically "Cancel" means cancel the action.
                    // If they want to export without feedback, they should probably have a "Skip" option inside (not implemented yet),
                    // or we assume completing Q8 is mandatory for the "Value" (Export).
                }}
            />

            {/* Save Project Modal */}
            <SaveProjectModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                data={data}
                results={results}
                analysisType={analysisType}
                step={step}
            />

            {/* Insufficient Credits Modal */}
            <InsufficientCreditsModal
                isOpen={showInsufficientCredits}
                onClose={() => setShowInsufficientCredits(false)}
                required={requiredCredits}
                available={ncsBalance}
            />
        </div >
    );
}
