/**
 * ASIG - Auto Statistical Interpretation Generator
 * Template-based interpretation system (NO AI REQUIRED)
 * 
 * Math symbols use Unicode for cross-device compatibility:
 * - α (alpha), β (beta), χ² (chi-square), η² (eta-squared)
 * - M (mean), SD, p, r, F, t, df
 * - ≥, ≤, <, >, ≠
 */

// ===== UTILITY FUNCTIONS =====

/**
 * Format p-value according to APA style
 * - No leading zero
 * - If p < .001, show "p < .001"
 */
export function formatPValue(p: number): string {
    if (p < 0.001) return 'p < .001';
    if (p < 0.01) return `p = ${p.toFixed(3).replace('0.', '.')}`;
    if (p < 0.05) return `p = ${p.toFixed(3).replace('0.', '.')}`;
    return `p = ${p.toFixed(2).replace('0.', '.')}`;
}

/**
 * Format correlation/alpha values (no leading zero for values < 1)
 */
export function formatCoef(val: number, decimals: number = 2): string {
    if (Math.abs(val) < 1) {
        return val.toFixed(decimals).replace('0.', '.');
    }
    return val.toFixed(decimals);
}

/**
 * Format regular numbers (with leading zero)
 */
export function formatNum(val: number, decimals: number = 2): string {
    return val.toFixed(decimals);
}

// ===== INTERPRETATION TYPES =====

export type AnalysisType =
    | 'cronbach_alpha'
    | 'correlation'
    | 'ttest_independent'
    | 'ttest_paired'
    | 'anova'
    | 'efa'
    | 'cfa'
    | 'linear_regression'
    | 'logistic_regression'
    | 'mann_whitney'
    | 'kruskal_wallis'
    | 'wilcoxon_signed'
    | 'chi_square'
    | 'mediation';

export interface InterpretationResult {
    summary: string;        // Main interpretation
    details: string[];      // Additional points
    warnings: string[];     // Assumption violations
    citations: string[];    // Academic references
}

// ===== CRONBACH'S ALPHA =====

export function interpretCronbachAlpha(params: {
    scaleName: string;
    nItems: number;
    alpha: number;
    omega?: number;
    badItems?: string[];
}): InterpretationResult {
    const { scaleName, nItems, alpha, omega, badItems } = params;
    const alphaStr = formatCoef(alpha);

    let summary = '';
    const details: string[] = [];
    const warnings: string[] = [];
    const citations = ['Nunnally, J. C. (1978). Psychometric theory (2nd ed.). McGraw-Hill.'];

    if (alpha >= 0.7) {
        summary = `Kết quả kiểm định độ tin cậy cho thang đo "${scaleName}" (gồm ${nItems} biến quan sát) cho thấy hệ số Cronbach's Alpha đạt α = ${alphaStr}${omega && omega > 0 ? ` và McDonald's Omega đạt ω = ${formatCoef(omega)}` : ''}. Kết quả này thỏa mãn điều kiện khuyến nghị (${omega ? 'các chỉ số' : 'α'} ≥ .70), chứng tỏ thang đo có độ tin cậy nội tại tốt và phù hợp cho các phân tích tiếp theo.`;
    } else if (alpha >= 0.6) {
        summary = `Hệ số Cronbach's Alpha của thang đo "${scaleName}" là α = ${alphaStr}. Mặc dù giá trị này thấp hơn ngưỡng .70 nhưng vẫn nằm trong mức chấp nhận được đối với các nghiên cứu mang tính khám phá.`;
        if (omega) summary += ` Hệ số McDonald's Omega là ω = ${formatCoef(omega)}.`;
        citations.push('Hair, J. F., et al. (2010). Multivariate data analysis (7th ed.). Pearson.');
    } else {
        summary = `Thang đo "${scaleName}" có hệ số Cronbach's Alpha là α = ${alphaStr} (< .60). Thang đo này không đảm bảo độ tin cậy và cần được điều chỉnh lại cấu trúc.`;
        warnings.push('Độ tin cậy không đạt yêu cầu. Cần xem xét loại bỏ hoặc điều chỉnh biến.');
    }

    // McDonald's Omega
    if (omega && omega > 0) {
        details.push(`Hệ số McDonald's Omega (ω) = ${formatCoef(omega)}, cho thấy độ tin cậy tổng thể của thang đo.`);
    }

    // Bad items
    if (badItems && badItems.length > 0) {
        warnings.push(`Biến quan sát ${badItems.join(', ')} có hệ số tương quan biến-tổng (Item-Total Correlation) nhỏ hơn .30. Việc loại bỏ biến này có thể cải thiện độ tin cậy.`);
    }

    return { summary, details, warnings, citations };
}

