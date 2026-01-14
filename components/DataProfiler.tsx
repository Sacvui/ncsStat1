'use client';

import { DataProfile } from '@/lib/data-profiler';
import { AlertCircle, AlertTriangle, Info, TrendingUp, Database } from 'lucide-react';

interface DataProfilerProps {
    profile: DataProfile;
    onProceed?: () => void;
}

export function DataProfiler({ profile, onProceed }: DataProfilerProps) {
    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-yellow-50 border-yellow-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    const criticalIssues = profile.issues.filter(i => i.severity === 'critical').length;
    const warningIssues = profile.issues.filter(i => i.severity === 'warning').length;

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Database className="w-8 h-8" />
                        <div>
                            <p className="text-blue-100 text-sm">Tổng số dòng</p>
                            <p className="text-3xl font-bold">{profile.rows.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-8 h-8" />
                        <div>
                            <p className="text-purple-100 text-sm">Số cột</p>
                            <p className="text-3xl font-bold">{profile.columns}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-8 h-8" />
                        <div>
                            <p className="text-orange-100 text-sm">Vấn đề phát hiện</p>
                            <p className="text-3xl font-bold">{profile.issues.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Issues List */}
            {profile.issues.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                        Vấn Đề Chất Lượng Dữ Liệu
                    </h3>

                    <div className="space-y-3">
                        {profile.issues.map((issue, idx) => (
                            <div
                                key={idx}
                                className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                            >
                                <div className="flex items-start gap-3">
                                    {getSeverityIcon(issue.severity)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-800">
                                                {issue.column || 'Toàn bộ dữ liệu'}
                                            </span>
                                            <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium">
                                                {issue.count} {issue.type === 'missing' ? 'giá trị' : 'dòng'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{issue.suggestedFix}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Column Statistics */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Thống Kê Từng Cột</h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 font-semibold">Tên cột</th>
                                <th className="text-left py-3 px-4 font-semibold">Loại</th>
                                <th className="text-right py-3 px-4 font-semibold">Thiếu</th>
                                <th className="text-right py-3 px-4 font-semibold">Mean</th>
                                <th className="text-right py-3 px-4 font-semibold">SD</th>
                                <th className="text-right py-3 px-4 font-semibold">Min</th>
                                <th className="text-right py-3 px-4 font-semibold">Max</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(profile.columnStats).map((stat, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{stat.name}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stat.type === 'numeric' ? 'bg-blue-100 text-blue-700' :
                                                stat.type === 'text' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-green-100 text-green-700'
                                            }`}>
                                            {stat.type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {stat.missing > 0 ? (
                                            <span className="text-red-600 font-medium">
                                                {stat.missing} ({(stat.missingRate * 100).toFixed(1)}%)
                                            </span>
                                        ) : (
                                            <span className="text-green-600">0</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {stat.mean !== undefined ? stat.mean.toFixed(2) : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {stat.sd !== undefined ? stat.sd.toFixed(2) : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {stat.min !== undefined ? stat.min.toFixed(2) : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {stat.max !== undefined ? stat.max.toFixed(2) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Button */}
            {onProceed && (
                <div className="flex justify-end">
                    <button
                        onClick={onProceed}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Tiếp tục phân tích →
                    </button>
                </div>
            )}
        </div>
    );
}
