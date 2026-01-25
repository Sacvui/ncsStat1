'use client';

import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Clock, Loader2, FileSpreadsheet, Settings, BarChart3, RefreshCw } from 'lucide-react';
import { TEST_DATA_SCALES, ANALYSIS_CONFIGS, DEFAULT_CFA_MODEL, DEFAULT_SEM_MODEL, AUTO_TEST_WORKFLOW } from '@/lib/auto-test-config';
import { runCronbachAlpha, runDescriptiveStats, runCorrelation, runEFA, runCFA, runSEM, initWebR, getWebRStatus } from '@/lib/webr-wrapper';

interface TestResult {
    analysisId: string;
    status: 'pending' | 'running' | 'success' | 'error';
    duration?: number;
    result?: any;
    error?: string;
}

interface AdminAutoTestProps {
    onTestComplete?: (results: TestResult[]) => void;
}

/**
 * Helper function to convert array of row objects to number[][] matrix
 * @param data - Array of row objects (e.g., [{ col1: 1, col2: 2 }, ...])
 * @param columns - Column names to extract
 * @returns number[][] matrix where each row contains values from specified columns
 */
function extractColumnsAsMatrix(data: any[], columns: string[]): number[][] {
    return data.map(row =>
        columns.map(col => {
            const val = row[col];
            const num = typeof val === 'number' ? val : parseFloat(val);
            return isNaN(num) ? 0 : num; // Replace NaN with 0 for robustness
        })
    );
}