// ===== CORRELATION =====

export function interpretCorrelation(params: {
    var1: string;
    var2: string;
    r: number;
    pValue: number;
    method?: 'pearson' | 'spearman' | 'kendall';
}): InterpretationResult {
    const { var1, var2, r, pValue, method = 'pearson' } = params;
    const rStr = formatCoef(r);
    const pStr = formatPValue(pValue);

    let summary = '';
    const details: string[] = [];
    const warnings: string[] = [];
    const citations = ['Cohen, J. (1988). Statistical power analysis for behavioral sciences (2nd ed.). Lawrence Erlbaum.'];

    const methodName = method === 'pearson' ? 'Pearson' : method === 'spearman' ? 'Spearman' : 'Kendall';

    if (pValue > 0.05) {
        summary = `Kết quả kiểm định ${methodName} cho thấy không có mối tương quan có ý nghĩa thống kê giữa "${var1}" và "${var2}" (r = ${rStr}, ${pStr}).`;
    } else {
        const direction = r > 0 ? 'thuận' : 'nghịch';
        const trend = r > 0 ? 'tăng' : 'giảm';

        let strength = '';
        const absR = Math.abs(r);
        if (absR < 0.3) strength = 'yếu';
        else if (absR < 0.5) strength = 'trung bình';
        else strength = 'mạnh';

        summary = `Kết quả phân tích cho thấy tồn tại mối tương quan ${direction} ở mức độ ${strength} giữa "${var1}" và "${var2}" với độ tin cậy 95% (r = ${rStr}, ${pStr}). Điều này hàm ý rằng khi "${var1}" tăng thì "${var2}" có xu hướng ${trend}.`;

        details.push(`Hệ số xác định r² = ${formatCoef(r * r)} cho thấy ${formatNum(r * r * 100, 1)}% sự biến thiên của biến này có thể giải thích bởi biến kia.`);
    }

    return { summary, details, warnings, citations };
}

// ===== INDEPENDENT T-TEST =====

