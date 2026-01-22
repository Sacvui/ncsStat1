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
    Sigma
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function ProjectFlowAnimation() {
    // 0: Data Import (Matrix Grid)
    // 1: Model Specification (Path Diagram Construction)
    // 2: Processing (Equation/Syntax)
    // 3: Publication Results (Dashboard)
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 5000); // 5s per step to admire the details
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full flex flex-col justify-center items-center p-8 overflow-hidden bg-slate-950 text-white font-sans selection:bg-cyan-500/30">

            {/* 1. BACKGROUND EFFECTS */}
            <div className="absolute inset-0 z-0">
                {/* Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute inset-0"
                    style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.1 }}>
                </div>

                {/* Glow Orbs - Scientific Colors (Cyan = Data, Purple = Logic, Emerald = Result) */}
                <div className={`absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] transition-all duration-1000 ${step === 0 ? 'opacity-100 scale-110' : 'opacity-30 scale-100'}`} />
                <div className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] transition-all duration-1000 ${step === 1 || step === 2 ? 'opacity-100 scale-110' : 'opacity-30 scale-100'}`} />
            </div>

            <div className="z-10 w-full max-w-4xl relative flex gap-12 items-center h-full">

                {/* LEFT: TEXT CONTENT */}
                <div className="w-1/3 space-y-8 pl-8 hidden xl:block">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 text-xs font-mono tracking-wider uppercase">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            Scientific Engine Active
                        </div>
                        <h2 className="text-5xl font-bold tracking-tight text-white leading-tight">
                            Publication <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Ready</span>
                        </h2>
                        <p className="text-slate-400 text-lg font-light leading-relaxed">
                            Advanced SEM, CFA, and Path Analysis. From raw data to Q1 Journal tables in seconds.
                        </p>
                    </div>

                    {/* Steps Indicator */}
                    <div className="space-y-6 pt-8 border-l border-slate-800 ml-2">
                        <StepIndicator active={step === 0} title="1. Import Data" desc="Auto-cleaning & Matrix Prep" />
                        <StepIndicator active={step === 1} title="2. Config Model" desc="Path Diagram Construction" />
                        <StepIndicator active={step === 2} title="3. Processing" desc="R-WASM Kernel Execution" />
                        <StepIndicator active={step === 3} title="4. Final Results" desc="APA Tables & Visualization" />
                    </div>
                </div>


                {/* RIGHT: DYNAMIC VISUALIZATION STAGE (Centerpiece) */}
                <div className="flex-1 h-[600px] relative perspective-1000">

                    {/* STAGE CONTAINER */}
                    <div className="relative w-full h-full flex items-center justify-center">

                        {/* === SCENE 0: DATA MATRIX (The "Matrix" Effect) === */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${step === 0 ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-xl pointer-events-none'}`}>
                            <Card className="w-[500px] h-[350px] bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
                                        <FileSpreadsheet size={16} /> DATA_SOURCE_V2.CSV
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">N=10,500 ROWS</div>
                                </div>
                                {/* Data Grid */}
                                <div className="grid grid-cols-5 gap-2 font-mono text-xs text-slate-400">
                                    {['ID', 'VAR_X', 'VAR_Y', 'VAR_M', 'VAR_Z'].map(h => <div key={h} className="text-slate-200 font-bold pb-2 border-b border-slate-700">{h}</div>)}
                                    {Array.from({ length: 25 }).map((_, i) => (
                                        <div key={i} className={`py-1 transition-colors duration-300 ${i % 3 === 0 ? 'text-cyan-300' : ''}`}>
                                            {(Math.random() * 10).toFixed(2)}
                                        </div>
                                    ))}
                                </div>
                                {/* Scanning Effect */}
                                <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-cyan-500/20 to-transparent animate-scan"></div>
                                {/* Floating Badge */}
                                <div className="absolute bottom-4 right-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-3 py-1 rounded text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                                    <Database size={12} /> CLEANED & READY
                                </div>
                            </Card>
                        </div>

                        {/* === SCENE 1: MODEL CONFIG (The "Blueprint") === */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${step === 1 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-110 -rotate-3 pointer-events-none'}`}>
                            <div className="relative w-[540px] h-[380px] bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl p-8 overflow-hidden">
                                {/* Grid Background */}
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                                <div className="absolute top-4 left-6 text-purple-400 font-mono text-xs tracking-widest uppercase">
                                    Model Specification (SEM)
                                </div>

                                {/* Dynamic Nodes */}
                                <div className="relative w-full h-full mt-4">
                                    {/* Latent 1 */}
                                    <div className="absolute top-10 left-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                        <div className="w-16 h-16 rounded-full border-2 border-purple-400 bg-purple-900/50 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]">IV</div>
                                        <div className="flex gap-2 mt-4 justify-center">
                                            {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 bg-slate-800 border border-slate-600 flex items-center justify-center text-[8px] text-slate-400">x{i}</div>)}
                                        </div>
                                    </div>

                                    {/* Mediator */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                        <div className="w-16 h-16 rounded-full border-2 border-pink-400 bg-pink-900/50 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)]">MED</div>
                                        <div className="flex gap-2 mt-4 justify-center">
                                            {[1, 2].map(i => <div key={i} className="w-8 h-8 bg-slate-800 border border-slate-600 flex items-center justify-center text-[8px] text-slate-400">m{i}</div>)}
                                        </div>
                                    </div>

                                    {/* Latent 2 */}
                                    <div className="absolute bottom-10 right-10 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                                        <div className="w-16 h-16 rounded-full border-2 border-cyan-400 bg-cyan-900/50 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]">DV</div>
                                        <div className="flex gap-2 mt-4 justify-center">
                                            {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 bg-slate-800 border border-slate-600 flex items-center justify-center text-[8px] text-slate-400">y{i}</div>)}
                                        </div>
                                    </div>

                                    {/* Connection Line Simulation */}
                                    <svg className="absolute inset-0 pointer-events-none overflow-visible">
                                        <path d="M 80 80 Q 250 180 440 280" fill="none" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" className="animate-dash" />
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#a855f7" />
                                                <stop offset="100%" stopColor="#22d3ee" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* === SCENE 2: PROCESSING (The "Kernel") === */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${step === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-125 blur pointer-events-none'}`}>
                            <div className="relative w-[500px] h-[300px] bg-black border-2 border-slate-800 rounded-lg p-6 font-mono text-sm shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-6 bg-slate-900 flex items-center px-4 gap-2 border-b border-slate-800">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="ml-2 text-xs text-slate-500">R-WASM Kernel v4.2.0</span>
                                </div>
                                <div className="mt-4 space-y-1 text-slate-300 overflow-hidden h-full relative">
                                    {/* Code scrolling up */}
                                    <div className="animate-code-scroll">
                                        <p className="text-purple-400">&gt; library(lavaan)</p>
                                        <p>&gt; model &lt;- &#39; IV =~ x1 + x2 + x3</p>
                                        <p className="pl-12">MED =~ m1 + m2</p>
                                        <p className="pl-12">DV =~ y1 + y2 + y3</p>
                                        <p className="pl-12">DV ~ MED + IV</p>
                                        <p className="pl-12">MED ~ IV &#39;</p>
                                        <p>&gt; fit &lt;- sem(model, data=ncs_data)</p>
                                        <p className="text-yellow-400">&gt; Computing Iteration 1...</p>
                                        <p className="text-yellow-400">&gt; Computing Iteration 5...</p>
                                        <p className="text-yellow-400">&gt; Computing Iteration 12...</p>
                                        <p className="text-green-400">&gt; CONVERGED_NORMAL_GRADIENT</p>
                                        <p>&gt; summary(fit, fit.measures=TRUE)</p>
                                        <p className="text-cyan-400">&gt; Generating Matrix Representation...</p>
                                    </div>
                                    {/* Gradient overlay for fade */}
                                    <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-black to-transparent"></div>
                                </div>
                                <div className="absolute bottom-4 right-4 animate-spin-slow">
                                    <Sigma className="text-slate-700 w-12 h-12 opacity-50" />
                                </div>
                            </div>
                        </div>

                        {/* === SCENE 3: FINAL RESULTS (The "Dashboard") === */}
                        <div className={`absolute inset-0 transition-all duration-1000 ${step === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                            {/* Complicated Multi-Panel Layout */}
                            <div className="relative w-full h-full">

                                {/* 1. Path Diagram Card (Main) */}
                                <Card className="absolute top-10 left-10 w-[300px] bg-slate-900/90 border border-slate-700 p-4 shadow-2xl z-20">
                                    <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                                        <Network size={14} className="text-purple-400" />
                                        <span className="text-xs font-bold text-white uppercase">Path Model (Standardized)</span>
                                    </div>
                                    <div className="h-24 flex items-center justify-center relative">
                                        {/* Simplified Viz */}
                                        <div className="w-10 h-10 rounded-full border border-purple-400 flex items-center justify-center text-[10px] text-white absolute left-2">IV</div>
                                        <div className="w-10 h-10 rounded-full border border-cyan-400 flex items-center justify-center text-[10px] text-white absolute right-2">DV</div>
                                        <div className="h-0.5 w-full bg-slate-600 mx-12 relative">
                                            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 text-[9px] bg-black px-1 text-green-400">0.45***</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-mono">
                                        <span>CFI: 0.985</span>
                                        <span>TLI: 0.972</span>
                                        <span>RMSEA: 0.041</span>
                                    </div>
                                </Card>

                                {/* 2. Table Card (Floating Right) */}
                                <Card className="absolute top-32 right-0 w-[260px] bg-white text-slate-900 p-4 shadow-2xl z-30 transform rotate-2">
                                    <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-1">
                                        <Table size={14} className="text-slate-500" />
                                        <span className="text-xs font-bold uppercase">Regression Weights</span>
                                    </div>
                                    <div className="space-y-1">
                                        {['IV -> MED', 'MED -> DV', 'IV -> DV'].map((rel, i) => (
                                            <div key={rel} className="flex justify-between text-[10px] font-mono border-b border-slate-100 py-1">
                                                <span>{rel}</span>
                                                <span className="font-bold">{[0.52, 0.43, 0.21][i].toString()}</span>
                                                <span className="text-green-600 font-bold">&lt; .001</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* 3. Heatmap Card (Floating Bottom) */}
                                <Card className="absolute bottom-10 left-20 w-[240px] bg-slate-800 border-none p-4 shadow-2xl z-25 opacity-90">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BarChart3 size={14} className="text-orange-400" />
                                        <span className="text-xs font-bold text-white uppercase">Correlation Matrix</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-0.5">
                                        {Array.from({ length: 16 }).map((_, i) => {
                                            const op = Math.random();
                                            return <div key={i} className="h-4 w-full bg-orange-500" style={{ opacity: op }}></div>
                                        })}
                                    </div>
                                </Card>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Disclaimer Footer */}
            <div className="absolute bottom-4 left-0 w-full text-center text-slate-600 text-[10px] font-mono">
                POWERED BY NCS.STAT ENGINE • WEBASSEMBLY ACCELERATED • SCIENTIFIC STANDARD
            </div>
        </div>
    );
}

// Indicator Component for List
function StepIndicator({ active, title, desc }: { active: boolean, title: string, desc: string }) {
    return (
        <div className={`flex items-center gap-4 transition-all duration-500 ${active ? 'opacity-100 translate-x-2' : 'opacity-40'}`}>
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${active ? 'bg-cyan-400 scale-125 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-700'}`}></div>
            <div>
                <div className={`text-sm font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-slate-400'}`}>{title}</div>
                <div className="text-xs text-slate-500 font-light">{desc}</div>
            </div>
        </div>
    )
}
