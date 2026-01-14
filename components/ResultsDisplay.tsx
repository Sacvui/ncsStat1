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
    // Use N of Items if available, otherwise fallback (we normally get this from raw data columns count if not in result)
    const nItems = results.nItems || 'N/A';

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
                            <th className="py-2 pr-4 font-semibold">Cronbach's Alpha</th>
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

            {/* Interpretation Section (Kept for user friendliness, but styled cleaner) */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm">
                <h4 className="font-bold mb-4 text-gray-800 uppercase text-xs tracking-wider">Đánh Giáp & Khuyến Nghị</h4>
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
                        <tr key={rowIdx} className="hover:bg-gray-50 border-b border-gray-200 last:border-b-2 last:border-black">
                            <td className="py-3 px-4 font-medium border-r border-gray-200 bg-gray-50">
                                {columns[rowIdx]}
                            </td>
                            {row.map((value: number, colIdx: number) => (
                                <td
                                    key={colIdx}
                                    className={`py-3 px-4 text-center ${rowIdx === colIdx ? 'font-bold text-black' : ''} ${Math.abs(value) > 0.5 && rowIdx !== colIdx ? 'text-blue-700 font-medium' : 'text-gray-600'}`}
                                >
                                    {value.toFixed(3)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="text-xs text-gray-500 italic mt-2">* Tương quan &gt; 0.5 được tô màu xanh.</p>
        </div>
    );
}

function DescriptiveResults({ results, columns }: { results: any; columns: string[] }) {
    return (
        <div className="space-y-8">
            <div>
                <h4 className="text-sm font-bold uppercase mb-2 tracking-wide text-gray-700">Descriptive Statistics</h4>
                <div className="bg-white border-t-2 border-b-2 border-black overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-gray-600">
                                <th className="py-2 px-4 font-semibold"></th>
                                <th className="py-2 px-4 font-semibold text-right">N</th>
                                <th className="py-2 px-4 font-semibold text-right">Minimum</th>
                                <th className="py-2 px-4 font-semibold text-right">Maximum</th>
                                <th className="py-2 px-4 font-semibold text-right">Mean</th>
                                <th className="py-2 px-4 font-semibold text-right">Std. Deviation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map((col, idx) => (
                                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-2 px-4 font-medium text-gray-900">{col}</td>
                                    <td className="py-2 px-4 text-right text-gray-600">{results.N || 'N/A'}</td>
                                    <td className="py-2 px-4 text-right text-gray-600">{(results.min && results.min[idx] !== undefined) ? results.min[idx].toFixed(3) : '-'}</td>
                                    <td className="py-2 px-4 text-right text-gray-600">{(results.max && results.max[idx] !== undefined) ? results.max[idx].toFixed(3) : '-'}</td>
                                    <td className="py-2 px-4 text-right text-gray-900 font-medium">{(results.mean && results.mean[idx] !== undefined) ? results.mean[idx].toFixed(3) : '-'}</td>
                                    <td className="py-2 px-4 text-right text-gray-600">{(results.sd && results.sd[idx] !== undefined) ? results.sd[idx].toFixed(3) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Chart is still useful for quick visual check */}
            <div className="mt-8 p-6 bg-white border border-gray-200 shadow-sm rounded-sm">
                <h4 className="text-sm font-bold uppercase mb-4 tracking-wide text-gray-700 text-center">Mean Value Comparison</h4>
                <Bar
                    data={{
                        labels: columns,
                        datasets: [{
                            label: 'Mean',
                            data: results.mean,
                            backgroundColor: 'rgba(15, 76, 129, 0.7)', // Deep Blue
                            borderColor: 'rgba(15, 76, 129, 1)',
                            borderWidth: 1
                        }]
                    }}
                    options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                            x: { grid: { display: false } }
                        }
                    }}
                />
            </div>
        </div>
    );
}