// Convert test results to CSV string
export function generateCsv(results: TestResult[]): string {
    const header = ['analysisId', 'status', 'duration', 'result'];
    const rows = results.map(r => {
        const resultStr = typeof r.result === 'object' ? JSON.stringify(r.result) : String(r.result);
        return [r.analysisId, r.status, r.duration ?? '', resultStr];
    });
    const csvLines = [header.join(','), ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}`).join(','))];
    return csvLines.join('\n');
}

export function generateJson(results: TestResult[]): string {
    return JSON.stringify(results, null, 2);
}

// Export functionality moved inside component; placeholder to avoid lint errors.



export function AdminAutoTest({ onTestComplete }: AdminAutoTestProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [currentTest, setCurrentTest] = useState<string | null>(null);
    const [testData, setTestData] = useState<any[] | null>(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [webRReady, setWebRReady] = useState(false);
    const [progress, setProgress] = useState(0);

    // Export report function (CSV, JSON & PDF)
    const exportReport = async () => {
        if (!testResults || testResults.length === 0) return;
        const csvContent = generateCsv(testResults);
        const jsonContent = generateJson(testResults);
        const download = (content: string | Blob, filename: string, mime: string) => {
            const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        };
        download(csvContent, 'ncsStat_auto_test_report.csv', 'text/csv');
        download(jsonContent, 'ncsStat_auto_test_report.json', 'application/json');

        // Generate and download PDF
        const { generatePdf } = await import('./exportUtils');
        const pdfBlob = await generatePdf(testResults);
        download(pdfBlob, 'ncsStat_auto_test_report.pdf', 'application/pdf');
    };

    // Check WebR status
    useEffect(() => {
        const status = getWebRStatus();
        setWebRReady(status.isReady);

        if (!status.isReady && !status.isLoading) {
            initWebR().then(() => setWebRReady(true));
        }
    }, []);

    // Load test data
    const loadTestData = async () => {
        setDataLoading(true);
        try {
            const response = await fetch('/test_data_sem_cfa.csv');
            const text = await response.text();

            // Parse CSV
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                const row: any = {};
                headers.forEach((h, i) => {
                    const val = values[i]?.trim();
                    row[h] = val === '' ? null : parseFloat(val) || val;
                });
                return row;
            }).filter(row => Object.values(row).some(v => v !== null));

            setTestData(data);
            return data;
        } catch (error) {
            console.error('Failed to load test data:', error);
            return null;
        } finally {
            setDataLoading(false);
        }
    };

    // Initialize test results
    const initializeResults = () => {
        const initial: TestResult[] = AUTO_TEST_WORKFLOW.map(id => ({
            analysisId: id,
            status: 'pending'
        }));
        setTestResults(initial);
        return initial;
    };

    // Update single result
    const updateResult = (id: string, update: Partial<TestResult>) => {
        setTestResults(prev => prev.map(r =>
            r.analysisId === id ? { ...r, ...update } : r
        ));
    };

    // Run all tests
    const runAutoTest = async () => {
        setIsRunning(true);
        setProgress(0);

        // Load data first
        let data = testData;
        if (!data) {
            data = await loadTestData();
            if (!data) {
                setIsRunning(false);
                return;
            }
        }

        // Initialize results
        const results = initializeResults();

        // Run each analysis in sequence
        for (let i = 0; i < AUTO_TEST_WORKFLOW.length; i++) {
            const analysisId = AUTO_TEST_WORKFLOW[i];
            setCurrentTest(analysisId);
            updateResult(analysisId, { status: 'running' });

            const startTime = Date.now();

            try {
                let result: any;

                switch (analysisId) {
                    case 'descriptive':
                        // Run descriptive for first scale - extract columns as matrix
                        const descColumns = TEST_DATA_SCALES[0].items;
                        const descMatrix = extractColumnsAsMatrix(data, descColumns);
                        result = await runDescriptiveStats(descMatrix);
                        break;

                    case 'cronbach':
                        // Run Cronbach for all scales - extract columns as matrix
                        const cronbachResults = [];
                        for (const scale of TEST_DATA_SCALES) {
                            const cronMatrix = extractColumnsAsMatrix(data, scale.items);
                            const r = await runCronbachAlpha(cronMatrix, 1, 5);
                            cronbachResults.push({
                                scale: scale.name,
                                alpha: r.alpha,
                                omega: r.omega
                            });
                        }
                        result = cronbachResults;
                        break;

                    case 'correlation':
                        // Run correlation on composite scores (first item of each scale)
                        const corrVars = TEST_DATA_SCALES.map(s => s.items[0]);
                        const corrMatrix = extractColumnsAsMatrix(data, corrVars);
                        result = await runCorrelation(corrMatrix, 'pearson');
                        break;

                    case 'efa':
                        // Run EFA on all items - auto-detect factors (nFactors=0)
                        const efaVars = TEST_DATA_SCALES.flatMap(s => s.items);
                        const efaMatrix = extractColumnsAsMatrix(data, efaVars);
                        result = await runEFA(efaMatrix, 0, 'promax');
                        break;

                    case 'cfa':
                        // Run CFA with default model - need columns and syntax
                        const cfaVars = TEST_DATA_SCALES.flatMap(s => s.items);
                        const cfaMatrix = extractColumnsAsMatrix(data, cfaVars);
                        result = await runCFA(cfaMatrix, cfaVars, DEFAULT_CFA_MODEL.syntax);
                        break;

                    case 'regression':
                        // Skip for now - needs dependent variable
                        result = { skipped: true, reason: 'Requires dependent variable configuration' };
                        break;

                    case 'sem':
                        // Run SEM with default model - need columns and syntax
                        const semVars = TEST_DATA_SCALES.flatMap(s => s.items);
                        const semMatrix = extractColumnsAsMatrix(data, semVars);
                        const semSyntax = DEFAULT_SEM_MODEL.measurementModel + '\n' + DEFAULT_SEM_MODEL.structuralModel;
                        result = await runSEM(semMatrix, semVars, semSyntax);
                        break;

                    default:
                        result = { skipped: true, reason: 'Not implemented in auto test' };
                }

                const duration = Date.now() - startTime;
                updateResult(analysisId, {
                    status: 'success',
                    duration,
                    result
                });

            } catch (error: any) {
                const duration = Date.now() - startTime;
                updateResult(analysisId, {
                    status: 'error',
                    duration,
                    error: error.message || String(error)
                });
            }

            setProgress(((i + 1) / AUTO_TEST_WORKFLOW.length) * 100);
        }

        setCurrentTest(null);
        setIsRunning(false);

        // Callback
        if (onTestComplete) {
            onTestComplete(testResults);
        }
    };

    const getStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4 text-slate-400" />;
            case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
        }
    };

    const getAnalysisName = (id: string) => {
        return ANALYSIS_CONFIGS.find(c => c.id === id)?.name || id;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Auto Test Suite</h3>
                    <p className="text-sm text-slate-500">
                        Run all statistical analyses on test data automatically
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!webRReady && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Loading R Engine...
                        </span>
                    )}
                    <button
                        onClick={runAutoTest}
                        disabled={isRunning || !webRReady}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Run Auto Test
                            </>
                        )}
                    </button>
                    {/* Export Report Button */}
                    <button
                        onClick={exportReport}
                        disabled={isRunning || testResults.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Test Data Info */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                    <FileSpreadsheet className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-700">Test Data: test_data_sem_cfa.csv</span>
                    {testData && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {testData.length} observations loaded
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                    {TEST_DATA_SCALES.map(scale => (
                        <div key={scale.name} className="bg-white rounded px-2 py-1 border border-slate-200">
                            <span className="font-medium">{scale.name.split(' ')[0]}</span>
                            <span className="text-slate-400 ml-1">({scale.items.length} items)</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress Bar */}
            {isRunning && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Test Results */}
            {testResults.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-slate-700 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Test Results
                    </h4>
                    <div className="bg-white rounded-lg border border-slate-200 divide-y">
                        {testResults.map(result => (
                            <div
                                key={result.analysisId}
                                className={`p-3 flex items-center justify-between ${currentTest === result.analysisId ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(result.status)}
                                    <span className="font-medium text-slate-700">
                                        {getAnalysisName(result.analysisId)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    {result.duration && (
                                        <span className="text-slate-400">
                                            {(result.duration / 1000).toFixed(2)}s
                                        </span>
                                    )}
                                    {result.status === 'success' && (
                                        <span className="text-green-600 font-medium">✓ Pass</span>
                                    )}
                                    {result.status === 'error' && (
                                        <span className="text-red-600 text-xs max-w-[200px] truncate" title={result.error}>
                                            {result.error}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary */}
            {!isRunning && testResults.length > 0 && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-slate-700">
                                {testResults.length}
                            </div>
                            <div className="text-xs text-slate-500">Total Tests</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {testResults.filter(r => r.status === 'success').length}
                            </div>
                            <div className="text-xs text-slate-500">Passed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">
                                {testResults.filter(r => r.status === 'error').length}
                            </div>
                            <div className="text-xs text-slate-500">Failed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-600">
                                {(testResults.reduce((sum, r) => sum + (r.duration || 0), 0) / 1000).toFixed(1)}s
                            </div>
                            <div className="text-xs text-slate-500">Total Time</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminAutoTest;