export function interpretTTestIndependent(params: {
    groupVar: string;
    targetVar: string;
    group1Name: string;
    group2Name: string;
    mean1: number;
    sd1: number;
    mean2: number;
    sd2: number;
    t: number;
    df: number;
    pValue: number;
    cohensD?: number;
    leveneP?: number;
    shapiroP1?: number;
    shapiroP2?: number;
}): InterpretationResult {
    const { groupVar, targetVar, group1Name, group2Name, mean1, sd1, mean2, sd2, t, df, pValue, cohensD, leveneP, shapiroP1, shapiroP2 } = params;

    const pStr = formatPValue(pValue);
    const isWelch = leveneP !== undefined && leveneP < 0.05;
    const testName = isWelch ? "Welch's t-test" : "Independent t-test";

    let summary = '';
    const details: string[] = [];
    const warnings: string[] = [];
    const citations = ['Cohen, J. (1988). Statistical power analysis for behavioral sciences.'];

    if (pValue > 0.05) {
        summary = `Kiểm định ${testName} cho thấy không có sự khác biệt có ý nghĩa thống kê về "${targetVar}" giữa nhóm ${group1Name} (M = ${formatNum(mean1)}, SD = ${formatNum(sd1)}) và nhóm ${group2Name} (M = ${formatNum(mean2)}, SD = ${formatNum(sd2)}) với t(${formatNum(df, 0)}) = ${formatNum(t)}, ${pStr}.`;
    } else {
        const higherGroup = mean1 > mean2 ? group1Name : group2Name;
        const lowerGroup = mean1 > mean2 ? group2Name : group1Name;
        const mHigh = mean1 > mean2 ? mean1 : mean2;
        const mLow = mean1 > mean2 ? mean2 : mean1;
        const sdHigh = mean1 > mean2 ? sd1 : sd2;
        const sdLow = mean1 > mean2 ? sd2 : sd1;

        summary = `Có sự khác biệt có ý nghĩa thống kê về "${targetVar}" giữa hai nhóm (t(${formatNum(df, 0)}) = ${formatNum(t)}, ${pStr}). Cụ thể, giá trị trung bình của nhóm ${higherGroup} (M = ${formatNum(mHigh)}, SD = ${formatNum(sdHigh)}) cao hơn đáng kể so với nhóm ${lowerGroup} (M = ${formatNum(mLow)}, SD = ${formatNum(sdLow)}).`;
    }

    // Effect size
    if (cohensD !== undefined) {
        const d = Math.abs(cohensD);
        let effectLabel = '';
        if (d < 0.2) effectLabel = 'rất nhỏ';
        else if (d < 0.5) effectLabel = 'nhỏ';
        else if (d < 0.8) effectLabel = 'trung bình';
        else effectLabel = 'lớn';

        details.push(`Độ lớn ảnh hưởng Cohen's d = ${formatNum(cohensD)} (${effectLabel}).`);
    }

    // Assumption warnings
    if (leveneP !== undefined && leveneP < 0.05) {
        warnings.push(`Phương sai không đồng nhất (Levene's test: p = ${formatPValue(leveneP)}). Đã sử dụng Welch's t-test.`);
    }

    if (shapiroP1 !== undefined && shapiroP1 < 0.05) {
        warnings.push(`Nhóm ${group1Name} vi phạm giả định phân phối chuẩn (Shapiro-Wilk: p = ${formatPValue(shapiroP1)}).`);
    }

    if (shapiroP2 !== undefined && shapiroP2 < 0.05) {
        warnings.push(`Nhóm ${group2Name} vi phạm giả định phân phối chuẩn (Shapiro-Wilk: p = ${formatPValue(shapiroP2)}).`);
    }

    return { summary, details, warnings, citations };
}

// ===== ONE-WAY ANOVA =====

export function interpretANOVA(params: {
    factorVar: string;
    targetVar: string;
    F: number;
    dfBetween: number;
    dfWithin: number;
    pValue: number;
    etaSquared?: number;
    methodUsed?: string;
    leveneP?: number;
    normalityResidP?: number;
    postHoc?: { comparison: string; diff: number; pAdj: number }[];
}): InterpretationResult {
    const { factorVar, targetVar, F, dfBetween, dfWithin, pValue, etaSquared, methodUsed, leveneP, normalityResidP, postHoc } = params;

    const pStr = formatPValue(pValue);
    const testName = methodUsed === 'Welch ANOVA' ? 'Welch ANOVA' : 'One-way ANOVA';

    let summary = '';
    const details: string[] = [];
    const warnings: string[] = [];
    const citations = ['Richardson, J. T. E. (2011). Eta squared and partial eta squared as measures of effect size.'];

    if (pValue > 0.05) {
        summary = `Kết quả phân tích phương sai một yếu tố (${testName}) không tìm thấy sự khác biệt có ý nghĩa thống kê về "${targetVar}" giữa các nhóm "${factorVar}" khác nhau (F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${pStr}).`;
    } else {
        summary = `Kết quả kiểm định ${testName} cho thấy có sự khác biệt có ý nghĩa thống kê về "${targetVar}" giữa các nhóm "${factorVar}" (F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${pStr}).`;

        // Post-hoc
        if (postHoc && postHoc.length > 0) {
            const sigPairs = postHoc.filter(p => p.pAdj < 0.05);
            if (sigPairs.length > 0) {
                const pairStr = sigPairs.map(p => p.comparison).join(', ');
                details.push(`Kiểm định hậu kiểm (Post-hoc Tukey HSD) chỉ ra sự khác biệt có ý nghĩa giữa: ${pairStr}.`);
            }
        }
    }

    // Effect size
    if (etaSquared !== undefined) {
        let effectLabel = '';
        if (etaSquared < 0.01) effectLabel = 'rất nhỏ';
        else if (etaSquared < 0.06) effectLabel = 'nhỏ';
        else if (etaSquared < 0.14) effectLabel = 'trung bình';
        else effectLabel = 'lớn';

        details.push(`Độ lớn ảnh hưởng η² = ${formatCoef(etaSquared)} (${effectLabel}), cho thấy ${formatNum(etaSquared * 100, 1)}% phương sai được giải thích bởi biến phân nhóm.`);
    }

    // Warnings
    if (leveneP !== undefined && leveneP < 0.05) {
        warnings.push(`Phương sai không đồng nhất (Levene's: p = ${formatPValue(leveneP)}). Đã sử dụng Welch ANOVA.`);
    }

    if (normalityResidP !== undefined && normalityResidP > 0 && normalityResidP < 0.05) {
        warnings.push(`Phần dư vi phạm giả định phân phối chuẩn (Shapiro-Wilk: p = ${formatPValue(normalityResidP)}).`);
    }

    return { summary, details, warnings, citations };
}

