'use client';

import React, { useEffect, useState } from 'react';
import {
    Database,
    FileSpreadsheet,
    BarChart3,
    BrainCircuit,
    CheckCircle2,
    ArrowRight,
    PieChart,
    Network
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function ProjectFlowAnimation() {
    // Animation steps:
    // 0: Upload Data
    // 1: Select Variables
    // 2: Run Analysis (Processing)
    // 3: Scientific Results
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 4000); // Slower cycle for better viewing
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full flex flex-col justify-center items-center p-10 overflow-hidden bg-gradient-to-br from-indigo-950 to-blue-950 text-white">
            {/* Background Grid & Math Symbols (Subtle) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
            </div>

            {/* Abstract Scientific Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-indigo-500 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="z-10 w-full max-w-lg space-y-8 relative">
                <div className="text-center space-y-2 mb-12">
                    <h2 className="text-4xl font-bold tracking-tight text-white mb-2 font-mono">
                        Scientific Workflow
                    </h2>
                    <p className="text-blue-200/80 text-lg">
                        From raw data to publication-ready insights.
                    </p>
                </div>

                {/* Workflow Steps Visualization */}
                <div className="relative pl-4">
                    {/* Connecting Line */}
                    <div className="absolute left-[36px] top-4 bottom-4 w-0.5 bg-blue-800/30 -z-10"></div>

                    {/* Step 1: Data Upload */}
                    <FlowStep
                        active={step === 0}
                        completed={step > 0}
                        icon={<FileSpreadsheet className="w-6 h-6" />}
                        title="Raw Data Import"
                        description="Auto-cleaning & preprocessing."
                    />

                    {/* Step 2: Config */}
                    <FlowStep
                        active={step === 1}
                        completed={step > 1}
                        icon={<Database className="w-6 h-6" />}
                        title="Model Configuration"
                        description="Define variables & hypotheses."
                    />

                    {/* Step 3: Analysis */}
                    <FlowStep
                        active={step === 2}
                        completed={step > 2}
                        icon={<BrainCircuit className="w-6 h-6" />}
                        title="Statistical Processing"
                        description="R-WASM Engine (Matrix Algebra)."
                    />

                    {/* Step 4: Results */}
                    <FlowStep
                        active={step === 3}
                        completed={step > 3}
                        isLast
                        icon={<BarChart3 className="w-6 h-6" />}
                        title="Publication-Ready Results"
                        description="APA tables & SEM path diagrams."
                    />
                </div>

                {/* VISUALIZATIONS OVERLAY */}
                {/* Step 2: Matrix Algebra / Code Scrolling */}
                <div className={`absolute top-20 -right-20 w-80 p-4 bg-black/80 rounded-xl border border-blue-500/30 font-mono text-xs text-green-400 shadow-2xl transition-all duration-500 transform ${step === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                    <div className="border-b border-gray-700 pb-2 mb-2 text-gray-400 flex justify-between">
                        <span>R Engine Core</span>
                        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><div className="w-2 h-2 rounded-full bg-yellow-500" /><div className="w-2 h-2 rounded-full bg-green-500" /></div>
                    </div>
                    <div className="space-y-1 opacity-80">
                        <p>&gt; matrix_X &lt;- as.matrix(data)</p>
                        <p>&gt; correlation &lt;- cor(matrix_X)</p>
                        <p>&gt; eigen_decomp &lt;- eigen(correlation)</p>
                        <p>&gt; SEM_model &lt;- 'factor =~ x1 + x2'</p>
                        <p>&gt; fit &lt;- cfa(SEM_model, data)</p>
                        <p className="text-blue-300 animate-pulse">&gt; Calculating P-Values...</p>
                        <p className="text-green-300">&gt; Converged (Iterations: 12)</p>
                    </div>
                </div>

                {/* Step 3: Complex SEM Diagram */}
                <div className={`absolute top-10 -right-32 w-96 p-5 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl transition-all duration-700 transform ${step === 3 ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-95 pointer-events-none'}`}>
                    <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                            <Network className="w-4 h-4 text-blue-400" /> Structural Model (SEM)
                        </span>
                        <span className="text-[10px] text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full">Fit: Excellent</span>
                    </div>

                    {/* Diagram */}
                    <div className="relative h-48 w-full flex items-center justify-between px-2">
                        {/* Factor 1 */}
                        <div className="flex flex-col gap-2 items-center">
                            <div className="w-12 h-12 rounded-full border-2 border-blue-400 flex items-center justify-center bg-blue-900/50 text-white font-bold text-xs relative z-10 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                IV
                            </div>
                            <div className="flex gap-1 justify-center">
                                <div className="w-6 h-4 border border-blue-300/50 bg-white/5 mx-auto mb-1"></div>
                                <div className="w-6 h-4 border border-blue-300/50 bg-white/5 mx-auto mb-1"></div>
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-400 to-green-400 relative mx-2">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/50 px-1 rounded">β = 0.45***</div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-green-400 rotate-45"></div>
                        </div>

                        {/* Factor 2 */}
                        <div className="flex flex-col gap-2 items-center">
                            <div className="w-12 h-12 rounded-full border-2 border-green-400 flex items-center justify-center bg-green-900/50 text-white font-bold text-xs relative z-10 shadow-[0_0_15px_rgba(74,222,128,0.5)]">
                                DV
                            </div>
                            <div className="flex gap-1 justify-center">
                                <div className="w-6 h-4 border border-green-300/50 bg-white/5 mx-auto mb-1"></div>
                                <div className="w-6 h-4 border border-green-300/50 bg-white/5 mx-auto mb-1"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 text-[10px] text-white/50 text-center font-mono">
                        Global Fit: CFI=0.98, TLI=0.97, RMSEA=0.04
                    </div>
                </div>

            </div>
        </div>
    );
}

function FlowStep({ active, completed, display, icon, title, description, isLast }: any) {
    return (
        <div className={`relative flex items-center gap-6 mb-10 ${isLast ? 'mb-0' : ''}`}>
            {/* Dot/Icon Circle */}
            <div
                className={`
                    flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 z-10 relative
                    ${active
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.6)] scale-110 rotate-3'
                        : completed
                            ? 'bg-blue-900/40 border-blue-800 text-blue-400 grayscale'
                            : 'bg-transparent border-white/10 text-white/20'
                    }
                `}
            >
                {icon}
                {/* Active pulse ring */}
                {active && <div className="absolute inset-0 rounded-2xl border border-blue-400 animate-ping opacity-50"></div>}
            </div>

            {/* Content */}
            <div className={`transition-all duration-500 ${active ? 'opacity-100 translate-x-2' : 'opacity-40 translate-x-0'}`}>
                <h3 className={`font-bold text-xl mb-1 tracking-wide ${active ? 'text-white' : 'text-blue-100'}`}>
                    {title}
                </h3>
                <p className="text-sm text-blue-200/60 leading-relaxed font-light">
                    {description}
                </p>
            </div>
        </div>
    );
}
