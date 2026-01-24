/**
 * WorkflowPanel Component
 * 
 * Visual workflow guide for the statistical analysis flow:
 * Cronbach Alpha → EFA → CFA → SEM
 */

'use client';

import React from 'react';
import { CheckCircle, Circle, ArrowRight, AlertTriangle, TrendingUp } from 'lucide-react';

interface WorkflowStep {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    criteria: string;
    status: 'completed' | 'current' | 'pending' | 'skipped';
    result?: {
        value: number | string;
        label: string;
        passed: boolean;
    };
}

interface WorkflowPanelProps {
    currentStep: string;
    completedSteps: string[];
    cronbachAlpha?: number;
    kmo?: number;
    cfiFit?: number;
    onStepClick?: (stepId: string) => void;
}

const WORKFLOW_STEPS: Omit<WorkflowStep, 'status' | 'result'>[] = [
    {
        id: 'cronbach',
        name: 'Độ Tin Cậy',
        nameEn: "Cronbach's Alpha",
        description: 'Kiểm tra độ tin cậy nội tại của thang đo',
        criteria: 'α ≥ 0.70'
    },
    {
        id: 'efa',
        name: 'Khám Phá Nhân Tố',
        nameEn: 'EFA',
        description: 'Khám phá cấu trúc nhân tố tiềm ẩn',
        criteria: 'KMO ≥ 0.60, Bartlett p < 0.05'
    },
    {
        id: 'cfa',
        name: 'Khẳng Định Nhân Tố',
        nameEn: 'CFA',
        description: 'Xác nhận cấu trúc nhân tố từ EFA',
        criteria: 'CFI ≥ 0.90, RMSEA ≤ 0.08'
    },
    {
        id: 'sem',
        name: 'Mô Hình Cấu Trúc',
        nameEn: 'SEM',
        description: 'Kiểm định các giả thuyết nghiên cứu',
        criteria: 'Fit indices đạt chuẩn'
    }
];

export function WorkflowPanel({
    currentStep,
    completedSteps = [],
    cronbachAlpha,
    kmo,
    cfiFit,
    onStepClick
}: WorkflowPanelProps) {

    const getStepStatus = (stepId: string): WorkflowStep['status'] => {
        if (completedSteps.includes(stepId)) return 'completed';
        if (currentStep === stepId) return 'current';
        return 'pending';
    };

    const getStepResult = (stepId: string): WorkflowStep['result'] | undefined => {
        switch (stepId) {
            case 'cronbach':
                if (cronbachAlpha !== undefined) {
                    return {
                        value: cronbachAlpha.toFixed(3),
                        label: 'α',
                        passed: cronbachAlpha >= 0.7
                    };
                }
                break;
            case 'efa':
                if (kmo !== undefined) {
                    return {
                        value: kmo.toFixed(3),
                        label: 'KMO',
                        passed: kmo >= 0.6
                    };
                }
                break;
            case 'cfa':
                if (cfiFit !== undefined) {
                    return {
                        value: cfiFit.toFixed(3),
                        label: 'CFI',
                        passed: cfiFit >= 0.9
                    };
                }
                break;
        }
        return undefined;
    };

    const steps: WorkflowStep[] = WORKFLOW_STEPS.map(step => ({
        ...step,
        status: getStepStatus(step.id),
        result: getStepResult(step.id)
    }));

    return (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600 rounded-lg shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-indigo-900">Workflow Mode</h3>
                    <p className="text-xs text-indigo-600">Quy trình phân tích chuẩn cho luận văn định lượng</p>
                </div>
            </div>

            {/* Steps */}
            <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 z-0">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{
                            width: `${(completedSteps.length / (WORKFLOW_STEPS.length - 1)) * 100}%`
                        }}
                    />
                </div>

                <div className="relative z-10 flex justify-between">
                    {steps.map((step, idx) => (
                        <div
                            key={step.id}
                            className={`flex flex-col items-center text-center ${step.status === 'current' ? 'scale-105' : ''
                                } transition-transform cursor-pointer`}
                            onClick={() => onStepClick?.(step.id)}
                        >
                            {/* Step Circle */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${step.status === 'completed'
                                    ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                                    : step.status === 'current'
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-100'
                                        : 'bg-white text-gray-400 border-2 border-gray-200'
                                }`}>
                                {step.status === 'completed' ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : (
                                    <span className="font-bold text-lg">{idx + 1}</span>
                                )}
                            </div>

                            {/* Step Name */}
                            <div className="mt-3 w-24">
                                <div className={`text-sm font-semibold ${step.status === 'current' ? 'text-indigo-900' :
                                        step.status === 'completed' ? 'text-green-700' : 'text-gray-500'
                                    }`}>
                                    {step.nameEn}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {step.name}
                                </div>
                            </div>

                            {/* Result Badge */}
                            {step.result && (
                                <div className={`mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${step.result.passed
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                                    }`}>
                                    {step.result.label} = {step.result.value}
                                </div>
                            )}

                            {/* Criteria */}
                            {step.status === 'current' && (
                                <div className="mt-2 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                    {step.criteria}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Current Step Guidance */}
            {steps.find(s => s.status === 'current') && (
                <div className="mt-6 bg-white/70 rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-indigo-100 rounded">
                            <ArrowRight className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <div className="font-medium text-indigo-900">
                                Bước hiện tại: {steps.find(s => s.status === 'current')?.name}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                {steps.find(s => s.status === 'current')?.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Workflow Status Summary */}
            <div className="mt-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">Hoàn thành ({completedSteps.length})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <span className="text-gray-600">Đang thực hiện</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        <span className="text-gray-600">Chờ xử lý</span>
                    </div>
                </div>
                <div className="text-gray-500">
                    Tiến độ: {completedSteps.length}/{WORKFLOW_STEPS.length}
                </div>
            </div>
        </div>
    );
}

/**
 * WorkflowNextStep Component
 * Shows recommendation for next step after analysis
 */
interface WorkflowNextStepProps {
    currentAnalysis: string;
    canProceed: boolean;
    nextStep: string;
    nextStepName: string;
    reason: string;
    onProceed: () => void;
}

export function WorkflowNextStep({
    currentAnalysis,
    canProceed,
    nextStep,
    nextStepName,
    reason,
    onProceed
}: WorkflowNextStepProps) {
    if (!canProceed) {
        return (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mt-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-orange-900">Chưa đủ điều kiện tiến hành bước tiếp theo</h4>
                        <p className="text-sm text-orange-700 mt-1">{reason}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-6 mt-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <CheckCircle className="w-7 h-7" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-emerald-900 mb-2 text-lg">
                        ✅ Đủ điều kiện tiến hành {nextStepName}
                    </h4>
                    <p className="text-sm text-emerald-700 mb-4">{reason}</p>
                    <button
                        onClick={onProceed}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <span>Tiếp tục {nextStepName}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
