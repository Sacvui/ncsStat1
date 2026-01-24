import { NextRequest, NextResponse } from 'next/server';
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

/**
 * Template-based interpretation endpoint (NO AI COST!)
 * 
 * This uses pre-defined academic templates based on ASIG specifications
 * to generate interpretations without calling external AI APIs.
 */
export async function POST(req: NextRequest) {
    try {
        const { analysisType, results, scaleName, variableNames } = await req.json();

        if (!analysisType || !results) {
            return NextResponse.json(
                { error: 'Missing analysisType or results' },
                { status: 400 }
            );
        }

        let interpretation: InterpretationResult;

        switch (analysisType) {
            case 'cronbach':
            case 'cronbach_alpha':
                interpretation = interpretCronbachAlpha({
                    scaleName: scaleName || 'Thang đo',
                    nItems: results.nItems || 0,
                    alpha: results.alpha || results.rawAlpha || 0,
                    omega: results.omega || undefined,
                    badItems: results.badItems || []
                });
                break;

            case 'correlation':
                interpretation = interpretCorrelation({
                    var1: variableNames?.[0] || 'Biến 1',
                    var2: variableNames?.[1] || 'Biến 2',
                    r: results.r || results.correlation || 0,
                    pValue: results.pValue || results.p || 0,
                    method: results.method || 'pearson'
                });
                break;

            case 'ttest':
            case 'ttest_independent':
                interpretation = interpretTTestIndependent({
                    groupVar: variableNames?.groupVar || 'Biến phân nhóm',
                    targetVar: variableNames?.targetVar || 'Biến phụ thuộc',
                    group1Name: variableNames?.group1 || 'Nhóm 1',
                    group2Name: variableNames?.group2 || 'Nhóm 2',
                    mean1: results.mean1 || 0,
                    sd1: results.sd1 || 0,
                    mean2: results.mean2 || 0,
                    sd2: results.sd2 || 0,
                    t: results.t || 0,
                    df: results.df || 0,
                    pValue: results.pValue || 0,
                    cohensD: results.effectSize || results.cohensD,
                    leveneP: results.assumptionCheckP || results.leveneP,
                    shapiroP1: results.normalityP1,
                    shapiroP2: results.normalityP2
                });
                break;

            case 'anova':
            case 'one_way_anova':
                interpretation = interpretANOVA({
                    factorVar: variableNames?.factorVar || 'Biến phân nhóm',
                    targetVar: variableNames?.targetVar || 'Biến phụ thuộc',
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
                interpretation = interpretLinearRegression({
                    dependentVar: variableNames?.dependent || 'Biến phụ thuộc',
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
                interpretation = interpretLogisticRegression({
                    dependentVar: variableNames?.dependent || 'Biến phụ thuộc',
                    pseudoR2: results.modelFit?.pseudoR2 || 0,
                    accuracy: results.modelFit?.accuracy || 0,
                    coefficients: results.coefficients || []
                });
                break;

            case 'chi_square':
            case 'chisquare':
                interpretation = interpretChiSquare({
                    var1: variableNames?.[0] || 'Biến 1',
                    var2: variableNames?.[1] || 'Biến 2',
                    statistic: results.statistic || 0,
                    df: results.df || 0,
                    pValue: results.pValue || 0,
                    cramersV: results.cramersV || 0,
                    fisherPValue: results.fisherPValue,
                    warning: results.warning
                });
                break;

            case 'efa':
                interpretation = interpretEFA({
                    kmo: results.kmo || 0,
                    bartlettP: results.bartlettP || 0,
                    nFactors: results.nFactorsUsed || 0,
                    factorMethod: results.factorMethod || 'kaiser',
                    totalVariance: results.totalVariance
                });
                break;

            case 'cfa':
                interpretation = interpretCFA({
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
                interpretation = interpretMediation({
                    xVar: variableNames?.x || 'X',
                    mVar: variableNames?.m || 'M',
                    yVar: variableNames?.y || 'Y',
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
                interpretation = {
                    summary: `Chưa có template diễn giải cho phân tích "${analysisType}".`,
                    details: [],
                    warnings: [],
                    citations: []
                };
        }

        // Format response similar to AI endpoint for compatibility
        const formattedResponse = formatAsMarkdown(interpretation);

        return NextResponse.json({
            success: true,
            interpretation,
            // Legacy format for backward compatibility
            explanation: formattedResponse,
            structured: {
                summary: interpretation.summary,
                details: interpretation.details,
                warnings: interpretation.warnings,
                citations: interpretation.citations
            }
        });

    } catch (error) {
        console.error('Template interpretation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate interpretation' },
            { status: 500 }
        );
    }
}

/**
 * Format interpretation as Markdown for display
 */
function formatAsMarkdown(result: InterpretationResult): string {
    const lines: string[] = [];

    // Summary
    lines.push('## 📊 Kết quả phân tích\n');
    lines.push(result.summary);
    lines.push('');

    // Details
    if (result.details.length > 0) {
        lines.push('### 📝 Chi tiết\n');
        for (const detail of result.details) {
            lines.push(`- ${detail}`);
        }
        lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
        lines.push('### ⚠️ Lưu ý\n');
        for (const warning of result.warnings) {
            lines.push(`> ⚠️ ${warning}`);
        }
        lines.push('');
    }

    // Citations
    if (result.citations.length > 0) {
        lines.push('### 📚 Tài liệu tham khảo\n');
        for (const citation of result.citations) {
            lines.push(`- ${citation}`);
        }
    }

    return lines.join('\n');
}