// ===== LINEAR REGRESSION =====

export function interpretLinearRegression(params: {
    dependentVar: string;
    rSquared: number;
    adjRSquared: number;
    fStatistic: number;
    fPValue: number;
    coefficients: {
        term: string;
        estimate: number;
        stdBeta: number;
        pValue: number;
        vif?: number;
    }[];
    normalityP?: number;
}): InterpretationResult {
    const { dependentVar, rSquared, adjRSquared, fStatistic, fPValue, coefficients, normalityP } = params;

    const details: string[] = [];
    const warnings: string[] = [];
    const citations = ['Hair, J. F., et al. (2010). Multivariate data analysis (7th ed.). Pearson.'];

    // Model fit
    const summary = `Kết quả phân tích hồi quy cho thấy mô hình xây dựng là phù hợp với dữ liệu mẫu (F = ${formatNum(fStatistic)}, ${formatPValue(fPValue)}). Hệ số R² hiệu chỉnh là ${formatCoef(adjRSquared)}, cho biết các biến độc lập trong mô hình giải thích được ${formatNum(adjRSquared * 100, 1)}% sự biến thiên của biến phụ thuộc "${dependentVar}".`;

    // Coefficients
    const predictors = coefficients.filter(c => c.term !== '(Intercept)');
    for (const coef of predictors) {
        const direction = coef.estimate > 0 ? 'thuận' : 'nghịch';
        const accepted = coef.pValue < 0.05;

        if (accepted) {
            details.push(`Biến "${coef.term}" có tác động ${direction} chiều đến biến phụ thuộc (β = ${formatCoef(coef.stdBeta)}, ${formatPValue(coef.pValue)}). Giả thuyết được chấp nhận.`);
        } else {
            details.push(`Biến "${coef.term}" không có tác động có ý nghĩa thống kê (${formatPValue(coef.pValue)}).`);
        }

        // VIF check
        if (coef.vif !== undefined && coef.vif > 5) {
            warnings.push(`Biến "${coef.term}" có VIF = ${formatNum(coef.vif)} > 5, có dấu hiệu đa cộng tuyến.`);
        }
    }

    // Normality
    if (normalityP !== undefined && normalityP < 0.05) {
        warnings.push(`Phần dư vi phạm phân phối chuẩn (Shapiro-Wilk: ${formatPValue(normalityP)}).`);
    }

    return { summary, details, warnings, citations };
}

// ===== LOGISTIC REGRESSION =====

