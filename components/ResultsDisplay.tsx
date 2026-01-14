'use client';

import { Bar, Line } from 'react-chartjs-2';
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
        return <CronbachResults results={results} />;
    }

    if (analysisType === 'correlation') {
        return <CorrelationResults results={results} columns={columns} />;
    }

    if (analysisType === 'descriptive') {
        return <DescriptiveResults results={results} columns={columns} />;
    }

    return null;
}

function CronbachResults({ results }: { results: any }) {
    const alpha = results.alpha || results.rawAlpha || 0;

    const getAlphaInterpretation = (value: number) => {
        if (value >= 0.9) return { text: 'Xuất sắc', color: 'text-green-600', bg: 'bg-green-50' };
        if (value >= 0.8) return { text: 'Tốt', color: 'text-blue-600', bg: 'bg-blue-50' };
        if (value >= 0.7) return { text: 'Chấp nhận được', color: 'text-yellow-600', bg: 'bg-yellow-50' };
        if (value >= 0.6) return { text: 'Khá', color: 'text-orange-600', bg: 'bg-orange-50' };
        return { text: 'Kém', color: 'text-red-600', bg: 'bg-red-50' };
    };

    const interpretation = getAlphaInterpretation(alpha);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Cronbach's Alpha</h3>

                {/* Alpha Value Card */}
                <div className={`${interpretation.bg} rounded-xl p-8 mb-6`}>
                    <div className="text-center">
                        <p className="text-gray-600 mb-2">Hệ số Cronbach's Alpha</p>
                        <p className={`text-6xl font-bold ${interpretation.color} mb-2`}>
                            {alpha.toFixed(3)}
                        </p>
                        <p className={`text-xl font-semibold ${interpretation.color}`}>
                            {interpretation.text}
                        </p>
                    </div>
                </div>

                {/* Interpretation Guide */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-bold mb-4">Cách Diễn Giải:</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                            <span className="w-20 font-medium">α ≥ 0.9:</span>
                            <span className="text-green-600">Xuất sắc - Độ tin cậy rất cao</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-20 font-medium">0.8 ≤ α &lt; 0.9:</span>
                            <span className="text-blue-600">Tốt - Độ tin cậy cao</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-20 font-medium">0.7 ≤ α &lt; 0.8:</span>
                            <span className="text-yellow-600">Chấp nhận được</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-20 font-medium">0.6 ≤ α &lt; 0.7:</span>
                            <span className="text-orange-600">Khá - Cần cải thiện</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-20 font-medium">α &lt; 0.6:</span>
                            <span className="text-red-600">Kém - Không chấp nhận được</span>
                        </div>
                    </div>
                </div>

                {/* Recommendation */}
                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-gray-700">
                        <strong>Khuyến nghị:</strong> {alpha >= 0.7
                            ? 'Thang đo có độ tin cậy tốt, có thể sử dụng cho nghiên cứu.'
                            : 'Nên xem xét loại bỏ một số item hoặc điều chỉnh thang đo để cải thiện độ tin cậy.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function CorrelationResults({ results, columns }: { results: any; columns: string[] }) {
    const matrix = results.correlationMatrix;

    const getCorrelationColor = (value: number) => {
        if (value >= 0.7) return 'bg-green-500';
        if (value >= 0.5) return 'bg-green-300';
        if (value >= 0.3) return 'bg-yellow-300';
        if (value >= 0) return 'bg-gray-200';
        if (value >= -0.3) return 'bg-orange-200';
        if (value >= -0.5) return 'bg-orange-400';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Ma Trận Tương Quan</h3>

                {/* Correlation Matrix Heatmap */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 border"></th>
                                {columns.map((col, idx) => (
                                    <th key={idx} className="p-2 border text-xs font-medium">
                                        {col.substring(0, 10)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row: number[], rowIdx: number) => (
                                <tr key={rowIdx}>
                                    <td className="p-2 border text-xs font-medium">
                                        {columns[rowIdx].substring(0, 10)}
                                    </td>
                                    {row.map((value: number, colIdx: number) => (
                                        <td
                                            key={colIdx}
                                            className={`p-2 border text-center ${getCorrelationColor(value)}`}
                                            title={`${columns[rowIdx]} × ${columns[colIdx]}: ${value.toFixed(3)}`}
                                        >
                                            <span className="text-xs font-medium">
                                                {value.toFixed(2)}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span>Âm mạnh</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <span>Yếu</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>Dương mạnh</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DescriptiveResults({ results, columns }: { results: any; columns: string[] }) {
    const chartData = {
        labels: columns,
        datasets: [
            {
                label: 'Mean',
                data: results.mean,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Giá Trị Trung Bình (Mean)',
            },
        },
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Thống Kê Mô Tả</h3>

                {/* Chart */}
                <div className="mb-8">
                    <Bar data={chartData} options={chartOptions} />
                </div>

                {/* Statistics Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 font-semibold">Biến</th>
                                <th className="text-right py-3 px-4 font-semibold">Mean</th>
                                <th className="text-right py-3 px-4 font-semibold">SD</th>
                                <th className="text-right py-3 px-4 font-semibold">Min</th>
                                <th className="text-right py-3 px-4 font-semibold">Max</th>
                                <th className="text-right py-3 px-4 font-semibold">Median</th>
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map((col, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{col}</td>
                                    <td className="py-3 px-4 text-right">{results.mean[idx].toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right">{results.sd[idx].toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right">{results.min[idx].toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right">{results.max[idx].toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right">{results.median[idx].toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
