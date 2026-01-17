'use client';

import { Bar, Line, Scatter } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

interface ResultsDisplayProps {
    analysisType: string;
    results: any;
    columns: string[];
}

export function ResultsDisplay({ analysisType, results, columns }: ResultsDisplayProps) {
    if (analysisType === 'cronbach') {
        return <CronbachResults results={results} columns={columns} />;
    }

    if (analysisType === 'correlation') {
        return <CorrelationResults results={results} columns={columns} />;
    }

    if (analysisType === 'descriptive') {
        return <DescriptiveResults results={results} columns={columns} />;
    }

    if (analysisType === 'ttest') {
        return <TTestResults results={results} columns={columns} />;
    }

    if (analysisType === 'ttest-paired') {
        return <PairedTTestResults results={results} columns={columns} />;
    }

    if (analysisType === 'anova') {
        return <ANOVAResults results={results} columns={columns} />;
    }

    if (analysisType === 'efa') {
        return <EFAResults results={results} columns={columns} />;
    }

    if (analysisType === 'regression') {
        return <RegressionResults results={results} columns={columns} />;
    }

    if (analysisType === 'chisq') {
        return <ChiSquareResults results={results} />;
    }

    if (analysisType === 'mannwhitney') {
        return <MannWhitneyResults results={results} />;
    }

    return null;
}

// T-test Results Component
function TTestResults({ results, columns }: { results: any; columns: string[] }) {
    const pValue = results.pValue;
    const significant = pValue < 0.05;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Independent Samples T-test Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 font-medium">Group 1 ({columns[0]})</td>
                                <td className="py-2 text-right">Mean = {results.mean1?.toFixed(3)}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 font-medium">Group 2 ({columns[1]})</td>
                                <td className="py-2 text-right">Mean = {results.mean2?.toFixed(3)}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 font-medium">Mean Difference</td>
                                <td className="py-2 text-right font-bold">{results.meanDiff?.toFixed(3)}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 font-medium">t-statistic</td>
                                <td className="py-2 text-right">{results.t?.toFixed(3)}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 font-medium">Degrees of Freedom (df)</td>
                                <td className="py-2 text-right">{results.df?.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 font-medium">p-value (2-tailed)</td>
                                <td className={`py-2 text-right font-bold ${significant ? 'text-green-600' : 'text-gray-600'}`}>
                                    {pValue?.toFixed(4)} {significant && '***'}
                                </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 font-medium">95% CI</td>
                                <td className="py-2 text-right">[{results.ci95Lower?.toFixed(3)}, {results.ci95Upper?.toFixed(3)}]</td>
                            </tr>
                            <tr>
                                <td className="py-2 font-medium">Cohen&apos;s d (Effect Size)</td>
                                <td className="py-2 text-right">{results.effectSize?.toFixed(3)}</td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                <h4 className="font-bold mb-4 text-gray-800 uppercase text-xs tracking-wider">Kết luận</h4>
                <p className="text-sm text-gray-800">
                    {significant
                        ? `Có sự khác biệt có ý nghĩa thống kê giữa ${columns[0]} và ${columns[1]} (p = ${pValue?.toFixed(4)} < 0.05). Cohen's d = ${results.effectSize?.toFixed(2)} cho thấy ${Math.abs(results.effectSize) > 0.8 ? 'hiệu ứng lớn' : Math.abs(results.effectSize) > 0.5 ? 'hiệu ứng trung bình' : 'hiệu ứng nhỏ'}.`
                        : `Không có sự khác biệt có ý nghĩa thống kê giữa ${columns[0]} và ${columns[1]} (p = ${pValue?.toFixed(4)} >= 0.05).`
                    }
                </p>
            </div>
        </div>
    );
}

