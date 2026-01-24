/**
 * TemplateInterpretation Component
 * Uses ASIG template-based interpretation (NO AI COST!)
 * 
 * This component displays automatic academic interpretations
 * using pre-defined templates stored in interpretation-templates.ts
 */

'use client';

import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, AlertTriangle, BookMarked, Copy, Check } from 'lucide-react';
import {
    generateInterpretation,
    interpretCronbachAlpha,
    interpretCorrelation,
    interpretTTestIndependent,
    interpretANOVA,
    interpretLinearRegression,
    interpretLogisticRegression,
    interpretChiSquare,
    interpretEFA,
    interpretCFA,
    interpretMediation,
    InterpretationResult
} from '@/lib/interpretation-templates';

interface TemplateInterpretationProps {
    analysisType: string;
    results: any;
    scaleName?: string;
    variableNames?: Record<string, string>;
}

export function TemplateInterpretation({
    analysisType,
    results,
    scaleName = 'Thang đo',
    variableNames = {}
}: TemplateInterpretationProps) {
    const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!results) return;

        try {
            let result: InterpretationResult;

            switch (analysisType) {
                case 'cronbach':
                case 'cronbach_alpha':
                    result = interpretCronbachAlpha({
                        scaleName: scaleName,
                        nItems: results.nItems || results.itemStats?.length || 0,
                        alpha: results.rawAlpha || results.alpha || 0,
                        omega: results.omega,
                        badItems: results.itemStats
                            ?.filter((item: any) => item.correctedItemTotal < 0.3)
                            ?.map((item: any) => item.variable) || []
                    });
                    break;

                case 'correlation':
                    result = interpretCorrelation({
                        var1: variableNames.var1 || 'Biến 1',
                        var2: variableNames.var2 || 'Biến 2',
                        r: results.r || results.correlation?.[0]?.[1] || 0,
                        pValue: results.pValue || results.pValues?.[0]?.[1] || 0,
                        method: results.method || 'pearson'
                    });
                    break;

                case 'ttest':
                case 'ttest_independent':
                    result = interpretTTestIndependent({
                        groupVar: variableNames.groupVar || 'Nhóm',
                        targetVar: variableNames.targetVar || 'Biến phụ thuộc',
                        group1Name: variableNames.group1 || 'Nhóm 1',
                        group2Name: variableNames.group2 || 'Nhóm 2',
                        mean1: results.mean1 || 0,
                        sd1: results.sd1 || 0,
                        mean2: results.mean2 || 0,
                        sd2: results.sd2 || 0,
                        t: results.t || 0,
                        df: results.df || 0,
                        pValue: results.pValue || 0,
                        cohensD: results.effectSize,
                        leveneP: results.assumptionCheckP,
                        shapiroP1: results.normalityP1,
                        shapiroP2: results.normalityP2
                    });
                    break;

                case 'anova':
                case 'one_way_anova':
                    result = interpretANOVA({
                        factorVar: variableNames.factorVar || 'Biến phân nhóm',
                        targetVar: variableNames.targetVar || 'Biến phụ thuộc',
                        F: results.F || 0,
                        dfBetween: results.dfBetween || 0,
                        dfWithin: results.dfWithin || 0,
                        pValue: results.pValue || 0,
                        etaSquared: results.etaSquared,
                        methodUsed: results.methodUsed,
                        leveneP: results.assumptionCheckP,
                        normalityResidP: results.normalityResidP,
                        postHoc: results.postHoc
                    });
                    break;

                case 'regression':
                case 'linear_regression':
                    result = interpretLinearRegression({
                        dependentVar: variableNames.dependent || 'Y',
                        rSquared: results.modelFit?.rSquared || 0,
                        adjRSquared: results.modelFit?.adjRSquared || 0,
                        fStatistic: results.modelFit?.fStatistic || 0,
                        fPValue: results.modelFit?.pValue || 0,
                        coefficients: results.coefficients || [],
                        normalityP: results.modelFit?.normalityP
                    });
                    break;

                case 'logistic':
                case 'logistic_regression':
                    result = interpretLogisticRegression({
                        dependentVar: variableNames.dependent || 'Y',
                        pseudoR2: results.modelFit?.pseudoR2 || 0,
                        accuracy: results.modelFit?.accuracy || 0,
                        coefficients: results.coefficients || []
                    });
                    break;

                case 'chi_square':
                case 'chisquare':
                    result = interpretChiSquare({
                        var1: variableNames.var1 || 'Biến 1',
                        var2: variableNames.var2 || 'Biến 2',
                        statistic: results.statistic || 0,
                        df: results.df || 0,
                        pValue: results.pValue || 0,
                        cramersV: results.cramersV || 0,
                        fisherPValue: results.fisherPValue,
                        warning: results.warning
                    });
                    break;

                case 'efa':
                    result = interpretEFA({
                        kmo: results.kmo || 0,
                        bartlettP: results.bartlettP || 0,
                        nFactors: results.nFactorsUsed || 0,
                        factorMethod: results.factorMethod || 'kaiser',
                        totalVariance: results.totalVariance
                    });
                    break;

                case 'cfa':
                    result = interpretCFA({
                        chi2: results.fitMeasures?.chisq || 0,
                        df: results.fitMeasures?.df || 0,
                        pValue: results.fitMeasures?.pvalue || 0,
                        cfi: results.fitMeasures?.cfi || 0,
                        tli: results.fitMeasures?.tli || 0,
                        rmsea: results.fitMeasures?.rmsea || 0,
                        srmr: results.fitMeasures?.srmr || 0
                    });
                    break;

                case 'mediation':
                    result = interpretMediation({
                        xVar: variableNames.x || 'X',
                        mVar: variableNames.m || 'M',
                        yVar: variableNames.y || 'Y',
                        pathA: results.pathA || { estimate: 0, pValue: 1 },
                        pathB: results.pathB || { estimate: 0, pValue: 1 },
                        pathC: results.pathC || { estimate: 0, pValue: 1 },
                        pathCprime: results.pathCprime || { estimate: 0, pValue: 1 },
                        indirectEffect: results.indirectEffect || 0,
                        sobelZ: results.sobelZ || 0,
                        sobelP: results.sobelP || 1,
                        bootstrapCI: results.bootstrapCI,
                        mediationType: results.mediationType || 'none'
                    });
                    break;

                default:
                    result = {
                        summary: `Chưa có template diễn giải cho phân tích "${analysisType}".`,
                        details: [],
                        warnings: [],
                        citations: []
                    };
            }

            setInterpretation(result);
        } catch (err) {
            console.error('Template interpretation error:', err);
            setInterpretation({
                summary: 'Không thể tạo diễn giải tự động.',
                details: [],
                warnings: ['Có lỗi xảy ra khi xử lý dữ liệu.'],
                citations: []
            });
        }
    }, [analysisType, results, scaleName, variableNames]);

    const handleCopy = () => {
        if (!interpretation) return;

        const text = [
            interpretation.summary,
            ...interpretation.details,
            interpretation.warnings.length > 0 ? '\nLưu ý: ' + interpretation.warnings.join(' ') : '',
            '\nTài liệu tham khảo:\n' + interpretation.citations.join('\n')
        ].filter(Boolean).join('\n\n');

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!interpretation) return null;

    return (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mt-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 rounded-lg shadow-md shadow-emerald-200">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-emerald-900">Nhận định Học thuật</h3>
                        <p className="text-xs text-emerald-600">Tự động • Chuẩn APA • Không tốn chi phí</p>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-sm hover:bg-emerald-50 transition-colors"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
            </div>

            {/* Summary */}
            <div className="bg-white/70 rounded-lg p-4 mb-4 border border-emerald-100">
                <p className="text-gray-800 leading-relaxed">{interpretation.summary}</p>
            </div>

            {/* Details */}
            {interpretation.details.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Chi tiết
                    </h4>
                    <ul className="space-y-2">
                        {interpretation.details.map((detail, idx) => (
                            <li key={idx} className="text-sm text-gray-700 bg-white/50 p-2 rounded border-l-2 border-emerald-400">
                                {detail}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Warnings */}
            {interpretation.warnings.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Lưu ý
                    </h4>
                    <ul className="space-y-1">
                        {interpretation.warnings.map((warning, idx) => (
                            <li key={idx} className="text-sm text-amber-700">
                                • {warning}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Citations */}
            {interpretation.citations.length > 0 && (
                <div className="border-t border-emerald-200 pt-3 mt-3">
                    <h4 className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                        <BookMarked className="w-3 h-3" />
                        Tài liệu tham khảo
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                        {interpretation.citations.map((citation, idx) => (
                            <li key={idx} className="italic">{citation}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