export function interpretLogisticRegression(params: {
    dependentVar: string;
    pseudoR2: number;
    accuracy: number;
    coefficients: {
        term: string;
        estimate: number;
        oddsRatio: number;
        pValue: number;
    }[];
}): InterpretationResult {
    const { dependentVar, pseudoR2, accuracy, coefficients } = params;

    const details: string[] = [];
    const warnings: string[] = [];
    const citations = ['Hosmer, D. W., & Lemeshow, S. (2000). Applied logistic regression (2nd ed.). Wiley.'];

    const summary = `Mô hình hồi quy logistic dự đoán "${dependentVar}" có McFadden's Pseudo R² = ${formatCoef(pseudoR2)} và độ chính xác phân loại đạt ${formatNum(accuracy * 100, 1)}%.`;

    // Coefficients
    const predictors = coefficients.filter(c => c.term !== '(Intercept)');
    for (const coef of predictors) {
        const or = coef.oddsRatio;
        const accepted = coef.pValue < 0.05;

        if (accepted) {
            if (or > 1) {
                details.push(`Biến "${coef.term}" làm TĂNG khả năng xảy ra sự kiện (OR = ${formatNum(or)}, ${formatPValue(coef.pValue)}). Khi biến này tăng 1 đơn vị, odds tăng ${formatNum((or - 1) * 100, 0)}%.`);
            } else {
                details.push(`Biến "${coef.term}" làm GIẢM khả năng xảy ra sự kiện (OR = ${formatNum(or)}, ${formatPValue(coef.pValue)}). Khi biến này tăng 1 đơn vị, odds giảm ${formatNum((1 - or) * 100, 0)}%.`);
            }
        } else {
            details.push(`Biến "${coef.term}" không có ảnh hưởng có ý nghĩa (${formatPValue(coef.pValue)}).`);
        }
    }

    return { summary, details, warnings, citations };
}

// ===== MEDIATION ANALYSIS =====

export function interpretMediation(params: {
    xVar: string;
    mVar: string;
    yVar: string;
    pathA: { estimate: number; pValue: number };
    pathB: { estimate: number; pValue: number };
    pathC: { estimate: number; pValue: number };
    pathCprime: { estimate: number; pValue: number };
    indirectEffect: number;
    sobelZ: number;
    sobelP: number;
    bootstrapCI?: { lower: number; upper: number };
    mediationType: 'full' | 'partial' | 'none';
}): InterpretationResult {
    const { xVar, mVar, yVar, pathA, pathB, pathC, pathCprime, indirectEffect, sobelZ, sobelP, bootstrapCI, mediationType } = params;

    let summary = '';
    const details: string[] = [];
    const warnings: string[] = [];
    const citations = [
        'Baron, R. M., & Kenny, D. A. (1986). The moderator-mediator variable distinction.',
        'Preacher, K. J., & Hayes, A. F. (2008). Asymptotic and resampling strategies for assessing and comparing indirect effects.'
    ];

    // Path coefficients
    details.push(`Path a (${xVar} → ${mVar}): β = ${formatCoef(pathA.estimate)}, ${formatPValue(pathA.pValue)}`);
    details.push(`Path b (${mVar} → ${yVar}): β = ${formatCoef(pathB.estimate)}, ${formatPValue(pathB.pValue)}`);
    details.push(`Path c (Total Effect): β = ${formatCoef(pathC.estimate)}, ${formatPValue(pathC.pValue)}`);
    details.push(`Path c' (Direct Effect): β = ${formatCoef(pathCprime.estimate)}, ${formatPValue(pathCprime.pValue)}`);
    details.push(`Indirect Effect (a × b): ${formatCoef(indirectEffect)}`);

    // Sobel test
    details.push(`Sobel test: Z = ${formatNum(sobelZ)}, ${formatPValue(sobelP)}`);

    // Bootstrap CI
    if (bootstrapCI) {
        details.push(`Bootstrap 95% CI: [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]`);
    }

    // Interpretation
    if (mediationType === 'full') {
        summary = `Kết quả phân tích cho thấy "${mVar}" đóng vai trò trung gian HOÀN TOÀN (Full Mediation) trong mối quan hệ giữa "${xVar}" và "${yVar}". Hiệu ứng gián tiếp có ý nghĩa thống kê (Sobel Z = ${formatNum(sobelZ)}, ${formatPValue(sobelP)}), trong khi hiệu ứng trực tiếp (c') không còn ý nghĩa khi có mặt biến trung gian.`;
    } else if (mediationType === 'partial') {
        summary = `Kết quả phân tích cho thấy "${mVar}" đóng vai trò trung gian MỘT PHẦN (Partial Mediation) trong mối quan hệ giữa "${xVar}" và "${yVar}". Cả hiệu ứng gián tiếp (Sobel Z = ${formatNum(sobelZ)}, ${formatPValue(sobelP)}) và hiệu ứng trực tiếp (c' = ${formatCoef(pathCprime.estimate)}, ${formatPValue(pathCprime.pValue)}) đều có ý nghĩa thống kê.`;
    } else {
        summary = `Không tìm thấy hiệu ứng trung gian của "${mVar}" trong mối quan hệ giữa "${xVar}" và "${yVar}" (Sobel test: ${formatPValue(sobelP)}).`;
    }

    return { summary, details, warnings, citations };
}