// ANOVA Results Component
function ANOVAResults({ results, columns }: { results: any; columns: string[] }) {
    const pValue = results.pValue;
    const significant = pValue < 0.05;

    return (
        <div className="space-y-6">
            <div className="bg-white border-t-2 border-b-2 border-black p-4">
                <h4 className="text-sm font-bold uppercase mb-4 tracking-wide text-gray-700">ANOVA Table</h4>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-400">
                            <th className="py-2 text-left font-semibold">Source</th>
                            <th className="py-2 text-right font-semibold">df</th>
                            <th className="py-2 text-right font-semibold">F</th>
                            <th className="py-2 text-right font-semibold">Sig.</th>
                            <th className="py-2 text-right font-semibold">η² (Eta Squared)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">Between Groups</td>
                            <td className="py-2 text-right">{results.dfBetween?.toFixed(0)}</td>
                            <td className="py-2 text-right font-bold">{results.F?.toFixed(3)}</td>
                            <td className={`py-2 text-right font-bold ${significant ? 'text-green-600' : 'text-gray-600'}`}>
                                {pValue?.toFixed(4)} {significant && '***'}
                            </td>
                            <td className="py-2 text-right">{results.etaSquared?.toFixed(3)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">Within Groups</td>
                            <td className="py-2 text-right">{results.dfWithin?.toFixed(0)}</td>
                            <td className="py-2 text-right">-</td>
                            <td className="py-2 text-right">-</td>
                            <td className="py-2 text-right">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-white border-t-2 border-b-2 border-black p-4">
                <h4 className="text-sm font-bold uppercase mb-4 tracking-wide text-gray-700">Group Means</h4>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-400">
                            <th className="py-2 text-left font-semibold">Group</th>
                            <th className="py-2 text-right font-semibold">Mean</th>
                        </tr>
                    </thead>
                    <tbody>
                        {columns.map((col, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="py-2 font-medium">{col}</td>
                                <td className="py-2 text-right">{results.groupMeans?.[idx]?.toFixed(3)}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50">
                            <td className="py-2 font-bold">Grand Mean</td>
                            <td className="py-2 text-right font-bold">{results.grandMean?.toFixed(3)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm">
                <h4 className="font-bold mb-4 text-gray-800 uppercase text-xs tracking-wider">Kết luận</h4>
                <p className="text-sm text-gray-800">
                    {significant
                        ? `Có sự khác biệt có ý nghĩa thống kê giữa các nhóm (F(${results.dfBetween?.toFixed(0)}, ${results.dfWithin?.toFixed(0)}) = ${results.F?.toFixed(3)}, p = ${pValue?.toFixed(4)} < 0.05). Eta-squared = ${results.etaSquared?.toFixed(3)} cho thấy ${results.etaSquared > 0.14 ? 'hiệu ứng lớn' : results.etaSquared > 0.06 ? 'hiệu ứng trung bình' : 'hiệu ứng nhỏ'}.`
                        : `Không có sự khác biệt có ý nghĩa thống kê giữa các nhóm (F(${results.dfBetween?.toFixed(0)}, ${results.dfWithin?.toFixed(0)}) = ${results.F?.toFixed(3)}, p = ${pValue?.toFixed(4)} >= 0.05).`
                    }
                </p>
            </div>
        </div>
    );
}

function CronbachResults({ results, columns }: { results: any; columns?: string[] }) {
    const alpha = results.alpha || results.rawAlpha || 0;
    const nItems = results.nItems || 'N/A';
    const itemTotalStats = results.itemTotalStats || [];

    // SPSS Style Table Component
    const SPSSTable = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="mb-8">
            <h4 className="text-sm font-bold uppercase mb-2 tracking-wide text-gray-700">{title}</h4>
            <div className="bg-white border-t-2 border-b-2 border-black">
                {children}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans text-gray-900">

            {/* Reliability Statistics Table - SPSS Style */}
            <SPSSTable title="Reliability Statistics">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-400">
                            <th className="py-2 pr-4 font-semibold">Cronbach&apos;s Alpha</th>
                            <th className="py-2 pr-4 font-semibold">N of Items</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="py-2 pr-4">{alpha.toFixed(3)}</td>
                            <td className="py-2 pr-4">{nItems}</td>
                        </tr>
                    </tbody>
                </table>
            </SPSSTable>

            {/* Item-Total Statistics Table - SPSS Style */}
            {itemTotalStats.length > 0 && (
                <SPSSTable title="Item-Total Statistics">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-400">
                                <th className="py-2 px-3 font-semibold"></th>
                                <th className="py-2 px-3 font-semibold text-right">Scale Mean if Item Deleted</th>
                                <th className="py-2 px-3 font-semibold text-right">Scale Variance if Item Deleted</th>
                                <th className="py-2 px-3 font-semibold text-right">Corrected Item-Total Correlation</th>
                                <th className="py-2 px-3 font-semibold text-right">Cronbach&apos;s Alpha if Item Deleted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemTotalStats.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-2 px-3 font-medium">
                                        {columns?.[idx] || item.itemName}
                                    </td>
                                    <td className="py-2 px-3 text-right">{item.scaleMeanIfDeleted?.toFixed(3) || '-'}</td>
                                    <td className="py-2 px-3 text-right">{item.scaleVarianceIfDeleted?.toFixed(3) || '-'}</td>
                                    <td className={`py-2 px-3 text-right ${item.correctedItemTotalCorrelation < 0.3 ? 'text-red-600 font-bold' : ''}`}>
                                        {item.correctedItemTotalCorrelation?.toFixed(3) || '-'}
                                    </td>
                                    <td className={`py-2 px-3 text-right ${item.alphaIfItemDeleted > alpha ? 'text-orange-600 font-bold' : ''}`}>
                                        {item.alphaIfItemDeleted?.toFixed(3) || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-xs text-gray-500 italic p-2">
                        * Corrected Item-Total Correlation &lt; 0.3 được đánh dấu đỏ (cần xem xét loại bỏ).
                        Alpha if Item Deleted &gt; Alpha hiện tại được đánh dấu cam (loại bỏ có thể cải thiện độ tin cậy).
                    </p>
                </SPSSTable>
            )}

            {/* Interpretation Section */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm">
                <h4 className="font-bold mb-4 text-gray-800 uppercase text-xs tracking-wider">Đánh Giá &amp; Khuyến Nghị</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="text-sm font-medium mb-2 text-gray-600">Độ tin cậy thang đo:</div>
                        <div className={`text-2xl font-bold ${alpha >= 0.7 ? 'text-green-700' : 'text-orange-600'}`}>
                            {alpha >= 0.9 ? 'Xuất sắc' :
                                alpha >= 0.8 ? 'Tốt' :
                                    alpha >= 0.7 ? 'Chấp nhận được' :
                                        alpha >= 0.6 ? 'Khá' : 'Kém'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium mb-2 text-gray-600">Khuyến nghị:</div>
                        <p className="text-sm text-gray-800 leading-relaxed">
                            {alpha >= 0.7
                                ? 'Thang đo đảm bảo độ tin cậy. Có thể sử dụng cho các phân tích tiếp theo.'
                                : 'Cần xem xét loại bỏ biến quan sát rác hoặc kiểm tra lại cấu trúc thang đo.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CorrelationResults({ results, columns }: { results: any; columns: string[] }) {
    const matrix = results.correlationMatrix;

    // SmartPLS/SPSS Style Matrix
    return (
        <div className="space-y-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide border-b-2 border-black pb-2 inline-block">Ma Trận Tương Quan</h3>

            <table className="min-w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="py-3 px-4 text-left font-semibold bg-gray-50 border-r border-gray-200">Construct</th>
                        {columns.map((col, idx) => (
                            <th key={idx} className="py-3 px-4 font-semibold text-center border-b border-gray-300">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {matrix.map((row: number[], rowIdx: number) => (
                        <tr key={rowIdx} className="border-b border-gray-200 last:border-b-2 last:border-black">
                            <td className="py-3 px-4 font-medium border-r border-gray-200 bg-gray-50">
                                {columns[rowIdx]}
                            </td>
                            {row.map((value: number, colIdx: number) => {
                                const absVal = Math.abs(value);
                                let bgColor = 'transparent';
                                let textColor = 'text-gray-600';

                                if (rowIdx !== colIdx) {
                                    if (value > 0) {
                                        // Blue scale
                                        bgColor = `rgba(59, 130, 246, ${absVal * 0.8})`;
                                        textColor = absVal > 0.5 ? 'text-white font-bold' : 'text-gray-800';
                                    } else {
                                        // Red scale
                                        bgColor = `rgba(239, 68, 68, ${absVal * 0.8})`;
                                        textColor = absVal > 0.5 ? 'text-white font-bold' : 'text-gray-800';
                                    }
                                } else {
                                    return (
                                        <td key={colIdx} className="py-3 px-4 text-center bg-gray-100 font-bold text-gray-400">
                                            1.000
                                        </td>
                                    );
                                }

                                return (
                                    <td
                                        key={colIdx}
                                        className={`py-3 px-4 text-center ${textColor}`}
                                        style={{ backgroundColor: bgColor }}
                                    >
                                        {value.toFixed(3)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex gap-4 items-center text-xs mt-3">
                <div className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-blue-500 opacity-80"></span>
                    <span>Tương quan Dương (Mạnh)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-red-500 opacity-80"></span>
                    <span>Tương quan Âm (Mạnh)</span>
                </div>
            </div>
            <p className="text-xs text-gray-500 italic mt-1">* Màu sắc đậm nhạt thể hiện mức độ tương quan.</p>
        </div>
    );
}

function DescriptiveResults({ results, columns }: { results: any; columns: string[] }) {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Descriptive Statistics</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="py-3 px-4 font-semibold text-gray-700">Variable</th>
                                <th className="py-3 px-4 font-semibold text-right text-gray-700">N</th>
                                <th className="py-3 px-4 font-semibold text-right text-gray-700">Min</th>
                                <th className="py-3 px-4 font-semibold text-right text-gray-700">Max</th>
                                <th className="py-3 px-4 font-semibold text-right text-gray-700">Mean</th>
                                <th className="py-3 px-4 font-semibold text-right text-gray-700">SD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map((col, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-gray-900">{col}</td>
                                    <td className="py-3 px-4 text-right text-gray-600">{results.N || 'N/A'}</td>
                                    <td className="py-3 px-4 text-right text-gray-600">{(results.min && results.min[idx] !== undefined) ? results.min[idx].toFixed(3) : '-'}</td>
                                    <td className="py-3 px-4 text-right text-gray-600">{(results.max && results.max[idx] !== undefined) ? results.max[idx].toFixed(3) : '-'}</td>
                                    <td className="py-3 px-4 text-right text-gray-900 font-bold">{(results.mean && results.mean[idx] !== undefined) ? results.mean[idx].toFixed(3) : '-'}</td>
                                    <td className="py-3 px-4 text-right text-gray-600">{(results.sd && results.sd[idx] !== undefined) ? results.sd[idx].toFixed(3) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mean Value Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80 w-full">
                        <Bar
                            data={{
                                labels: columns,
                                datasets: [{
                                    label: 'Mean',
                                    data: results.mean,
                                    backgroundColor: 'rgba(79, 70, 229, 0.7)', // Indigo-600 with opacity
                                    borderColor: 'rgba(79, 70, 229, 1)',
                                    borderWidth: 1,
                                    borderRadius: 4,
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                        padding: 12,
                                        cornerRadius: 8,
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: '#f3f4f6' },
                                        ticks: { font: { size: 11 } }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { font: { size: 11 } }
                                    }
                                }
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Paired T-test Results Component
function PairedTTestResults({ results, columns }: { results: any; columns: string[] }) {
    const pValue = results.pValue;
    const significant = pValue < 0.05;

    return (
        <div className="space-y-6">
            <div className="bg-white border-t-2 border-b-2 border-black p-4">
                <h4 className="text-sm font-bold uppercase mb-4 tracking-wide text-gray-700">Paired Samples T-test Results</h4>
                <table className="w-full text-sm">
                    <tbody>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">Before ({columns[0]})</td>
                            <td className="py-2 text-right">Mean = {results.meanBefore?.toFixed(3)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">After ({columns[1]})</td>
                            <td className="py-2 text-right">Mean = {results.meanAfter?.toFixed(3)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">Mean Difference (Before - After)</td>
                            <td className="py-2 text-right font-bold">{results.meanDiff?.toFixed(3)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">t-statistic</td>
                            <td className="py-2 text-right">{results.t?.toFixed(3)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">Degrees of Freedom (df)</td>
                            <td className="py-2 text-right">{results.df?.toFixed(0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">p-value (2-tailed)</td>
                            <td className={`py-2 text-right font-bold ${significant ? 'text-green-600' : 'text-gray-600'}`}>
                                {pValue?.toFixed(4)} {significant && '***'}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 font-medium">95% CI</td>
                            <td className="py-2 text-right">[{results.ci95Lower?.toFixed(3)}, {results.ci95Upper?.toFixed(3)}]</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm">
                <h4 className="font-bold mb-4 text-gray-800 uppercase text-xs tracking-wider">Kết luận</h4>
                <p className="text-sm text-gray-800">
                    {significant
                        ? `Có sự thay đổi có ý nghĩa thống kê giữa trước (${columns[0]}) và sau (${columns[1]}) (p = ${pValue?.toFixed(4)} < 0.05). Trung bình thay đổi ${results.meanDiff > 0 ? 'giảm' : 'tăng'} ${Math.abs(results.meanDiff)?.toFixed(3)} đơn vị.`
                        : `Không có sự thay đổi có ý nghĩa thống kê giữa trước và sau (p = ${pValue?.toFixed(4)} >= 0.05).`
                    }
                </p>
            </div>
        </div>
    );
}

// EFA Results Component
function EFAResults({ results, columns }: { results: any; columns: string[] }) {
    const kmo = results.kmo || 0;
    const bartlettP = results.bartlettP || 1;
    const kmoAcceptable = kmo >= 0.6;
    const bartlettSignificant = bartlettP < 0.05;

    return (
        <div className="space-y-6">
            {/* KMO and Bartlett's Test */}
            <div className="bg-white border-t-2 border-b-2 border-black p-4">
                <h4 className="text-sm font-bold uppercase mb-4 tracking-wide text-gray-700">KMO and Bartlett&apos;s Test</h4>
                <table className="w-full text-sm">
                    <tbody>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">Kaiser-Meyer-Olkin Measure of Sampling Adequacy</td>
                            <td className={`py-2 text-right font-bold ${kmoAcceptable ? 'text-green-600' : 'text-red-600'}`}>
                                {kmo.toFixed(3)}
                            </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-medium">Bartlett&apos;s Test of Sphericity (Sig.)</td>
                            <td className={`py-2 text-right font-bold ${bartlettSignificant ? 'text-green-600' : 'text-red-600'}`}>
                                {bartlettP < 0.001 ? '< .001' : bartlettP.toFixed(4)} {bartlettSignificant && '***'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Loadings Matrix */}
            {results.loadings && (
                <div className="bg-white border-t-2 border-b-2 border-black p-4">
                    <h4 className="text-sm font-bold uppercase mb-4 tracking-wide text-gray-700">Factor Loadings (Rotated)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-400">
                                    <th className="py-2 px-3 text-left font-semibold">Variable</th>
                                    {Array.isArray(results.loadings[0]) && results.loadings[0].map((_: any, idx: number) => (
                                        <th key={idx} className="py-2 px-3 text-right font-semibold">Factor {idx + 1}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {columns.map((col, rowIdx) => (
                                    <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-2 px-3 font-medium">{col}</td>
                                        {Array.isArray(results.loadings[rowIdx]) && results.loadings[rowIdx].map((val: number, colIdx: number) => (
                                            <td
                                                key={colIdx}
                                                className={`py-2 px-3 text-right ${Math.abs(val) >= 0.5 ? 'font-bold text-blue-700' : Math.abs(val) >= 0.3 ? 'text-gray-700' : 'text-gray-400'}`}
                                            >
                                                {val?.toFixed(3) || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-xs text-gray-500 italic mt-2">
                            * Factor loadings ≥ 0.5 được tô đậm. Loadings ≥ 0.3 được giữ lại.
                        </p>
                    </div>
                </div>
            )}

            {/* Communalities */}
            {results.communalities && (
                <div className="bg-white border-t-2 border-b-2 border-black p-4">
                    <h4 className="text-sm font-bold uppercase mb-4 tracking-wide text-gray-700">Communalities</h4>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-400">
                                <th className="py-2 px-3 text-left font-semibold">Variable</th>
                                <th className="py-2 px-3 text-right font-semibold">Extraction</th>
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map((col, idx) => (
                                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-2 px-3 font-medium">{col}</td>
                                    <td className={`py-2 px-3 text-right ${results.communalities[idx] < 0.4 ? 'text-red-600' : ''}`}>
                                        {results.communalities[idx]?.toFixed(3) || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-xs text-gray-500 italic mt-2">
                        * Communality &lt; 0.4 được đánh dấu đỏ (biến giải thích kém).
                    </p>
                </div>
            )}

            {/* Interpretation */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm">
                <h4 className="font-bold mb-4 text-gray-800 uppercase text-xs tracking-wider">Đánh giá & Khuyến nghị</h4>
                <div className="space-y-3 text-sm text-gray-800">
                    <p>
                        <strong>KMO = {kmo.toFixed(3)}:</strong>{' '}
                        {kmo >= 0.9 ? 'Tuyệt vời' : kmo >= 0.8 ? 'Rất tốt' : kmo >= 0.7 ? 'Tốt' : kmo >= 0.6 ? 'Chấp nhận được' : 'Không phù hợp để phân tích nhân tố'}
                    </p>
                    <p>
                        <strong>Bartlett&apos;s Test:</strong>{' '}
                        {bartlettSignificant
                            ? 'Có ý nghĩa thống kê (p < 0.05), ma trận tương quan phù hợp để phân tích nhân tố.'
                            : 'Không có ý nghĩa thống kê, dữ liệu có thể không phù hợp cho EFA.'
                        }
                    </p>
                    {kmoAcceptable && bartlettSignificant ? (
                        <p className="text-green-700 font-medium">
                            ✓ Dữ liệu phù hợp để tiến hành phân tích nhân tố.
                        </p>
                    ) : (
                        <p className="text-red-600 font-medium">
                            ✗ Dữ liệu có thể không phù hợp để phân tích nhân tố. Cần xem xét lại mẫu hoặc biến quan sát.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function RegressionResults({ results, columns }: { results: any, columns: string[] }) {
    if (!results || !results.modelFit) return null;

    const { modelFit, coefficients, equation } = results;

    return (
        <div className="space-y-8 font-sans">
            {/* Equation */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg text-white shadow-lg">
                <h4 className="font-bold text-sm uppercase tracking-wider mb-2 opacity-80">Phương trình hồi quy tuyến tính</h4>
                <div className="text-xl md:text-2xl font-mono font-bold break-all">
                    {equation}
                </div>
            </div>

            {/* Model Summary */}
            <div className="bg-white border-t-2 border-b-2 border-black p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold uppercase tracking-widest border-b-2 border-black inline-block pb-1">Model Summary</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div className="p-4 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500 uppercase font-semibold mb-1">R Square</div>
                        <div className="text-2xl font-bold text-blue-700">{modelFit.rSquared.toFixed(3)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500 uppercase font-semibold mb-1">Adjusted R²</div>
                        <div className="text-2xl font-bold text-blue-600">{modelFit.adjRSquared.toFixed(3)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500 uppercase font-semibold mb-1">F Statistic</div>
                        <div className="text-xl font-bold text-gray-800">{modelFit.fStatistic.toFixed(2)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500 uppercase font-semibold mb-1">Sig. (ANOVA)</div>
                        <div className={`text-xl font-bold ${modelFit.pValue < 0.05 ? 'text-green-600' : 'text-red-500'}`}>
                            {modelFit.pValue < 0.001 ? '< .001' : modelFit.pValue.toFixed(3)}
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-500 italic mt-4 text-center">
                    Mô hình giải thích được <strong>{(modelFit.adjRSquared * 100).toFixed(1)}%</strong> biến thiên của biến phục thuộc.
                </p>
            </div>

            {/* Coefficients */}
            <div className="bg-white border-t-2 border-b-2 border-black p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold uppercase tracking-widest border-b-2 border-black inline-block pb-1">Coefficients</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-400 bg-gray-50">
                                <th className="py-3 px-4 text-left font-bold uppercase text-xs tracking-wider">Model</th>
                                <th className="py-3 px-4 text-right font-bold uppercase text-xs tracking-wider">Unstandardized B</th>
                                <th className="py-3 px-4 text-right font-bold uppercase text-xs tracking-wider">Std. Error</th>
                                <th className="py-3 px-4 text-right font-bold uppercase text-xs tracking-wider">t</th>
                                <th className="py-3 px-4 text-right font-bold uppercase text-xs tracking-wider">Sig.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coefficients.map((coef: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-gray-800">
                                        {coef.term === '(Intercept)' ? '(Constant)' : coef.term.replace(/`/g, '')}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-medium">
                                        {coef.estimate.toFixed(3)}
                                    </td>
                                    <td className="py-3 px-4 text-right text-gray-600">
                                        {coef.stdError.toFixed(3)}
                                    </td>
                                    <td className="py-3 px-4 text-right text-gray-600">
                                        {coef.tValue.toFixed(3)}
                                    </td>
                                    <td className={`py-3 px-4 text-right font-bold ${coef.pValue < 0.05 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {coef.pValue < 0.001 ? '< .001' : coef.pValue.toFixed(3)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Conclusion */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm">
                <h4 className="font-bold mb-3 text-gray-800 uppercase text-xs tracking-wider">Kết luận</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
                    <li>
                        Mô hình hồi quy <strong>{modelFit.pValue < 0.05 ? 'có ý nghĩa thống kê' : 'không có ý nghĩa thống kê'}</strong> (F = {modelFit.fStatistic.toFixed(2)}, p {modelFit.pValue < 0.001 ? '< .001' : `= ${modelFit.pValue.toFixed(3)}`}).
                    </li>
                    <li>
                        Các biến độc lập tác động có ý nghĩa (p &lt; 0.05):{' '}
                        {coefficients.filter((c: any) => c.term !== '(Intercept)' && c.pValue < 0.05).length > 0
                            ? coefficients
                                .filter((c: any) => c.term !== '(Intercept)' && c.pValue < 0.05)
                                .map((c: any) => c.term.replace(/`/g, ''))
                                .join(', ')
                            : 'Không có biến nào.'
                        }
                    </li>
                </ul>
            </div>

            {/* Charts: Actual vs Predicted */}
            {results.chartData && (
                <div className="bg-white border-t-2 border-b-2 border-black p-6 mt-8">
                    <h3 className="text-lg font-bold uppercase tracking-widest border-b-2 border-black inline-block pb-1 mb-6">
                        Actual vs Predicted
                    </h3>
                    <div className="h-80 w-full">
                        <Scatter
                            data={{
                                datasets: [
                                    {
                                        label: 'Quan sát',
                                        data: results.chartData.actual.map((val: number, i: number) => ({
                                            x: results.chartData.fitted[i], // X = Predicted
                                            y: val // Y = Actual
                                        })),
                                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                                        borderColor: 'rgba(59, 130, 246, 1)',
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: {
                                        title: { display: true, text: 'Giá trị Dự báo (Predicted)' }
                                    },
                                    y: {
                                        title: { display: true, text: 'Giá trị Thực tế (Actual)' }
                                    }
                                },
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const point = context.raw as { x: number, y: number };
                                                return `Pred: ${point.x.toFixed(2)}, Act: ${point.y.toFixed(2)}`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 italic mt-2 text-center">
                        Biểu đồ phân tán giữa giá trị dự báo và giá trị thực tế.
                    </p>
                </div>
            )}
        </div>
    );
}

function ChiSquareResults({ results }: { results: any }) {
    if (!results) return null;

    const { statistic, df, pValue, observed, expected } = results;

    return (
        <div className="space-y-8 font-sans">
            <div className="bg-white border-t-2 border-b-2 border-teal-600 p-6">
                <h3 className="text-lg font-bold uppercase tracking-widest border-b-2 border-teal-600 inline-block pb-1 mb-4 text-teal-800">
                    Chi-Square Test Result
                </h3>
                <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="p-4 bg-teal-50 rounded">
                        <div className="text-sm text-gray-500 uppercase font-semibold mb-1">X-squared</div>
                        <div className="text-2xl font-bold text-teal-700">{statistic.toFixed(3)}</div>
                    </div>
                    <div className="p-4 bg-teal-50 rounded">
                        <div className="text-sm text-gray-500 uppercase font-semibold mb-1">df</div>
                        <div className="text-2xl font-bold text-teal-600">{df}</div>
                    </div>
                    <div className="p-4 bg-teal-50 rounded">
                        <div className="text-sm text-gray-500 uppercase font-semibold mb-1">p-value</div>
                        <div className={`text-xl font-bold ${pValue < 0.05 ? 'text-green-600' : 'text-red-500'}`}>
                            {pValue < 0.001 ? '< .001' : pValue.toFixed(4)}
                        </div>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center italic">
                    {pValue < 0.05
                        ? 'Có mối liên hệ có ý nghĩa thống kê giữa hai biến (H0 bị bác bỏ).'
                        : 'Không có mối liên hệ có ý nghĩa thống kê giữa hai biến (Chưa đủ bằng chứng bác bỏ H0).'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Observed Counts */}
                <div className="bg-white border border-gray-200 p-4 shadow-sm">
                    <h4 className="font-bold mb-3 text-teal-800 uppercase text-xs tracking-wider">Bảng Tần số Quan sát (Observed)</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-2 border"></th>
                                    {observed.cols.map((c: string, i: number) => <th key={i} className="p-2 border font-semibold">{c}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {observed.rows.map((r: string, idx: number) => (
                                    <tr key={idx}>
                                        <td className="p-2 border font-semibold bg-gray-50">{r}</td>
                                        {observed.data[idx].map((val: number, i: number) => (
                                            <td key={i} className="p-2 border text-center">{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expected Counts */}
                <div className="bg-white border border-gray-200 p-4 shadow-sm">
                    <h4 className="font-bold mb-3 text-gray-600 uppercase text-xs tracking-wider">Bảng Tần số Kỳ vọng (Expected)</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-collapse text-gray-500">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-2 border"></th>
                                    {expected.cols.map((c: string, i: number) => <th key={i} className="p-2 border font-medium">{c}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {expected.rows.map((r: string, idx: number) => (
                                    <tr key={idx}>
                                        <td className="p-2 border font-medium bg-gray-50">{r}</td>
                                        {expected.data[idx].map((val: number, i: number) => (
                                            <td key={i} className="p-2 border text-center">{val.toFixed(1)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MannWhitneyResults({ results }: { results: any }) {
    if (!results) return null;
    const { statistic, pValue, method, groupStats } = results;

    return (
        <div className="space-y-8 font-sans">
            <div className="bg-white border-t-2 border-b-2 border-cyan-600 p-6">
                <h3 className="text-lg font-bold uppercase tracking-widest border-b-2 border-cyan-600 inline-block pb-1 mb-4 text-cyan-800">
                    {method}
                </h3>
                <div className="grid grid-cols-2 gap-6 text-center max-w-2xl mx-auto">
                    <div className="p-4 bg-cyan-50 rounded">
                        <div className="text-sm text-gray-500 uppercase font-semibold mb-1">Statistic (W)</div>
                        <div className="text-2xl font-bold text-cyan-700">{statistic}</div>
                    </div>
                    <div className="p-4 bg-cyan-50 rounded">
                        <div className="text-sm text-gray-500 uppercase font-semibold mb-1">p-value</div>
                        <div className={`text-xl font-bold ${pValue < 0.05 ? 'text-green-600' : 'text-red-500'}`}>
                            {pValue < 0.001 ? '< .001' : pValue.toFixed(4)}
                        </div>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center italic">
                    {pValue < 0.05
                        ? 'Có sự khác biệt có ý nghĩa thống kê giữa hai nhóm (H0 bị bác bỏ).'
                        : 'Không có sự khác biệt có ý nghĩa thống kê giữa hai nhóm (Chưa đủ bằng chứng bác bỏ H0).'}
                </p>
            </div>

            <div className="bg-gray-50 p-6 border rounded-sm max-w-2xl mx-auto">
                <h4 className="font-bold mb-3 text-cyan-800 uppercase text-xs tracking-wider">Median Comparison</h4>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-300">
                            <th className="py-2 text-left">Group</th>
                            <th className="py-2 text-right">Median</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupStats.groups.map((g: string, i: number) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-2 font-medium">{g}</td>
                                <td className="py-2 text-right font-bold text-gray-700">{groupStats.medians[i].toFixed(3)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
