
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

interface CFASelectionProps {
    columns: string[]; // Available numeric columns
    onRunCFA: (modelSyntax: string, factors: any[]) => void;
    isAnalyzing: boolean;
    onBack: () => void;
}

interface Factor {
    id: string;
    name: string;
    indicators: string[];
}

export default function CFASelection({ columns, onRunCFA, isAnalyzing, onBack }: CFASelectionProps) {
    const [factors, setFactors] = useState<Factor[]>([
        { id: 'f1', name: 'Factor1', indicators: [] }
    ]);

    // Temporary state for adding a new factor
    const [editingFactorIndex, setEditingFactorIndex] = useState<number | null>(0);

    const addFactor = () => {
        const newId = `f${factors.length + 1}`;
        setFactors([...factors, { id: newId, name: `Factor${factors.length + 1}`, indicators: [] }]);
        setEditingFactorIndex(factors.length); // Open the new factor for editing
    };

    const removeFactor = (index: number) => {
        const newFactors = [...factors];
        newFactors.splice(index, 1);
        setFactors(newFactors);
        if (editingFactorIndex === index) setEditingFactorIndex(null);
    };

    const toggleIndicator = (factorIndex: number, col: string) => {
        const newFactors = [...factors];
        const factor = newFactors[factorIndex];

        if (factor.indicators.includes(col)) {
            factor.indicators = factor.indicators.filter(i => i !== col);
        } else {
            // Ensure indicator is not used in other factors (Standard CFA constraint usually)
            // But strictly speaking, cross-loadings are allowed in SEM/CFA but rare for simple models.
            // Let's allow reuse but maybe warn? For now, allow it.
            factor.indicators.push(col);
        }
        setFactors(newFactors);
    };

    const generateSyntax = () => {
        // Generate lavaan syntax
        // F1 =~ x1 + x2 + x3
        return factors
            .filter(f => f.indicators.length > 0)
            .map(f => `${f.name} =~ ${f.indicators.join(' + ')}`)
            .join('\n');
    };

    const handleRun = () => {
        const validFactors = factors.filter(f => f.indicators.length >= 3);
        const totalIndicators = factors.reduce((sum, f) => sum + f.indicators.length, 0);

        if (validFactors.length < 1) {
            alert("Vui lòng định nghĩa ít nhất 1 nhân tố với tối thiểu 3 biến quan sát.");
            return;
        }

        // Require at least 4 indicators total for proper model fit calculation
        if (totalIndicators < 4) {
            alert("CFA cần ít nhất 4 biến quan sát để tính toán chỉ số phù hợp mô hình (RMSEA, CFI, TLI).");
            return;
        }
        // Check for empty names
        if (factors.some(f => !f.name.trim())) {
            alert("Tên nhân tố không được để trống.");
            return;
        }

        const syntax = generateSyntax();
        onRunCFA(syntax, factors);
    };

    // Calculate unused columns to help user
    const usedColumns = new Set(factors.flatMap(f => f.indicators));
    const unusedColumns = columns.filter(c => !usedColumns.has(c));

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    Xây dựng mô hình CFA
                </h2>
                <p className="text-gray-600">
                    Định nghĩa các nhân tố và biến quan sát tương ứng
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Factor List */}
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách Nhân tố</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {factors.map((factor, idx) => (
                                    <div
                                        key={factor.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${editingFactorIndex === idx
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                        onClick={() => setEditingFactorIndex(idx)}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <input
                                                type="text"
                                                value={factor.name}
                                                onChange={(e) => {
                                                    const newFactors = [...factors];
                                                    newFactors[idx].name = e.target.value;
                                                    setFactors(newFactors);
                                                }}
                                                className="font-bold bg-transparent border-b border-dashed border-gray-400 focus:border-blue-600 outline-none w-full text-sm"
                                                placeholder="Tên nhân tố"
                                                onClick={(e) => e.stopPropagation()} // Prevent card click
                                            />
                                            {factors.length > 1 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFactor(idx);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {factor.indicators.length} biến quan sát
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={addFactor}
                                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Thêm nhân tố
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Indicator Selection */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {editingFactorIndex !== null
                                    ? `Chọn biến cho nhân tố: ${factors[editingFactorIndex].name}`
                                    : 'Chọn một nhân tố để chỉnh sửa'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {editingFactorIndex !== null ? (
                                <div className="space-y-4">
                                    <div className="h-96 overflow-y-auto pr-2 border rounded-lg p-3 bg-gray-50">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {columns.map(col => {
                                                const isSelected = factors[editingFactorIndex].indicators.includes(col);
                                                // Check if used in other factors
                                                const isUsedElsewhere = factors.some((f, i) => i !== editingFactorIndex && f.indicators.includes(col));

                                                return (
                                                    <label
                                                        key={col}
                                                        className={`
                                                            flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition-all
                                                            ${isSelected
                                                                ? 'bg-blue-100 border-blue-500 text-blue-800'
                                                                : isUsedElsewhere
                                                                    ? 'bg-gray-100 border-gray-200 text-gray-400 opacity-75'
                                                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                                            }
                                                        `}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleIndicator(editingFactorIndex, col)}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 hidden"
                                                        />
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600 mr-1" />}
                                                        <span className="text-sm font-medium truncate" title={col}>{col}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        * Các biến đã được chọn ở nhân tố khác sẽ bị làm mờ (nhưng vẫn có thể chọn lại nếu muốn cross-loading).
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <ArrowRight className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Vui lòng chọn nhân tố bên trái để thêm biến</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-lg border mt-6">
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                    disabled={isAnalyzing}
                >
                    Quay lại
                </button>

                <div className="text-sm text-gray-500">
                    {generateSyntax() ? (
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Mô hình hợp lệ
                        </span>
                    ) : (
                        <span className="text-orange-500">Chưa có mô hình</span>
                    )}
                </div>

                <button
                    onClick={handleRun}
                    disabled={isAnalyzing}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
                >
                    {isAnalyzing ? 'Đang phân tích...' : 'Chạy CFA'}
                </button>
            </div>

            {/* Syntax Preview (Advanced) */}
            <div className="mt-8">
                <details className="text-xs text-gray-500 cursor-pointer">
                    <summary className="mb-2 font-medium hover:text-indigo-600">Xem cú pháp lavaan (Advanced)</summary>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto font-mono">
                        {generateSyntax() || "# Chưa có syntax"}
                    </pre>
                </details>
            </div>
        </div>
    );
}
