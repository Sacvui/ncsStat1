'use client';

import React, { useEffect, useState } from 'react';
import {
    BookOpen,
    Table,
    Sigma,
    Activity,
    Layers,
    CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function ProjectFlowAnimation() {
    // 0: Data Import
    // 1: Model Design (Complex SEM)
    // 2: Processing (Math)
    // 3: Results (Multi-Table Dashboard)
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full flex items-center justify-center p-12 overflow-hidden bg-[#0f172a] text-white select-none">

            {/* BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
                <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[100px] transition-all duration-1000`} />
            </div>

            <div className="z-10 w-full max-w-7xl grid grid-cols-12 gap-12 h-[600px] items-center">

                {/* LEFT: TEXT CONTENT (4 Columns) */}
                <div className="col-span-4 space-y-10 pl-4 relative">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-slate-300 text-[10px] font-bold tracking-wider uppercase">
                            <Activity size={12} className="text-emerald-400" />
                            <span>System Ready v2.4</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-serif text-white leading-[1.1]">
                            Research <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">Intelligence</span>
                        </h2>
                        <p className="text-slate-400 text-sm leading-relaxed font-light max-w-sm">
                            From raw data to <strong className="text-white font-medium">Q1 Journal</strong> acceptance. Automated structural equation modeling engine.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4 border-l border-slate-800 ml-1 pl-6">
                        <StepIndicator active={step === 0} title="1. Data Input" desc="Matrix Cleaning & Prep" />
                        <StepIndicator active={step === 1} title="2. Model Specification" desc="Complex SEM/CFA Design" />
                        <StepIndicator active={step === 2} title="3. Computation" desc="Matrix Algebra Solver" />
                        <StepIndicator active={step === 3} title="4. Final Report" desc="Fit Indices & Reliability" />
                    </div>
                </div>


                {/* RIGHT: VISUALIZATION STAGE (8 Columns) */}
                <div className="col-span-8 relative h-full bg-[#161e31] rounded-xl border border-slate-800/80 shadow-2xl overflow-hidden flex items-center justify-center">

                    {/* SCENE 0: DATA (Spreadsheet) - Kept Simple for Contrast */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 p-12 ${step === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                        <div className="w-full h-full bg-white text-slate-900 rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col font-mono text-[10px]">
                            <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                <span className="text-slate-400 ml-2">raw_survey_data.csv (N=10,500)</span>
                            </div>
                            <div className="grid grid-cols-6 bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                                {['ID', 'A1', 'A2', 'A3', 'B1', 'B2'].map(h => <div key={h} className="p-2 border-r border-slate-200">{h}</div>)}
                            </div>
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-6 border-b border-slate-100 text-slate-600">
                                    <div className="p-2 border-r border-slate-100 text-slate-400">{i + 1}</div>
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <div key={j} className="p-2 border-r border-slate-100">{(Math.random() * 5 + 1).toFixed(0)}</div>
                                    ))}
                                </div>
                            ))}
                            <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-blue-500/5 to-transparent animate-pulse"></div>
                        </div>
                    </div>

                    {/* SCENE 1: MODEL DESIGN (Professional AMOS/SmartPLS Style) */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${step === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <div className="relative w-full h-full bg-[#f8fafc] p-6 overflow-hidden">
                            <div className="absolute top-3 left-4 text-slate-400 text-[10px] font-sans font-bold uppercase tracking-widest border border-slate-200 px-2 py-1 rounded">Figure 1. Structural Model</div>

                            <div className="w-full h-full relative scale-90 origin-center">
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                    <defs>
                                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="28" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                                        </marker>
                                        <marker id="arrow-sm" markerWidth="8" markerHeight="8" refX="18" refY="3.5" orient="auto">
                                            <polygon points="0 0, 8 3.5, 0 7" fill="#94a3b8" />
                                        </marker>
                                    </defs>

                                    {/* Path: IV1 -> MED */}
                                    <path d="M 180 180 L 380 280" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrow)" />
                                    {/* Path: IV2 -> MED */}
                                    <path d="M 180 380 L 380 280" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrow)" />
                                    {/* Path: MED -> DV */}
                                    <path d="M 460 280 L 660 280" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrow)" />

                                    {/* Correlation IV1 <-> IV2 */}
                                    <path d="M 140 210 Q 100 280 140 350" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" markerStart="url(#arrow-sm)" markerEnd="url(#arrow-sm)" />

                                    {/* Indicators Lines (Simplified) */}
                                    {[1, 2, 3].map(i => (
                                        <path key={`iv1-${i}`} d={`M 140 180 L 80 ${120 + i * 30}`} stroke="#cbd5e1" strokeWidth="1" markerEnd="url(#arrow-sm)" />
                                    ))}
                                    {[1, 2, 3].map(i => (
                                        <path key={`dv-${i}`} d={`M 700 280 L 760 ${220 + i * 30}`} stroke="#cbd5e1" strokeWidth="1" markerEnd="url(#arrow-sm)" />
                                    ))}
                                </svg>

                                {/* Nodes (Latent Variables) - Oval Shapes */}
                                <div className="absolute top-[180px] left-[140px] -translate-x-1/2 -translate-y-1/2 w-28 h-16 rounded-[50%] border-2 border-blue-500 bg-white shadow-lg flex items-center justify-center text-xs font-bold text-slate-700 z-10">
                                    Trust
                                    <span className="absolute -top-3 right-0 text-[8px] text-slate-400">ξ1</span>
                                </div>

                                <div className="absolute top-[380px] left-[140px] -translate-x-1/2 -translate-y-1/2 w-28 h-16 rounded-[50%] border-2 border-blue-500 bg-white shadow-lg flex items-center justify-center text-xs font-bold text-slate-700 z-10">
                                    Quality
                                    <span className="absolute -top-3 right-0 text-[8px] text-slate-400">ξ2</span>
                                </div>

                                <div className="absolute top-[280px] left-[420px] -translate-x-1/2 -translate-y-1/2 w-28 h-16 rounded-[50%] border-2 border-purple-500 bg-white shadow-lg flex items-center justify-center text-xs font-bold text-slate-700 z-10">
                                    Satisfaction
                                    <span className="absolute -top-3 right-0 text-[8px] text-slate-400">η1</span>
                                    {/* Disturbance Term */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-slate-300 bg-white text-[6px] flex items-center justify-center">z1</div>
                                    <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-slate-300"></div>
                                </div>

                                <div className="absolute top-[280px] left-[700px] -translate-x-1/2 -translate-y-1/2 w-28 h-16 rounded-[50%] border-2 border-emerald-500 bg-white shadow-lg flex items-center justify-center text-xs font-bold text-slate-700 z-10">
                                    Loyalty
                                    <span className="absolute -top-3 right-0 text-[8px] text-slate-400">η2</span>
                                    {/* Disturbance Term */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-slate-300 bg-white text-[6px] flex items-center justify-center">z2</div>
                                    <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-slate-300"></div>
                                </div>

                                {/* Indicator Boxes (Manifest Variables) */}
                                {[1, 2, 3].map(i => (
                                    <div key={`ind-x-${i}`} className="absolute w-12 h-8 border border-slate-400 bg-slate-50 flex items-center justify-center text-[8px] text-slate-600 shadow-sm" style={{ left: '40px', top: `${105 + i * 30}px` }}>x{i}</div>
                                ))}
                                {[1, 2, 3].map(i => (
                                    <div key={`ind-y-${i}`} className="absolute w-12 h-8 border border-slate-400 bg-slate-50 flex items-center justify-center text-[8px] text-slate-600 shadow-sm" style={{ left: '760px', top: `${205 + i * 30}px` }}>y{i}</div>
                                ))}

                            </div>
                        </div>
                    </div>

                    {/* SCENE 2: MATH (Equations) */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${step === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="text-center space-y-8">
                            <Sigma className="w-20 h-20 text-indigo-300 mx-auto animate-pulse" strokeWidth={1} />
                            <div className="text-3xl font-serif text-white italic opacity-80">
                                <span className="inline-block animate-fade-in-up">Y = &Lambda;<sub>y</sub>&eta; + &epsilon;</span>
                            </div>
                            <div className="text-3xl font-serif text-white italic opacity-80 animation-delay-500">
                                <span className="inline-block animate-fade-in-up" style={{ animationDelay: '0.3s' }}>&eta; = B&eta; + &Gamma;&xi; + &zeta;</span>
                            </div>
                            <div className="w-64 h-1 bg-slate-800 rounded-full mx-auto relative overflow-hidden mt-8">
                                <div className="absolute inset-0 bg-indigo-500 w-1/2 animate-progress"></div>
                            </div>
                            <p className="text-xs font-mono text-indigo-400">Minimizing Discrepancy Function F_ML...</p>
                        </div>
                    </div>

                    {/* SCENE 3: RESULTS (Rich Dashboard) */}
                    <div className={`absolute inset-0 flex flex-col p-8 transition-all duration-700 bg-slate-50 ${step === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                        <div className="flex-1 w-full grid grid-cols-2 gap-4">
                            {/* Card 1: Model Fit */}
                            <div className="col-span-2 bg-white p-4 rounded border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <span className="text-xs font-bold text-slate-700 uppercase">Model Fit Indices (Excellent)</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <FitMetric label="Chi-Square/df" value="1.85" ideal="< 3" />
                                    <FitMetric label="CFI" value="0.982" ideal="> 0.95" highlight />
                                    <FitMetric label="TLI" value="0.976" ideal="> 0.95" highlight />
                                    <FitMetric label="RMSEA" value="0.042" ideal="< 0.06" highlight />
                                </div>
                            </div>

                            {/* Card 2: Regression Weights */}
                            <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Table size={14} className="text-blue-500" />
                                    <span className="text-xs font-bold text-slate-700 uppercase">Regression Weights</span>
                                </div>
                                <table className="w-full text-[10px] text-slate-600">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-400 font-normal text-left">
                                            <th className="py-1">Path</th>
                                            <th>Estimate</th>
                                            <th>P</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-slate-50"><td>Qual &rarr; Sat</td><td className="font-bold">0.65</td><td className="text-emerald-600">***</td></tr>
                                        <tr className="border-b border-slate-50"><td>Trust &rarr; Sat</td><td className="font-bold">0.24</td><td className="text-emerald-600">***</td></tr>
                                        <tr className="border-b border-slate-50"><td>Sat &rarr; Loy</td><td className="font-bold">0.58</td><td className="text-emerald-600">***</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Card 3: Reliability */}
                            <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Layers size={14} className="text-purple-500" />
                                    <span className="text-xs font-bold text-slate-700 uppercase">Construct Reliability</span>
                                </div>
                                <table className="w-full text-[10px] text-slate-600">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-400 font-normal text-left">
                                            <th className="py-1">Construct</th>
                                            <th>CR</th>
                                            <th>AVE</th>
                                            <th>Alpha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-slate-50"><td>Trust</td><td className="font-bold">0.89</td><td>0.62</td><td className="text-emerald-600">0.88</td></tr>
                                        <tr className="border-b border-slate-50"><td>Quality</td><td className="font-bold">0.91</td><td>0.74</td><td className="text-emerald-600">0.92</td></tr>
                                        <tr className="border-b border-slate-50"><td>Loyalty</td><td className="font-bold">0.85</td><td>0.58</td><td className="text-emerald-600">0.86</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

function FitMetric({ label, value, ideal, highlight }: any) {
    return (
        <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase tracking-wide">{label}</div>
            <div className={`text-lg font-bold font-mono ${highlight ? 'text-emerald-600' : 'text-slate-700'}`}>{value}</div>
            <div className="text-[9px] text-slate-300 border-t border-slate-100 pt-1 mt-1 inline-block px-1">{ideal}</div>
        </div>
    )
}

function StepIndicator({ active, title, desc }: { active: boolean, title: string, desc: string }) {
    return (
        <div className={`group flex items-start gap-4 transition-all duration-500 cursor-default ${active ? 'opacity-100 translate-x-3' : 'opacity-40 hover:opacity-60'}`}>
            <div className={`mt-1 w-2 h-2 rounded-full transition-all duration-300 ${active ? 'bg-indigo-400 scale-125 shadow-[0_0_8px_#818cf8]' : 'bg-slate-700 group-hover:bg-slate-600'}`}></div>
            <div>
                <div className={`text-sm font-bold tracking-tight ${active ? 'text-white' : 'text-slate-400'}`}>{title}</div>
                <div className="text-[11px] text-slate-500 font-light mt-0.5">{desc}</div>
            </div>
        </div>
    )
}
