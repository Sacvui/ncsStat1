'use client';

import React, { useEffect, useState } from 'react';
import {
    Database,
    FileSpreadsheet,
    BarChart3,
    BrainCircuit,
    Network,
    Table,
    FileText,
    Sigma,
    BookOpen
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function ProjectFlowAnimation() {
    // 0: Data Import (Matrix Grid)
    // 1: Model Specification (Path Diagram)
    // 2: Mathematical Processing (Equations)
    // 3: Publication Results (Journal Style)
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full flex items-center justify-center p-12 overflow-hidden bg-[#0f172a] text-white">

            {/* 1. BACKGROUND (Subtle Academic Texture) */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                {/* Soft ambient lighting, less neon, more intellectual */}
                <div className={`absolute top-0 right-0 w-[800px] h-[800px] bg-slate-800/20 rounded-full blur-[120px] transition-all duration-1000`} />
            </div>

            <div className="z-10 w-full max-w-6xl w-full grid grid-cols-10 gap-12 h-[600px] items-center">

                {/* LEFT: TEXT CONTENT (3 Columns) */}
                <div className="col-span-3 space-y-10 pl-4">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200/20 bg-indigo-900/20 text-indigo-200 text-xs font-semibold tracking-wider uppercase">
                            <BookOpen size={12} />
                            <span>Scientific Standard</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-serif text-white leading-tight">
                            Research <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">Simplified</span>
                        </h2>
                        <p className="text-slate-400 text-base leading-relaxed font-light">
                            Transform raw datasets into rigorous Q1 journal-ready findings. No coding required.
                        </p>
                    </div>

                    <div className="space-y-6 pt-4 border-l-2 border-slate-800/50 ml-2 pl-6">
                        <StepIndicator active={step === 0} title="Data Input" desc="Matrix Cleaning & Prep" />
                        <StepIndicator active={step === 1} title="Model Design" desc="SEM Path Construction" />
                        <StepIndicator active={step === 2} title="processing" desc="Statistical Computation" />
                        <StepIndicator active={step === 3} title="Results" desc="APA Format Tables" />
                    </div>
                </div>


                {/* RIGHT: VISUALIZATION STAGE (7 Columns) - Fixed container to prevent overlaps */}
                <div className="col-span-7 relative h-full bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden flex items-center justify-center shadow-2xl">

                    {/* === SCENE 0: CLEAN DATA (Spreadsheet) === */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 p-8 ${step === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                        <div className="w-full h-full bg-white text-slate-900 rounded-lg shadow-xl overflow-hidden flex flex-col">
                            {/* Toolbar */}
                            <div className="h-10 border-b border-slate-200 bg-slate-50 flex items-center px-4 gap-4 text-xs font-semibold text-slate-500">
                                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><div className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
                                <span>dataset_final_clean.csv</span>
                            </div>
                            {/* Header */}
                            <div className="grid grid-cols-5 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                {['ID', 'Predictor_X', 'Mediator_M', 'Outcome_Y', 'Control_Z'].map(h => (
                                    <div key={h} className="py-3 px-4 border-r border-slate-200">{h}</div>
                                ))}
                            </div>
                            {/* Rows */}
                            <div className="flex-1 overflow-hidden relative">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="grid grid-cols-5 text-[11px] font-mono text-slate-600 border-b border-slate-100 hover:bg-blue-50 transition-colors">
                                        <div className="py-2 px-4 border-r border-slate-100 font-bold text-slate-400">{1001 + i}</div>
                                        {Array.from({ length: 4 }).map((_, j) => (
                                            <div key={j} className="py-2 px-4 border-r border-slate-100">
                                                {(Math.random() * 5).toFixed(2)}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                {/* Scan Line */}
                                <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-blue-500/10 to-transparent animate-scan"></div>
                            </div>
                        </div>
                    </div>

                    {/* === SCENE 1: MODEL DIAGRAM (Clean Whiteboard Style) === */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${step === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <div className="relative w-[90%] h-[80%] bg-[#1e1e1e] rounded-xl border border-slate-700 shadow-2xl p-6">
                            <div className="absolute top-4 left-4 text-slate-400 text-xs font-serif italic">Figure 1. Proposed Structural Model</div>

                            <div className="w-full h-full flex items-center justify-center relative">
                                {/* Nodes */}
                                <Node x="20%" y="50%" label="X" sub="Predictor" color="#60a5fa" delay="0s" />
                                <Node x="50%" y="20%" label="M" sub="Mediator" color="#c084fc" delay="0.2s" />
                                <Node x="80%" y="50%" label="Y" sub="Outcome" color="#34d399" delay="0.4s" />

                                {/* Arrows (SVG Overlay) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                                        </marker>
                                    </defs>
                                    {/* X -> M */}
                                    <path d="M 180 250 L 380 150" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" className="animate-draw" strokeDasharray="500" />
                                    {/* M -> Y */}
                                    <path d="M 460 150 L 660 250" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" className="animate-draw" style={{ animationDelay: '0.5s' }} strokeDasharray="500" />
                                    {/* X -> Y */}
                                    <path d="M 190 270 L 650 270" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" className="animate-draw" style={{ animationDelay: '1s' }} strokeDasharray="1000" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* === SCENE 2: MATH/EQUATIONS (Academic Rigor) === */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${step === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                        <div className="w-[80%] space-y-6 text-center">
                            <div className="inline-block relative">
                                <Sigma className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-pulse" />
                            </div>
                            <div className="space-y-4 font-serif text-2xl text-slate-300 leading-relaxed">
                                <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                    y<sub>i</sub> = &beta;<sub>0</sub> + &beta;<sub>1</sub>x<sub>i</sub> + &epsilon;<sub>i</sub>
                                </div>
                                <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }} className="text-3xl text-white font-medium">
                                    &Chi;<sup>2</sup> = &Sigma; (O - E)<sup>2</sup> / E
                                </div>
                                <div className="animate-fade-in-up" style={{ animationDelay: '0.9s' }} className="text-xl text-slate-400 italic">
                                    p &lt; 0.001
                                </div>
                            </div>
                            <div className="text-xs font-mono text-indigo-400 mt-8">
                                Computing Covariance Matrix...
                            </div>
                            {/* Loading Bar */}
                            <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto mt-2 overflow-hidden">
                                <div className="h-full bg-indigo-500 animate-progress"></div>
                            </div>
                        </div>
                    </div>

                    {/* === SCENE 3: PUBLICATION RESULTS (Clean APA Style) === */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 p-8 ${step === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <Card className="w-full bg-white text-slate-900 shadow-2xl rounded-xl overflow-hidden border-t-4 border-indigo-600">
                            <div className="p-6">
                                <h3 className="text-lg font-serif font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
                                    Table 1. Regression Analysis Results
                                </h3>

                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b-2 border-slate-800 text-slate-800">
                                            <th className="py-2 italic font-serif">Predictor</th>
                                            <th className="py-2 font-serif text-center">&beta;</th>
                                            <th className="py-2 font-serif text-center">SE</th>
                                            <th className="py-2 font-serif text-center">t</th>
                                            <th className="py-2 font-serif text-center">p</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-serif text-slate-700">
                                        <tr className="border-b border-slate-200">
                                            <td className="py-2 pl-2">Variable X</td>
                                            <td className="py-2 text-center">0.45</td>
                                            <td className="py-2 text-center">0.04</td>
                                            <td className="py-2 text-center">11.25</td>
                                            <td className="py-2 text-center font-bold">&lt; .001</td>
                                        </tr>
                                        <tr className="border-b border-slate-200">
                                            <td className="py-2 pl-2">Variable M</td>
                                            <td className="py-2 text-center">0.32</td>
                                            <td className="py-2 text-center">0.05</td>
                                            <td className="py-2 text-center">6.40</td>
                                            <td className="py-2 text-center font-bold">.002</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 pl-2">Variable Z</td>
                                            <td className="py-2 text-center">0.12</td>
                                            <td className="py-2 text-center">0.06</td>
                                            <td className="py-2 text-center">2.10</td>
                                            <td className="py-2 text-center">.038*</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p className="text-[10px] text-slate-500 mt-4 italic font-serif">
                                    Note. N = 10,500. *** p &lt; .001, * p &lt; .05. R<sup>2</sup> = .48
                                </p>
                            </div>
                        </Card>
                    </div>

                </div>

            </div>
        </div>
    );
}

// Helper Components
function Node({ x, y, label, sub, color, delay }: any) {
    return (
        <div
            className="absolute flex flex-col items-center justify-center animate-fade-in z-10"
            style={{ left: x, top: y, transform: 'translate(-50%, -50%)', animationDelay: delay }}
        >
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 flex items-center justify-center text-xl font-bold text-white shadow-xl" style={{ borderColor: color }}>
                {label}
            </div>
            <div className="mt-2 text-xs text-slate-400 font-sans uppercase tracking-widest">{sub}</div>
        </div>
    )
}

function StepIndicator({ active, title, desc }: { active: boolean, title: string, desc: string }) {
    return (
        <div className={`flex items-center gap-4 transition-all duration-500 ${active ? 'opacity-100 translate-x-2' : 'opacity-30'}`}>
            <div className={`w-2 h-2 rounded-full transition-all ${active ? 'bg-indigo-400 scale-150' : 'bg-slate-600'}`}></div>
            <div>
                <div className={`text-sm font-semibold uppercase tracking-wide ${active ? 'text-indigo-200' : 'text-slate-500'}`}>{title}</div>
            </div>
        </div>
    )
}
