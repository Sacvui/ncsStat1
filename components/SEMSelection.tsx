
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Plus, Trash2, ArrowRight, ArrowDown } from 'lucide-react';

interface SEMSelectionProps {
    columns: string[];
    onRunSEM: (modelSyntax: string, factors: any[]) => void;
    isAnalyzing: boolean;
    onBack: () => void;
}

interface Factor {
    id: string;
    name: string;
    indicators: string[];
}

interface RegressionPath {
    id: string;
    dependent: string; // The effect (Y)
    independent: string; // The cause (X)
}

export default function SEMSelection({ columns, onRunSEM, isAnalyzing, onBack }: SEMSelectionProps) {
    const [step, setStep] = useState<1 | 2>(1); // 1: Define Factors, 2: Define Structural Model

    // --- Step 1 State: Factors ---
    const [factors, setFactors] = useState<Factor[]>([
        { id: 'f1', name: 'SAT', indicators: [] },
        { id: 'f2', name: 'LOY', indicators: [] }
    ]);
    const [editingFactorIndex, setEditingFactorIndex] = useState<number | null>(0);

    // --- Step 2 State: Paths ---
    const [paths, setPaths] = useState<RegressionPath[]>([]);

    // --- Step 1 Handlers ---
    const addFactor = () => {
        const newId = `f${factors.length + 1}`;
        setFactors([...factors, { id: newId, name: `Factor${factors.length + 1}`, indicators: [] }]);
        setEditingFactorIndex(factors.length);
    };

    const removeFactor = (index: number) => {
        // Also remove paths associated with this factor
        const factorName = factors[index].name;
        setPaths(paths.filter(p => p.dependent !== factorName && p.independent !== factorName));

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
            factor.indicators.push(col);
        }
        setFactors(newFactors);
    };

    // --- Step 2 Handlers ---
    const addPath = (dependent: string, independent: string) => {
        // Prevent duplicates and self-loops
        if (dependent === independent) return;
        if (paths.some(p => p.dependent === dependent && p.independent === independent)) return;

        setPaths([...paths, {
            id: `${independent}->${dependent}`,
            dependent,
            independent
        }]);
    };

    const removePath = (index: number) => {
        const newPaths = [...paths];
        newPaths.splice(index, 1);
        setPaths(newPaths);
    };

    // --- Generator ---
    const generateSyntax = () => {
        // 1. Measurement Model
        const measurement = factors
            .filter(f => f.indicators.length > 0)
            .map(f => `${f.name} =~ ${f.indicators.join(' + ')}`)
            .join('\n');

        // 2. Structural Model
        // Group by dependent variable to form `Y ~ X1 + X2`
        const structuralMap = new Map<string, string[]>();
        paths.forEach(p => {
            if (!structuralMap.has(p.dependent)) {
                structuralMap.set(p.dependent, []);
            }
            structuralMap.get(p.dependent)?.push(p.independent);
        });

        const structural = Array.from(structuralMap.entries())
            .map(([dep, inds]) => `${dep} ~ ${inds.join(' + ')}`)
            .join('\n');

        return `${measurement}\n\n# Structural Model\n${structural}`;
    };

    const handleRun = () => {
        const syntax = generateSyntax();
        onRunSEM(syntax, factors);
    };

    // --- Render ---
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    Xây dựng mô hình SEM
                </h2>
                <div className="flex justify-center items-center gap-4 text-sm font-medium">
                    <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        Bước 1: Định nghĩa Nhân tố
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        Bước 2: Mô hình Cấu trúc
                    </span>
                </div>
            </div>

            {/* STEP 1: FACTOR DEFINITION */}
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Danh sách Nhân tố</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {factors.map((factor, idx) => (
                                        <div
                                            key={factor.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${editingFactorIndex === idx ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'}`}
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
                                                    className="font-bold bg-transparent border-b border-dashed border-gray-400 focus:border-indigo-600 outline-none w-full text-sm"
                                                    placeholder="Tên nhân tố"
                                                />
                                                {factors.length > 1 && (
                                                    <button onClick={() => removeFactor(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">{factor.indicators.length} quan sát</div>
                                        </div>
                                    ))}
                                    <button onClick={addFactor} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 flex items-center justify-center gap-2 font-medium text-sm">
                                        <Plus className="w-4 h-4" /> Thêm nhân tố
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{editingFactorIndex !== null ? `Chọn biến cho: ${factors[editingFactorIndex].name}` : 'Chọn nhân tố'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {editingFactorIndex !== null ? (
                                    <div className="h-96 overflow-y-auto pr-2 border rounded-lg p-3 bg-gray-50 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {columns.map(col => {
                                            const isSelected = factors[editingFactorIndex].indicators.includes(col);
                                            const isUsedElsewhere = factors.some((f, i) => i !== editingFactorIndex && f.indicators.includes(col));
                                            return (
                                                <label key={col} className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition-all ${isSelected ? 'bg-indigo-100 border-indigo-500 text-indigo-800' : isUsedElsewhere ? 'bg-gray-100 border-gray-200 text-gray-400 opacity-75' : 'bg-white border-gray-200 hover:border-indigo-300'}`}>
                                                    <input type="checkbox" checked={isSelected} onChange={() => toggleIndicator(editingFactorIndex, col)} className="hidden" />
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-600 mr-1" />}
                                                    <span className="text-sm font-medium truncate" title={col}>{col}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">Chọn nhân tố bên trái để thêm biến</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* STEP 2: STRUCTURAL MODEL */}
            {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Define Relation UI */}
                    <Card>
                        <CardHeader><CardTitle>Thiết lập quan hệ (Hồi quy)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <p className="text-sm text-gray-500">Kéo thả hoặc chọn để định nghĩa: <b>Nhân tố tác động (X)</b> &rarr; <b>Nhân tố mục tiêu (Y)</b></p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Nguyên nhân (X)</label>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {factors.map(f => (
                                                <div key={f.id} draggable className="p-2 bg-white border rounded shadow-sm cursor-grab hover:bg-gray-50"
                                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', f.name)}>
                                                    {f.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Kết quả (Y)</label>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {factors.map(f => (
                                                <div key={f.id}
                                                    className="p-2 bg-indigo-50 border border-indigo-200 rounded text-center cursor-pointer hover:bg-indigo-100 transition-colors dashed-border relative"
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const source = e.dataTransfer.getData('text/plain');
                                                        if (source) addPath(f.name, source);
                                                    }}
                                                    onClick={() => {
                                                        // Fallback for non-drag devices? 
                                                        // For now, simple drag drop instructions.
                                                    }}
                                                >
                                                    Kéo X thả vào đây<br />để {f.name} là Y
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Current Paths List */}
                    <Card>
                        <CardHeader><CardTitle>Mô hình cấu trúc hiện tại</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2 min-h-[200px]">
                                {paths.length === 0 ? (
                                    <div className="text-center text-gray-400 py-10 italic">Chưa có đường dẫn nào.</div>
                                ) : (
                                    paths.map((p, idx) => (
                                        <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-l-4 border-l-indigo-500 rounded shadow-sm">
                                            <div className="flex items-center gap-3 font-medium">
                                                <span className="text-gray-600">{p.independent}</span>
                                                <ArrowRight className="w-4 h-4 text-indigo-500" />
                                                <span className="text-indigo-700">{p.dependent}</span>
                                            </div>
                                            <button onClick={() => removePath(idx)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Mermaid Preview (Optional - text based for now) */}
                            <div className="mt-4 p-4 bg-gray-900 text-green-400 text-xs font-mono rounded overflow-auto h-32">
                                # Lavaan Syntax<br />
                                {generateSyntax().split('\n').map((line, i) => <div key={i}>{line}</div>)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ACTION BAR */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-lg border mt-6">
                <button
                    onClick={() => step === 1 ? onBack() : setStep(1)}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                    disabled={isAnalyzing}
                >
                    {step === 1 ? 'Quay lại' : '← Chỉnh sửa Nhân tố'}
                </button>

                {step === 1 ? (
                    <button
                        onClick={() => {
                            if (factors.filter(f => f.indicators.length >= 2).length < 2) {
                                alert("Cần ít nhất 2 nhân tố (mỗi nhân tố >= 2 biến) để chạy SEM.");
                                return;
                            }
                            setStep(2);
                        }}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md"
                    >
                        Tiếp tục: Xây dựng Mô hình →
                    </button>
                ) : (
                    <button
                        onClick={handleRun}
                        disabled={isAnalyzing || paths.length === 0}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {isAnalyzing ? 'Đang phân tích...' : 'Chạy SEM'}
                    </button>
                )}
            </div>
        </div>
    );
}