// ===== CHI-SQUARE =====

export function interpretChiSquare(params: {
    var1: string;
    var2: string;
    statistic: number;
    df: number;
    pValue: number;
    cramersV: number;
    fisherPValue?: number | null;
    warning?: string;
}): InterpretationResult {
    const { var1, var2, statistic, df, pValue, cramersV, fisherPValue, warning } = params;

    const details: string[] = [];
    const warnings: string[] = [];
    const citations = ['Cramér, H. (1946). Mathematical methods of statistics. Princeton University Press.'];

    let summary = '';

    if (pValue > 0.05) {
        summary = `Kiểm định Chi-Square cho thấy không có mối quan hệ có ý nghĩa thống kê giữa "${var1}" và "${var2}" (χ²(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}).`;
    } else {
        let strengthLabel = '';
        if (cramersV < 0.1) strengthLabel = 'rất yếu';
        else if (cramersV < 0.3) strengthLabel = 'yếu';
        else if (cramersV < 0.5) strengthLabel = 'trung bình';
        else strengthLabel = 'mạnh';

        summary = `Kết quả kiểm định Chi-Square cho thấy có mối quan hệ có ý nghĩa thống kê giữa "${var1}" và "${var2}" (χ²(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}). Độ mạnh của mối quan hệ ở mức ${strengthLabel} (Cramér's V = ${formatCoef(cramersV)}).`;
    }

    // Fisher's Exact
    if (fisherPValue !== null && fisherPValue !== undefined) {
        details.push(`Fisher's Exact test (cho bảng 2×2): ${formatPValue(fisherPValue)}`);
    }

    // Warning
    if (warning) {
        warnings.push(warning);
    }

    return { summary, details, warnings, citations };
}

// ===== EFA =====

export function interpretEFA(params: {
    kmo: number;
    bartlettP: number;
    nFactors: number;
    factorMethod: string;
    totalVariance?: number;
}): InterpretationResult {
    const { kmo, bartlettP, nFactors, factorMethod, totalVariance } = params;

    const details: string[] = [];
    const warnings: string[] = [];
    const citations = [
        'Kaiser, H. F. (1970). A second generation little jiffy. Psychometrika.',
        'Hair, J. F., et al. (2010). Multivariate data analysis.'
    ];

    // KMO interpretation
    let kmoLabel = '';
    if (kmo >= 0.9) kmoLabel = 'tuyệt vời';
    else if (kmo >= 0.8) kmoLabel = 'rất tốt';
    else if (kmo >= 0.7) kmoLabel = 'tốt';
    else if (kmo >= 0.6) kmoLabel = 'chấp nhận được';
    else kmoLabel = 'không đạt';

    let summary = `Kết quả kiểm định KMO = ${formatCoef(kmo)} (${kmoLabel}) và Bartlett's Test (${formatPValue(bartlettP)}) cho thấy dữ liệu phù hợp để tiến hành phân tích nhân tố khám phá.`;

    if (kmo < 0.6) {
        warnings.push(`Hệ số KMO < .60, dữ liệu có thể không phù hợp cho EFA.`);
    }

    // Factor extraction
    const methodStr = factorMethod === 'parallel' ? 'Parallel Analysis' : 'Kaiser criterion (eigenvalue > 1)';
    details.push(`Số nhân tố được trích xuất: ${nFactors} (phương pháp: ${methodStr}).`);

    if (totalVariance) {
        details.push(`Tổng phương sai giải thích: ${formatNum(totalVariance * 100, 1)}%.`);
    }

    return { summary, details, warnings, citations };
}

// ===== CFA =====

export function interpretCFA(params: {
    chi2: number;
    df: number;
    pValue: number;
    cfi: number;
    tli: number;
    rmsea: number;
    srmr: number;
}): InterpretationResult {
    const { chi2, df, pValue, cfi, tli, rmsea, srmr } = params;

    const details: string[] = [];
    const warnings: string[] = [];
    const citations = [
        'Hu, L., & Bentler, P. M. (1999). Cutoff criteria for fit indexes in covariance structure analysis.',
        'Kline, R. B. (2016). Principles and practice of structural equation modeling (4th ed.).'
    ];

    // Check fit indices
    const cfiOk = cfi >= 0.9;
    const tliOk = tli >= 0.9;
    const rmseaOk = rmsea <= 0.08;
    const srmrOk = srmr <= 0.08;

    const allGood = cfiOk && tliOk && rmseaOk && srmrOk;
    const mostGood = [cfiOk, tliOk, rmseaOk, srmrOk].filter(x => x).length >= 3;

    let summary = '';

    if (allGood) {
        summary = `Kết quả phân tích CFA cho thấy mô hình có độ phù hợp TỐT với dữ liệu thực nghiệm. Các chỉ số: CFI = ${formatCoef(cfi)} (≥ .90), TLI = ${formatCoef(tli)} (≥ .90), RMSEA = ${formatCoef(rmsea)} (≤ .08), SRMR = ${formatCoef(srmr)} (≤ .08).`;
    } else if (mostGood) {
        summary = `Mô hình CFA có độ phù hợp CHẤP NHẬN ĐƯỢC với dữ liệu. CFI = ${formatCoef(cfi)}, TLI = ${formatCoef(tli)}, RMSEA = ${formatCoef(rmsea)}, SRMR = ${formatCoef(srmr)}.`;
    } else {
        summary = `Mô hình CFA KHÔNG PHÙ HỢP tốt với dữ liệu. Cần xem xét điều chỉnh mô hình.`;
        warnings.push('Một hoặc nhiều chỉ số fit không đạt ngưỡng khuyến nghị.');
    }

    // Details
    details.push(`χ²(${df}) = ${formatNum(chi2)}, ${formatPValue(pValue)}`);

    if (!cfiOk) warnings.push(`CFI = ${formatCoef(cfi)} < .90`);
    if (!tliOk) warnings.push(`TLI = ${formatCoef(tli)} < .90`);
    if (!rmseaOk) warnings.push(`RMSEA = ${formatCoef(rmsea)} > .08`);
    if (!srmrOk) warnings.push(`SRMR = ${formatCoef(srmr)} > .08`);

    return { summary, details, warnings, citations };
}

// ===== MAIN GENERATOR =====

export function generateInterpretation(
    analysisType: AnalysisType,
    results: Record<string, any>
): InterpretationResult {
    switch (analysisType) {
        case 'cronbach_alpha':
            return interpretCronbachAlpha(results as any);
        case 'correlation':
            return interpretCorrelation(results as any);
        case 'ttest_independent':
            return interpretTTestIndependent(results as any);
        case 'anova':
            return interpretANOVA(results as any);
        case 'linear_regression':
            return interpretLinearRegression(results as any);
        case 'logistic_regression':
            return interpretLogisticRegression(results as any);
        case 'chi_square':
            return interpretChiSquare(results as any);
        case 'efa':
            return interpretEFA(results as any);
        case 'cfa':
            return interpretCFA(results as any);
        case 'mediation':
            return interpretMediation(results as any);
        default:
            return {
                summary: 'Chưa có template cho phân tích này.',
                details: [],
                warnings: [],
                citations: []
            };
    }
}
