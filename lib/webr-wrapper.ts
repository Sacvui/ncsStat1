// WebR Wrapper for R Statistical Analysis
import { WebR } from 'webr';

let webRInstance: WebR | null = null;
let isInitializing = false;
let initPromise: Promise<WebR> | null = null;
let initProgress: string = '';
let onProgressCallback: ((msg: string) => void) | null = null;

// Get current WebR loading status
export function getWebRStatus(): { isReady: boolean; isLoading: boolean; progress: string } {
    return {
        isReady: webRInstance !== null,
        isLoading: isInitializing,
        progress: initProgress
    };
}

// Set callback for progress updates
export function setProgressCallback(callback: (msg: string) => void) {
    onProgressCallback = callback;
}

function updateProgress(msg: string) {
    initProgress = msg;
    if (onProgressCallback) onProgressCallback(msg);
}

/**
 * Initialize WebR instance (singleton with promise caching and retry logic)
 */
export async function initWebR(maxRetries: number = 3): Promise<WebR> {
    // Return existing instance
    if (webRInstance) {
        try {
            if (typeof webRInstance.evalR === 'function') {
                return webRInstance;
            }
        } catch (e) {
            console.warn('WebR instance exists but is not usable, reinitializing...');
            webRInstance = null;
        }
    }

    // Return existing promise if init in progress
    if (initPromise) {
        return initPromise;
    }

    if (isInitializing) {
        // Wait for initialization to complete
        let attempts = 0;
        while (isInitializing && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (webRInstance) {
            return webRInstance;
        }
        throw new Error('WebR initialization timeout');
    }

    isInitializing = true;
    updateProgress('R-Engine Loading...');

    // Retry logic wrapper
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        initPromise = (async () => {
            try {
                // Mobile-friendly config: Ensure PostMessage channel and service worker
                const webR = new WebR({
                    channelType: 1, // PostMessage channel (safest for cross-origin)
                    serviceWorkerUrl: '/webr-serviceworker.js'
                });

                updateProgress('R-Engine Loading...');

                // Ensure ServiceWorker is registered (critical for mobile/COOP)
                if ('serviceWorker' in navigator) {
                    try {
                        const registration = await navigator.serviceWorker.register('/webr-serviceworker.js');
                        await navigator.serviceWorker.ready;
                        console.log('WebR ServiceWorker ready:', registration.scope);
                    } catch (swError) {
                        console.warn('ServiceWorker registration failed:', swError);
                        // Don't crash, WebR might still work in some modes, but likely will fail later
                    }
                }

                await webR.init();

                // Step 1: Set correct WASM Repo (Priority: 1. Core WASM, 2. R-Universe for missing binaries like quadprog)
                await webR.evalR('options(repos = c(R_WASM = "https://repo.r-wasm.org/", CRAN = "https://cran.r-universe.dev/"))');

                // Verify initialization
                if (!webR.evalR) {
                    throw new Error('WebR initialized but evalR is not available');
                }

                // Step 2: Install required packages (psych-based CFA/SEM - no lavaan needed)
                updateProgress('R-Engine Loading...');
                try {
                    await webR.installPackages(['psych', 'corrplot', 'GPArotation']);
                } catch (pkgError) {
                    console.warn('Package install warning:', pkgError);
                }

                // Step 3 & 4: Load packages and integrity check
                updateProgress('R-Engine Loading...');

                await webR.evalR('library(psych)');
                await webR.evalR('library(GPArotation)');

                updateProgress('R-Engine Ready');
                webRInstance = webR;
                isInitializing = false;
                initPromise = null;
                return webR;
            } catch (error) {
                // If not last attempt, retry
                if (attempt < maxRetries - 1) {
                    console.warn(`WebR init attempt ${attempt + 1} failed, retrying...`);
                    updateProgress(`R-Engine Loading... (Retry ${attempt + 1})`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    throw error; // Throw to trigger retry
                }

                // Last attempt failed
                isInitializing = false;
                webRInstance = null;
                initPromise = null;
                updateProgress('R-Engine Error!');
                console.error('WebR initialization error:', error);
                throw new Error(`Failed to initialize WebR after ${maxRetries} attempts: ${error}`);
            }
        })();

        try {
            return await initPromise;
        } catch (error) {
            if (attempt === maxRetries - 1) {
                throw error;
            }
            // Continue to next retry
        }
    }

    throw new Error('WebR initialization failed');
}
/**
 * Helper to parse WebR evaluation result (list) into a getter function
 */
export function parseWebRResult(jsResult: any) {
    return (name: string): any => {
        if (!jsResult.names || !jsResult.values) return null;
        const idx = jsResult.names.indexOf(name);
        if (idx === -1) return null;
        const item = jsResult.values[idx];
        // Handle nested structure: WebR objects often have {type: ..., values: ...}
        if (item && item.values) return item.values;
        return item;
    };
}

/**
 * Helper to parse flat array to matrix
 */
export function parseMatrix(val: any, dim: number): number[][] {
    if (!val || !Array.isArray(val)) return [];
    const matrix: number[][] = [];
    for (let i = 0; i < dim; i++) {
        matrix.push(val.slice(i * dim, (i + 1) * dim));
    }
    return matrix;
}

/**
 * Convert JS array to R matrix string
 */
function arrayToRMatrix(data: number[][]): string {
    const flat = data.flat();
    return `matrix(c(${flat.join(',')}), nrow=${data.length}, byrow=TRUE)`;
}

/**
 * Run Cronbach's Alpha analysis with SPSS-style Item-Total Statistics
 * Also includes McDonald's Omega (ω) for more robust reliability
 * @param data - 2D array of numeric data
 * @param likertMin - Minimum valid value (default: 1)
 * @param likertMax - Maximum valid value (default: 5)
 */
export async function runCronbachAlpha(
    data: number[][],
    likertMin: number = 1,
    likertMax: number = 5
): Promise<{
    alpha: number;
    rawAlpha: number;
    standardizedAlpha: number;
    omega: number; // McDonald's Omega (total)
    omegaHierarchical: number; // Omega hierarchical (general factor)
    nItems: number | string;
    likertRange: { min: number; max: number };
    itemTotalStats: {
        itemName: string;
        scaleMeanIfDeleted: number;
        scaleVarianceIfDeleted: number;
        correctedItemTotalCorrelation: number;
        alphaIfItemDeleted: number;
    }[];
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    library(psych)
    raw_data <- ${arrayToRMatrix(data)}
    
    # DATA CLEANING: Clamp outliers to valid Likert range (configurable)
    # This prevents invalid values from corrupting the analysis
    valid_min <- ${likertMin}
    valid_max <- ${likertMax}
    data <- pmax(pmin(raw_data, valid_max), valid_min)
    
    # Run Cronbach's Alpha with auto key checking for reversed items
    result <- alpha(data, check.keys = TRUE)
    
    # === McDonald's Omega (more robust than Alpha) ===
    # omega() requires at least 3 items
    omega_result <- tryCatch({
        if (ncol(data) >= 3) {
            om <- omega(data, nfactors = 1, plot = FALSE, warnings = FALSE)
            list(
                omega_total = om$omega.tot,
                omega_h = om$omega_h
            )
        } else {
            list(omega_total = NA, omega_h = NA)
        }
    }, error = function(e) list(omega_total = NA, omega_h = NA))
    
    # Extract item-total statistics - USE BUILT-IN VALUES
    item_stats <- result$item.stats
    alpha_drop <- result$alpha.drop
    n_items <- ncol(data)
    
    # Calculate scale totals for reference
    total_scores <- rowSums(data, na.rm = TRUE)
    scale_mean <- mean(total_scores, na.rm = TRUE)
    scale_var <- var(total_scores, na.rm = TRUE)

    list(
        raw_alpha = result$total$raw_alpha,
        std_alpha = result$total$std.alpha,
        omega_total = omega_result$omega_total,
        omega_h = omega_result$omega_h,
        n_items = n_items,
        likert_min = valid_min,
        likert_max = valid_max,
        
        # Item-total statistics - USING BUILT-IN VALUES FROM alpha()
        scale_mean_deleted = alpha_drop$mean,
        scale_var_deleted = alpha_drop$sd^2,  # Convert SD to Variance
        corrected_item_total = item_stats$r.drop,
        alpha_if_deleted = alpha_drop$raw_alpha,
        
        # Additional useful metrics
        average_r = result$total$average_r,
        scale_mean = scale_mean,
        scale_var = scale_var
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    // WebR list parsing helper
    const getValue = parseWebRResult(jsResult);

    const rawAlpha = getValue('raw_alpha')?.[0] || 0;
    const stdAlpha = getValue('std_alpha')?.[0] || 0;
    const omegaTotal = getValue('omega_total')?.[0] || 0;
    const omegaH = getValue('omega_h')?.[0] || 0;
    const nItems = getValue('n_items')?.[0] || 'N/A';

    // Parse item-total statistics
    const scaleMeanDeleted = getValue('scale_mean_deleted') || [];
    const scaleVarDeleted = getValue('scale_var_deleted') || [];
    const correctedItemTotal = getValue('corrected_item_total') || [];
    const alphaIfDeleted = getValue('alpha_if_deleted') || [];

    const itemCount = typeof nItems === 'number' ? nItems : 0;
    const itemTotalStats = [];

    for (let i = 0; i < itemCount; i++) {
        itemTotalStats.push({
            itemName: `VAR${(i + 1).toString().padStart(2, '0')} `,
            scaleMeanIfDeleted: scaleMeanDeleted[i] || 0,
            scaleVarianceIfDeleted: scaleVarDeleted[i] || 0,
            correctedItemTotalCorrelation: correctedItemTotal[i] || 0,
            alphaIfItemDeleted: alphaIfDeleted[i] || 0
        });
    }

    return {
        alpha: rawAlpha,
        rawAlpha: rawAlpha,
        standardizedAlpha: stdAlpha,
        omega: omegaTotal,
        omegaHierarchical: omegaH,
        nItems: nItems,
        likertRange: { min: likertMin, max: likertMax },
        itemTotalStats: itemTotalStats,
        rCode: rCode
    };
}



/**
 * Run correlation analysis with method selection
 * @param data - Matrix of numeric data
 * @param method - 'pearson' (default), 'spearman', or 'kendall'
 */
export async function runCorrelation(
    data: number[][],
    method: 'pearson' | 'spearman' | 'kendall' = 'pearson'
): Promise<{
    correlationMatrix: number[][];
    pValues: number[][];
    method: string;
    rCode: string;
}> {
    const webR = await initWebR();

    const nCols = data[0]?.length || 0;

    const rCode = `
    library(psych)
    data_mat <- ${arrayToRMatrix(data)}
    df <- as.data.frame(data_mat)
    # Force unique column names to avoid "duplicate row.names" error in psych
    colnames(df) <- paste0("V", 1:ncol(df))

    # Run correlation with selected method
    # Pearson = linear, Spearman = rank-based (non-parametric), Kendall = rank concordance
    method_name <- "${method}"
    ct <- corr.test(df, use = "pairwise", method = method_name, adjust = "none")

    list(
        correlation = as.vector(ct$r),
        p_values = as.vector(ct$p),
        n_cols = ncol(df),
        method = method_name
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = parseWebRResult(jsResult);

    // Parse flat array to matrix
    const parseMatrixLocal = (val: any, dim: number): number[][] => {
        if (!val || !Array.isArray(val)) return [];
        const matrix: number[][] = [];
        for (let i = 0; i < dim; i++) {
            matrix.push(val.slice(i * dim, (i + 1) * dim));
        }
        return matrix;
    };

    const numCols = getValue('n_cols')?.[0] || nCols;

    return {
        correlationMatrix: parseMatrixLocal(getValue('correlation'), numCols),
        pValues: parseMatrixLocal(getValue('p_values'), numCols),
        method: method,
        rCode: rCode
    };
}

/**
 * Run descriptive statistics
 */
export async function runDescriptiveStats(data: number[][]): Promise<{
    mean: number[];
    sd: number[];
    min: number[];
    max: number[];
    median: number[];
    N: number[]; // Valid N per variable
    skew: number[];
    kurtosis: number[];
    se: number[];
}> {
    const webR = await initWebR();

    const rCode = `
    library(psych)
    data_mat <- ${arrayToRMatrix(data)}
    df <- as.data.frame(data_mat)
    # Force unique column names
    colnames(df) <- paste0("V", 1:ncol(df))
    
    # Use psych::describe for comprehensive stats (Skew, Kurtosis, SE)
    desc <- describe(df)
    
    list(
        mean = desc$mean,
        sd = desc$sd,
        min = desc$min,
        max = desc$max,
        median = desc$median,
        n = desc$n,
        skew = desc$skew,
        kurtosis = desc$kurtosis,
        se = desc$se
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    // WebR returns {type:'list', names:[...], values:[{type:'double', values:[...]}, ...]}
    const getValue = parseWebRResult(jsResult);

    const processed = {
        mean: getValue('mean') || [],
        sd: getValue('sd') || [],
        min: getValue('min') || [],
        max: getValue('max') || [],
        median: getValue('median') || [],
        N: getValue('n') || [],
        skew: getValue('skew') || [],
        kurtosis: getValue('kurtosis') || [],
        se: getValue('se') || []
    };

    return processed;
}

/**
 * Run Independent Samples T-test
 */
export async function runTTestIndependent(group1: number[], group2: number[]): Promise<{
    t: number;
    df: number;
    pValue: number;
    mean1: number;
    mean2: number;
    meanDiff: number;
    ci95Lower: number;
    ci95Upper: number;
    effectSize: number; // Cohen's d
    varTestP: number; // Variance homogeneity (Levene's)
    normalityP1: number; // Shapiro-Wilk p-value for group 1
    normalityP2: number; // Shapiro-Wilk p-value for group 2
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    group1 <- c(${group1.join(',')})
    group2 <- c(${group2.join(',')})
    
    # === ASSUMPTION TESTS ===
    
    # 1. Normality Test (Shapiro-Wilk) for each group
    # Note: Shapiro-Wilk requires 3 <= n <= 5000
    shapiro_p1 <- tryCatch({
        if (length(group1) >= 3 && length(group1) <= 5000) {
            shapiro.test(group1)$p.value
        } else {
            NA  # Cannot compute
        }
    }, error = function(e) NA)
    
    shapiro_p2 <- tryCatch({
        if (length(group2) >= 3 && length(group2) <= 5000) {
            shapiro.test(group2)$p.value
        } else {
            NA
        }
    }, error = function(e) NA)
    
    # 2. Levene's Test (Brown-Forsythe method - Median)
    med1 <- median(group1)
    med2 <- median(group2)
    z1 <- abs(group1 - med1)
    z2 <- abs(group2 - med2)
    z_val <- c(z1, z2)
    g_fac <- factor(c(rep(1, length(z1)), rep(2, length(z2))))
    levene_test <- oneway.test(z_val ~ g_fac, var.equal = TRUE)
    levene_p <- levene_test$p.value
    
    # Use Welch's t-test if variances unequal
    var_equal <- levene_p > 0.05

    # === MAIN T-TEST ===
    result <- t.test(group1, group2, var.equal = var_equal)
    
    # Cohen's d effect size
    pooledSD <- sqrt(((length(group1) - 1) * sd(group1)^2 + (length(group2) - 1) * sd(group2)^2) / (length(group1) + length(group2) - 2))
    cohensD <- (mean(group1) - mean(group2)) / pooledSD

    list(
        t = result$statistic,
        df = result$parameter,
        pValue = result$p.value,
        mean1 = mean(group1),
        mean2 = mean(group2),
        meanDiff = mean(group1) - mean(group2),
        ci95Lower = result$conf.int[1],
        ci95Upper = result$conf.int[2],
        effectSize = cohensD,
        leveneP = levene_p,
        normalityP1 = if(is.na(shapiro_p1)) -1 else shapiro_p1,
        normalityP2 = if(is.na(shapiro_p2)) -1 else shapiro_p2
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValueFunc = parseWebRResult(jsResult);
    const getValue = (name: string): number => {
        const val = getValueFunc(name);
        return (val && val[0]) ? val[0] : 0;
    };

    return {
        t: getValue('t'),
        df: getValue('df'),
        pValue: getValue('pValue'),
        mean1: getValue('mean1'),
        mean2: getValue('mean2'),
        meanDiff: getValue('meanDiff'),
        ci95Lower: getValue('ci95Lower'),
        ci95Upper: getValue('ci95Upper'),
        effectSize: getValue('effectSize'),
        varTestP: getValue('leveneP'),
        normalityP1: getValue('normalityP1'),
        normalityP2: getValue('normalityP2'),
        rCode: rCode
    };
}

/**
 * Run Paired Samples T-test
 */
export async function runTTestPaired(before: number[], after: number[]): Promise<{
    t: number;
    df: number;
    pValue: number;
    meanBefore: number;
    meanAfter: number;
    meanDiff: number;
    ci95Lower: number;
    ci95Upper: number;
    effectSize: number; // Cohen's d
    normalityDiffP: number; // Shapiro-Wilk on difference scores
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    before <- c(${before.join(',')})
    after <- c(${after.join(',')})

    # Calculate difference scores
    diffs <- before - after
    
    # === ASSUMPTION TEST ===
    # Normality of DIFFERENCE scores (key assumption for paired t-test)
    shapiro_diff_p <- tryCatch({
        if (length(diffs) >= 3 && length(diffs) <= 5000) {
            shapiro.test(diffs)$p.value
        } else {
            NA
        }
    }, error = function(e) NA)

    # === MAIN T-TEST ===
    result <- t.test(before, after, paired = TRUE)
    
    # Cohen's d for Paired Samples: d = MeanDiff / SD_diff
    mean_diff <- mean(diffs)
    sd_diff <- sd(diffs)
    cohens_d <- mean_diff / sd_diff

    list(
        t = result$statistic,
        df = result$parameter,
        pValue = result$p.value,
        meanBefore = mean(before),
        meanAfter = mean(after),
        meanDiff = mean_diff,
        ci95Lower = result$conf.int[1],
        ci95Upper = result$conf.int[2],
        effectSize = cohens_d,
        normalityDiffP = if(is.na(shapiro_diff_p)) -1 else shapiro_diff_p
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValueFunc = parseWebRResult(jsResult);
    const getValue = (name: string): number => {
        const val = getValueFunc(name);
        return (val && val[0]) ? val[0] : 0;
    };

    return {
        t: getValue('t'),
        df: getValue('df'),
        pValue: getValue('pValue'),
        meanBefore: getValue('meanBefore'),
        meanAfter: getValue('meanAfter'),
        meanDiff: getValue('meanDiff'),
        ci95Lower: getValue('ci95Lower'),
        ci95Upper: getValue('ci95Upper'),
        effectSize: getValue('effectSize'),
        normalityDiffP: getValue('normalityDiffP'),
        rCode: rCode
    };
}
/**
 * Run One-Way ANOVA
 */
export async function runOneWayANOVA(groups: number[][]): Promise<{
    F: number;
    dfBetween: number;
    dfWithin: number;
    pValue: number;
    groupMeans: number[];
    grandMean: number;
    etaSquared: number;
    assumptionCheckP: number; // Levene's test P-value
    normalityResidP: number; // Shapiro-Wilk on residuals
    methodUsed: string; // 'Classic ANOVA' or 'Welch ANOVA'
    postHoc: { comparison: string; diff: number; pAdj: number }[]; // Tukey HSD
    postHocWarning: string; // Warning if using Tukey after Welch
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    # Create data frame with values and group labels
    values <- c(${groups.map(g => g.join(',')).join(',')})
    groups <- factor(c(${groups.map((g, i) => g.map(() => i + 1).join(',')).join(',')}))
    
    # === ASSUMPTION TESTS ===
    
    # 1. Levene's Test (Brown-Forsythe - Median) for Homogeneity of Variance
    group_medians <- tapply(values, groups, median)
    deviations <- numeric(length(values))
    group_indices <- as.numeric(groups)
    
    for(i in 1:length(values)) {
        g_idx <- group_indices[i]
        deviations[i] <- abs(values[i] - group_medians[g_idx])
    }
    
    levene_model <- aov(deviations ~ groups)
    levene_p <- summary(levene_model)[[1]][1, 5]
    
    # === DECISION: Classic vs Welch ANOVA ===
    if (levene_p < 0.05) {
        # Variance NOT homogeneous -> Use Welch ANOVA (robust)
        welch_result <- oneway.test(values ~ groups, var.equal = FALSE)
        f_stat <- welch_result$statistic
        df_between <- welch_result$parameter[1]
        df_within <- welch_result$parameter[2]
        p_val <- welch_result$p.value
        method_used <- "Welch ANOVA"
        
        # Eta squared for Welch - use approximate formula
        # omega^2 = (F - 1) / (F + (N-k)/(k-1) + 1) as alternative
        n_total <- length(values)
        k <- length(unique(groups))
        eta_squared <- (f_stat * df_between) / (f_stat * df_between + df_within)
        
        # For normality, use pooled residuals from classic model
        model <- aov(values ~ groups)
        resids <- residuals(model)
        
        # Post-hoc warning for Welch
        posthoc_warning <- "Cảnh báo: Tukey HSD có thể không chính xác khi phương sai không đồng nhất. Nên dùng Games-Howell."
    } else {
        # Variance homogeneous -> Use Classic ANOVA
        model <- aov(values ~ groups)
        result_sum <- summary(model)[[1]]
        f_stat <- result_sum[1, 4]
        df_between <- result_sum[1, 1]
        df_within <- result_sum[2, 1]
        p_val <- result_sum[1, 5]
        method_used <- "Classic ANOVA"
        
        # Eta squared for classic ANOVA
        ssb <- result_sum[1, 2]
        sst <- ssb + result_sum[2, 2]
        eta_squared <- ssb / sst
        
        resids <- residuals(model)
        posthoc_warning <- ""
    }
    
    # 2. Normality of Residuals
    shapiro_resid_p <- tryCatch({
        if (length(resids) >= 3 && length(resids) <= 5000) {
            shapiro.test(resids)$p.value
        } else {
            NA
        }
    }, error = function(e) NA)
    
    # Group means
    groupMeans <- tapply(values, groups, mean)
    
    # === POST-HOC: Tukey HSD (always use classic model) ===
    model_for_tukey <- aov(values ~ groups)
    tukey_result <- TukeyHSD(model_for_tukey)$groups
    tukey_comparisons <- rownames(tukey_result)
    tukey_diffs <- tukey_result[, "diff"]
    tukey_padj <- tukey_result[, "p adj"]

    list(
        F = f_stat,
        dfBetween = df_between,
        dfWithin = df_within,
        pValue = p_val,
        groupMeans = as.numeric(groupMeans),
        grandMean = mean(values),
        etaSquared = eta_squared,
        leveneP = levene_p,
        normalityResidP = if(is.na(shapiro_resid_p)) -1 else shapiro_resid_p,
        methodUsed = method_used,
        postHocWarning = posthoc_warning,
        tukeyComparisons = tukey_comparisons,
        tukeyDiffs = tukey_diffs,
        tukeyPAdj = tukey_padj
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = parseWebRResult(jsResult);

    // Parse Tukey HSD results
    const comparisons = getValue('tukeyComparisons') || [];
    const diffs = getValue('tukeyDiffs') || [];
    const pAdjs = getValue('tukeyPAdj') || [];

    const postHoc: { comparison: string; diff: number; pAdj: number }[] = [];
    for (let i = 0; i < comparisons.length; i++) {
        postHoc.push({
            comparison: comparisons[i] || `${i + 1}`,
            diff: diffs[i] || 0,
            pAdj: pAdjs[i] || 1
        });
    }

    return {
        F: getValue('F')?.[0] || 0,
        dfBetween: getValue('dfBetween')?.[0] || 0,
        dfWithin: getValue('dfWithin')?.[0] || 0,
        pValue: getValue('pValue')?.[0] || 0,
        groupMeans: getValue('groupMeans') || [],
        grandMean: getValue('grandMean')?.[0] || 0,
        etaSquared: getValue('etaSquared')?.[0] || 0,
        assumptionCheckP: getValue('leveneP')?.[0] || 0,
        normalityResidP: getValue('normalityResidP')?.[0] || 0,
        methodUsed: getValue('methodUsed')?.[0] || 'Classic ANOVA',
        postHoc: postHoc,
        postHocWarning: getValue('postHocWarning')?.[0] || '',
        rCode
    };
}

/**
 * Run Exploratory Factor Analysis (EFA)
 * Includes Parallel Analysis for optimal factor number detection
 */
export async function runEFA(data: number[][], nFactors: number, rotation: string = 'varimax'): Promise<{
    kmo: number;
    bartlettP: number;
    loadings: number[][];
    communalities: number[];
    structure: number[][];
    eigenvalues: number[];
    nFactorsUsed: number;
    nFactorsSuggested: number; // From Parallel Analysis
    factorMethod: string; // 'parallel' or 'kaiser' or 'user'
    rCode: string;
}> {
    const webR = await initWebR();

    // R Code to handle data cleaning and auto-factor detection
    const rCode = `
    # Load psych package
    library(psych)

    # 1. Prepare Data
    raw_data <- matrix(c(${data.flat().join(',')}), nrow = ${data.length}, byrow = TRUE)
    
    # 2. Clean Data: Remove rows with NA or Inf
    df <- as.data.frame(raw_data)
    df_clean <- na.omit(df)
    df_clean <- df_clean[apply(df_clean, 1, function(x) all(is.finite(x))), ]

    if (nrow(df_clean) < ncol(df_clean)) {
        stop("Lỗi: Số lượng mẫu hợp lệ nhỏ hơn số lượng biến.")
    }
    if (nrow(df_clean) < 3) {
        stop("Quá ít dữ liệu hợp lệ để chạy phân tích.")
    }

    # 3. Calculate Correlation Matrix & Eigenvalues
    if (any(apply(df_clean, 2, sd) == 0)) {
        stop("Biến có phương sai bằng 0. Hãy loại bỏ biến này.")
    }

    cor_mat <- cor(df_clean)
    eigenvalues <- eigen(cor_mat)$values

    # 4. PARALLEL ANALYSIS - Gold Standard for factor detection
    n_factors_parallel <- tryCatch({
        pa <- fa.parallel(df_clean, fm = "pa", fa = "fa", plot = FALSE, 
                         n.iter = 20, quant = 0.95)
        pa$nfact
    }, error = function(e) NA)
    
    # Kaiser criterion (eigenvalue > 1) as fallback
    n_factors_kaiser <- sum(eigenvalues > 1)
    if (n_factors_kaiser < 1) n_factors_kaiser <- 1

    # Determine final factor count
    n_factors_run <- ${nFactors}
    factor_method <- "user"
    
    if (n_factors_run <= 0) {
        # Auto-detect: prefer Parallel Analysis, fallback to Kaiser
        if (!is.na(n_factors_parallel) && n_factors_parallel >= 1) {
            n_factors_run <- n_factors_parallel
            factor_method <- "parallel"
        } else {
            n_factors_run <- n_factors_kaiser
            factor_method <- "kaiser"
        }
    }
    
    if (n_factors_run < 1) n_factors_run <- 1

    # 5. KMO and Bartlett
    kmo_result <- tryCatch(KMO(df_clean), error = function(e) list(MSA = 0))
    bartlett_result <- tryCatch(cortest.bartlett(cor_mat, n = nrow(df_clean)), 
                                error = function(e) list(p.value = 1))
    
    # 6. Run EFA
    rotation_method <- "${rotation}"
    efa_result <- fa(df_clean, nfactors = n_factors_run, rotate = rotation_method, fm = "pa")

    list(
        kmo = if (is.numeric(kmo_result$MSA)) kmo_result$MSA[1] else 0,
        bartlett_p = bartlett_result$p.value,
        loadings = efa_result$loadings,
        communalities = efa_result$communalities,
        structure = efa_result$Structure,
        eigenvalues = eigenvalues,
        n_factors_used = n_factors_run,
        n_factors_suggested = if(is.na(n_factors_parallel)) n_factors_kaiser else n_factors_parallel,
        factor_method = factor_method
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = parseWebRResult(jsResult);
    const nFactorsUsed = getValue('n_factors_used')?.[0] || nFactors || 1;

    return {
        kmo: getValue('kmo')?.[0] || 0,
        bartlettP: getValue('bartlett_p')?.[0] || 1,
        loadings: parseMatrix(getValue('loadings'), nFactorsUsed),
        communalities: getValue('communalities') || [],
        structure: parseMatrix(getValue('structure'), nFactorsUsed),
        eigenvalues: getValue('eigenvalues') || [],
        nFactorsUsed: nFactorsUsed,
        nFactorsSuggested: getValue('n_factors_suggested')?.[0] || nFactorsUsed,
        factorMethod: getValue('factor_method')?.[0] || 'user',
        rCode
    };
}

/**
 * Data Validation Helper
 */
function validateData(data: number[][], minVars: number = 1, functionName: string = 'Analysis'): void {
    if (!data || data.length === 0) {
        throw new Error(`${functionName}: Dữ liệu trống`);
    }

    if (data[0].length < minVars) {
        throw new Error(`${functionName}: Cần ít nhất ${minVars} biến`);
    }

    // Check for invalid values (NaN, Infinity)
    const hasInvalid = data.some(row =>
        row.some(val => !isFinite(val))
    );

    if (hasInvalid) {
        throw new Error(`${functionName}: Dữ liệu chứa giá trị không hợp lệ(NaN hoặc Infinity)`);
    }

    // Check for constant columns (zero variance)
    for (let col = 0; col < data[0].length; col++) {
        const values = data.map(row => row[col]);
        const allSame = values.every(v => v === values[0]);
        if (allSame) {
            throw new Error(`${functionName}: Biến thứ ${col + 1} có giá trị không đổi(variance = 0)`);
        }
    }
}

/**
 * Run Multiple Linear Regression
 * data: Matrix where first column is Dependent Variable (Y), others are Independent (X)
 * names: Array of variable names corresponding to columns [Y, X1, X2...]
 */
export async function runLinearRegression(data: number[][], names: string[]): Promise<{
    coefficients: {
        term: string;
        estimate: number;
        stdBeta: number; // Standardized Beta coefficient
        stdError: number;
        tValue: number;
        pValue: number;
        vif?: number; // VIF for multicollinearity
    }[];
    modelFit: {
        rSquared: number;
        adjRSquared: number;
        fStatistic: number;
        df: number; // Num df
        dfResid: number; // Denom df
        pValue: number;
        residualStdError: number;
        normalityP: number; // Added Shapiro-Wilk
    };
    equation: string;
    chartData: {
        fitted: number[];
        residuals: number[];
        actual: number[];
    };
    rCode: string;
}> {
    const webR = await initWebR();

    // Sanitize names for R (remove spaces, special chars if needed) -> assume frontend handles or use simple mapping
    // But R lm() works best with clean names.
    const cleanNames = names.map((n: string) => n.replace(/[^\w\d_]/g, '.')); // basic sanitization
    // Actually, R formula with backticks handles spaces fine.

    // Construct R command
    const rCode = `
    data_mat <- ${arrayToRMatrix(data)}
    df <- as.data.frame(data_mat)
    # Assign names
    colnames(df) <- c(${names.map(n => `"${n}"`).join(',')})
    
    # Formula: First col ~ . (all others)
    y_name <- colnames(df)[1]
    f_str <- paste(sprintf("\`%s\`", y_name), "~ .")
    f <- as.formula(f_str)

    model <- lm(f, data = df)
    s <- summary(model)
    
    # Extract Coefficients
    coefs <- coef(s)
    
    # Extract Model Fit
    fstat <- s$fstatistic
    
    # Calculate p-value for F-statistic
    if (is.null(fstat)) {
        f_val <- 0
        df_num <- 0
        df_denom <- 0
        f_p_value <- 1
    } else {
        f_val <- fstat[1]
        df_num <- fstat[2]
        df_denom <- fstat[3]
        f_p_value <- pf(f_val, df_num, df_denom, lower.tail = FALSE)
    }

    # CALCULATE VIF (Manual method)
    vif_vals <- tryCatch({
        # Exclude dependent variable (1st column) to get predictors
        x_data <- df[, -1, drop = FALSE]
        n_vars <- ncol(x_data)
        vifs <- numeric(n_vars)
        
        if (n_vars > 1) {
            for (i in 1:n_vars) {
                # Regress x_i on other x's
                r_model <- lm(x_data[, i] ~ ., data = x_data[, -i, drop = FALSE])
                r2 <- summary(r_model)$r.squared
                if (r2 >= 0.9999) {
                    vifs[i] <- 999.99
                } else {
                    vifs[i] <- 1 / (1 - r2)
                }
            }
        } else {
            vifs[1] <- 1.0
        }
        vifs
    }, error = function(e) numeric(0))

    # Normality of Residuals (Shapiro-Wilk)
    normality_p <- tryCatch({
        shapiro.test(residuals(model))$p.value
    }, error = function(e) 0)

    # === STANDARDIZED BETA (for comparing predictor importance) ===
    # Formula: beta_std = b * (sd_x / sd_y)
    std_betas <- tryCatch({
        b <- coefs[-1, 1]  # Exclude intercept
        x_data <- df[, -1, drop = FALSE]
        sx <- sapply(x_data, sd, na.rm = TRUE)
        sy <- sd(df[, 1], na.rm = TRUE)
        c(NA, b * sx / sy)  # NA for intercept, then betas
    }, error = function(e) rep(NA, nrow(coefs)))

    list(
        coef_names = rownames(coefs),
        estimates = coefs[, 1],
        std_betas = std_betas,
        std_errors = coefs[, 2],
        t_values = coefs[, 3],
        p_values = coefs[, 4],

        r_squared = s$r.squared,
        adj_r_squared = s$adj.r.squared,
        f_stat = f_val,
        df_num = df_num,
        df_denom = df_denom,
        f_p_value = f_p_value,
        sigma = s$sigma,

        fitted_values = fitted(model),
        residuals = residuals(model),
        actual_values = df[, 1],

        vifs = vif_vals,
        normality_p = normality_p
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = parseWebRResult(jsResult);
    const coefNames = getValue('coef_names') || [];
    const estimates = getValue('estimates') || [];
    const stdBetas = getValue('std_betas') || [];
    const stdErrors = getValue('std_errors') || [];
    const tValues = getValue('t_values') || [];
    const pValues = getValue('p_values') || [];
    const vifs = getValue('vifs') || []; // Get VIFs

    // Extract Chart Data
    const fittedValues = getValue('fitted_values') || [];
    const residuals = getValue('residuals') || [];
    const actualValues = getValue('actual_values') || [];

    const modelFit = {
        rSquared: getValue('r_squared')?.[0] || 0,
        adjRSquared: getValue('adj_r_squared')?.[0] || 0,
        fStatistic: getValue('f_stat')?.[0] || 0,
        df: getValue('df_num')?.[0] || 0,
        dfResid: getValue('df_denom')?.[0] || 0,
        pValue: getValue('f_p_value')?.[0] || 0,
        residualStdError: getValue('sigma')?.[0] || 0,
        normalityP: getValue('normality_p')?.[0] || 0
    };

    const interceptVal = estimates[0] || 0; // Assuming first is intercept
    const coefficients = [];
    const len = coefNames.length;
    const interceptIndex = coefNames.findIndex((n: string) => n === '(Intercept)');
    if (interceptIndex !== -1) {
        // interceptVal = estimates[interceptIndex]; // Already likely at 0, but good to check
    }

    for (let i = 0; i < len; i++) {
        // Skip adding Intercept to coefficients list if we want to separate it, 
        // but typically we list all. VIF handling handles skip.
        // Actually, let's keep all in list.
        coefficients.push({
            term: coefNames[i],
            estimate: estimates[i],
            stdBeta: stdBetas[i] || 0,
            stdError: stdErrors[i],
            tValue: tValues[i],
            pValue: pValues[i],
            vif: (coefNames[i] !== '(Intercept)') ? (vifs[(i - 1)] || undefined) : undefined
        });
    }

    // Build Equation
    let equationStr = `${interceptVal.toFixed(3)} `;

    for (const coef of coefficients) {
        if (coef.term === '(Intercept)') continue;
        const val = coef.estimate;
        const sign = val >= 0 ? ' + ' : ' - ';
        const cleanTerm = coef.term.replace(/`/g, '');
        equationStr += `${sign}${Math.abs(val).toFixed(3)}*${cleanTerm}`;
    }

    return {
        coefficients,
        modelFit,
        equation: equationStr,
        chartData: {
            fitted: fittedValues,
            residuals: residuals,
            actual: actualValues
        },
        rCode: rCode
    };
}

/**
 * Run Mann-Whitney U Test (Wilcoxon Rank Sum)
 */
export async function runMannWhitneyU(
    group1: number[],
    group2: number[]
): Promise<{
    statistic: number;
    pValue: number;
    median1: number;
    median2: number;
    effectSize: number; // r = Z / sqrt(N)
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
   g1 <- c(${group1.join(',')})
   g2 <- c(${group2.join(',')})
   
   # Wilcoxon Rank Sum Test (Mann-Whitney U)
   test <- wilcox.test(g1, g2, conf.int = TRUE)
   
   n1 <- length(g1)
   n2 <- length(g2)
   N <- n1 + n2
   
   # Calculate Z from p-value (approx)
   z_score <- qnorm(test$p.value / 2)
   effect_r <- abs(z_score) / sqrt(N)
   
   list(
       statistic = test$statistic,
       p_value = test$p.value,
       median1 = median(g1),
       median2 = median(g2),
       effect_size = effect_r
   )
   `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;
    const getValue = parseWebRResult(jsResult);

    return {
        statistic: getValue('statistic')?.[0] || 0,
        pValue: getValue('p_value')?.[0] || 0,
        median1: getValue('median1')?.[0] || 0,
        median2: getValue('median2')?.[0] || 0,
        effectSize: getValue('effect_size')?.[0] || 0,
        rCode
    };
}

/**
 * Run Chi-Square Test of Independence
 * Expects data as an array of rows, each row has 2 values [cat1, cat2]
 * Includes Fisher's Exact test for 2x2 tables and warnings for expected < 5
 */
export async function runChiSquare(data: any[][]): Promise<{
    statistic: number;
    df: number;
    pValue: number;
    observed: { data: number[][]; rows: string[]; cols: string[] };
    expected: { data: number[][]; rows: string[]; cols: string[] };
    cramersV: number; // Effect Size
    fisherPValue: number | null; // Fisher's Exact test p-value (for 2x2 tables)
    warning: string; // Warning if expected < 5
    rCode: string;
}> {
    const webR = await initWebR();

    // Serialize data for R
    const flatData = data.flat().map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    const nRows = data.length;

    const rCode = `
    # Create Data Frame
    raw_vec <- c(${flatData})
    df_raw <- matrix(raw_vec, nrow = ${nRows}, byrow = TRUE)
    
    # Create Table
    tbl <- table(df_raw[,1], df_raw[,2])
    
    # Run Chi-Square
    test <- chisq.test(tbl)
    
    # === CHECK ASSUMPTION: Expected cell counts ===
    n_cells_below_5 <- sum(test$expected < 5)
    pct_cells_below_5 <- n_cells_below_5 / length(test$expected) * 100
    
    warning_msg <- ""
    if (pct_cells_below_5 > 20) {
        warning_msg <- paste0("Cảnh báo: ", round(pct_cells_below_5, 1), 
                              "% số ô có giá trị kỳ vọng < 5. Kết quả Chi-Square có thể không chính xác.")
    }
    
    # === FISHER'S EXACT TEST (for 2x2 tables) ===
    fisher_p <- NA
    if (nrow(tbl) == 2 && ncol(tbl) == 2) {
        fisher_result <- tryCatch({
            fisher.test(tbl)$p.value
        }, error = function(e) NA)
        fisher_p <- fisher_result
    }
    
    # Calculate Cramer's V (Effect Size)
    chisq_val <- test$statistic
    n <- sum(tbl)
    cramers_v <- 0
    if (min(dim(tbl)) > 1) {
        cramers_v <- sqrt(chisq_val / (n * (min(dim(tbl)) - 1)))
    }
    
    list(
       statistic = test$statistic,
       parameter = test$parameter, # df
       p_value = test$p.value,
       observed = as.matrix(test$observed),
       expected = as.matrix(test$expected),
       cramers_v = cramers_v,
       fisher_p = fisher_p,
       warning_msg = warning_msg,
       
       # Dimnames
       row_names = rownames(tbl),
       col_names = colnames(tbl),
       
       n_rows = nrow(tbl),
       n_cols = ncol(tbl),
       
       # Flattened matrices for transport
       obs_vals = as.vector(test$observed),
       exp_vals = as.vector(test$expected)
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;
    const getValue = parseWebRResult(jsResult);

    const rowNames = getValue('row_names') || [];
    const colNames = getValue('col_names') || [];
    const nR = getValue('n_rows')?.[0] || 0;
    const nC = getValue('n_cols')?.[0] || 0;
    const obsVals = getValue('obs_vals') || [];
    const expVals = getValue('exp_vals') || [];
    const fisherP = getValue('fisher_p')?.[0];

    // Reconstruct 2D arrays
    const reconstruct = (vals: number[], rows: number, cols: number) => {
        const resMatrix = [];
        for (let r = 0; r < rows; r++) {
            const rowArr = [];
            for (let c = 0; c < cols; c++) {
                rowArr.push(vals[r + c * rows]);
            }
            resMatrix.push(rowArr);
        }
        return resMatrix;
    };

    return {
        statistic: getValue('statistic')?.[0] || 0,
        df: getValue('parameter')?.[0] || 0,
        pValue: getValue('p_value')?.[0] || 0,
        observed: {
            data: reconstruct(obsVals, nR, nC),
            rows: rowNames,
            cols: colNames
        },
        expected: {
            data: reconstruct(expVals, nR, nC),
            rows: rowNames,
            cols: colNames
        },
        cramersV: getValue('cramers_v')?.[0] || 0,
        fisherPValue: (fisherP !== undefined && !isNaN(fisherP)) ? fisherP : null,
        warning: getValue('warning_msg')?.[0] || '',
        rCode
    };
}


/**
 * Run Confirmatory Factor Analysis (CFA) using lavaan
 */
export async function runCFA(
    data: number[][],
    columns: string[],
    modelSyntax: string
): Promise<{
    fitMeasures: {
        cfi: number;
        tli: number;
        rmsea: number;
        srmr: number;
        chisq: number;
        df: number;
        pvalue: number;
    };
    estimates: {
        lhs: string;
        op: string;
        rhs: string;
        est: number;
        std: number;
        pvalue: number;
        se: number;
    }[];
    rCode: string;
}> {
    const webR = await initWebR();

    // Parse model syntax to extract factors and their indicators
    // Expected format: "Factor1 =~ var1 + var2\nFactor2 =~ var3 + var4"
    const factorDefs = modelSyntax.split('\n').filter(line => line.includes('=~'));
    const nFactors = factorDefs.length;

    // Using psych::fa() as alternative to lavaan (since lavaan requires quadprog which is unavailable in WebR WASM)
    const rCode = `
    library(psych)
    
    # 1. Prepare Data
    data_mat <- ${arrayToRMatrix(data)}
    df <- as.data.frame(data_mat)
    colnames(df) <- c(${columns.map(c => `"${c}"`).join(',')})
    
    # 2. Run Factor Analysis using psych package (alternative to lavaan CFA)
    # nfactors = number of factors defined in model
    # rotate = "oblimin" for correlated factors (typical in CFA)
    # fm = "ml" for maximum likelihood estimation
    fa_result <- fa(df, nfactors = ${nFactors}, rotate = "oblimin", fm = "ml")
    
    # 3. Extract Fit Measures
    # psych provides similar fit indices
    fits <- fa_result$fit.stats
    
    # Calculate approximate fit indices
    n <- nrow(df)
    p <- ncol(df)
    chi_sq <- fa_result$STATISTIC
    df_val <- fa_result$dof
    p_val <- fa_result$PVAL
    
    # RMSEA from psych
    rmsea_val <- fa_result$RMSEA[1]
    
    # TLI and CFI approximation
    null_chisq <- fa_result$null.chisq
    null_df <- fa_result$null.dof
    
    tli_val <- if(!is.null(null_chisq) && !is.null(null_df) && null_df > 0 && df_val > 0) {
        ((null_chisq/null_df) - (chi_sq/df_val)) / ((null_chisq/null_df) - 1)
    } else { NA }
    
    cfi_val <- if(!is.null(null_chisq) && null_df > 0) {
        1 - max(chi_sq - df_val, 0) / max(null_chisq - null_df, chi_sq - df_val, 0)
    } else { NA }
    
    # 4. Extract Factor Loadings
    loadings_mat <- fa_result$loadings
    loadings_df <- as.data.frame(unclass(loadings_mat))
    
    # Create estimates in lavaan-like format
    estimates_list <- list()
    idx <- 1
    factor_names <- colnames(loadings_df)
    var_names <- rownames(loadings_df)
    
    for(f in 1:ncol(loadings_df)) {
        for(v in 1:nrow(loadings_df)) {
            loading <- loadings_df[v, f]
            if(abs(loading) > 0.001) {  # Only include non-zero loadings
                estimates_list[[idx]] <- list(
                    lhs = factor_names[f],
                    op = "=~",
                    rhs = var_names[v],
                    est = loading,
                    std = loading,  # In psych, loadings are standardized
                    se = NA,
                    pvalue = NA
                )
                idx <- idx + 1
            }
        }
    }
    
    list(
        cfi = if(is.na(cfi_val)) 0 else as.numeric(cfi_val),
        tli = if(is.na(tli_val)) 0 else as.numeric(tli_val),
        rmsea = if(is.na(rmsea_val)) 0 else as.numeric(rmsea_val),
        srmr = if(!is.null(fa_result$rms)) as.numeric(fa_result$rms) else 0,
        chisq = if(is.na(chi_sq)) 0 else as.numeric(chi_sq),
        df = if(is.na(df_val)) 0 else as.numeric(df_val),
        pvalue = if(is.na(p_val)) 0 else as.numeric(p_val),
        
        n_ests = length(estimates_list),
        estimates = estimates_list
    )
    `;

    try {
        const result = await webR.evalR(rCode);
        const jsResult = await result.toJs() as any;
        const getValue = parseWebRResult(jsResult);

        // Parse Fit Measures
        const fitMeasures = {
            cfi: getValue('cfi')?.[0] || 0,
            tli: getValue('tli')?.[0] || 0,
            rmsea: getValue('rmsea')?.[0] || 0,
            srmr: getValue('srmr')?.[0] || 0,
            chisq: getValue('chisq')?.[0] || 0,
            df: getValue('df')?.[0] || 0,
            pvalue: getValue('pvalue')?.[0] || 0,
        };

        // Parse Estimates from nested list
        const estimates: any[] = [];
        const estimatesRaw = getValue('estimates');

        if (estimatesRaw && Array.isArray(estimatesRaw)) {
            for (const est of estimatesRaw) {
                if (est && est.values) {
                    const estValues = parseWebRResult(est);
                    estimates.push({
                        lhs: estValues('lhs')?.[0] || '',
                        op: estValues('op')?.[0] || '=~',
                        rhs: estValues('rhs')?.[0] || '',
                        est: estValues('est')?.[0] || 0,
                        std: estValues('std')?.[0] || 0,
                        se: estValues('se')?.[0] || 0,
                        pvalue: estValues('pvalue')?.[0] || 0
                    });
                }
            }
        }

        return { fitMeasures, estimates, rCode };

    } catch (e: any) {
        throw new Error("CFA Error (psych): " + e.message);
    }
}

/**
 * Run Structural Equation Modeling (SEM) using psych package
 * Note: This is a simplified SEM using psych::fa() since lavaan requires quadprog which is unavailable in WebR WASM
 */
export async function runSEM(
    data: number[][],
    columns: string[],
    modelSyntax: string
): Promise<{
    fitMeasures: {
        cfi: number;
        tli: number;
        rmsea: number;
        srmr: number;
        chisq: number;
        df: number;
        pvalue: number;
    };
    estimates: {
        lhs: string;
        op: string;
        rhs: string;
        est: number;
        std: number;
        pvalue: number;
        se: number;
    }[];
    rCode: string;
}> {
    const webR = await initWebR();

    // Parse model syntax to count factors
    const factorDefs = modelSyntax.split('\n').filter(line => line.includes('=~'));
    const regressionDefs = modelSyntax.split('\n').filter(line => line.includes('~') && !line.includes('=~') && !line.includes('~~'));
    const nFactors = factorDefs.length;

    // Using psych::fa() for factor analysis + regression as SEM proxy
    const rCode = `
    library(psych)
    
    # 1. Prepare Data
    data_mat <- ${arrayToRMatrix(data)}
    df <- as.data.frame(data_mat)
    colnames(df) <- c(${columns.map(c => `"${c}"`).join(',')})
    
    # 2. Run Factor Analysis using psych package
    fa_result <- fa(df, nfactors = ${nFactors}, rotate = "oblimin", fm = "ml")
    
    # 3. Extract Fit Measures
    n <- nrow(df)
    chi_sq <- fa_result$STATISTIC
    df_val <- fa_result$dof
    p_val <- fa_result$PVAL
    rmsea_val <- fa_result$RMSEA[1]
    
    null_chisq <- fa_result$null.chisq
    null_df <- fa_result$null.dof
    
    tli_val <- if(!is.null(null_chisq) && !is.null(null_df) && null_df > 0 && df_val > 0) {
        ((null_chisq/null_df) - (chi_sq/df_val)) / ((null_chisq/null_df) - 1)
    } else { NA }
    
    cfi_val <- if(!is.null(null_chisq) && null_df > 0) {
        1 - max(chi_sq - df_val, 0) / max(null_chisq - null_df, chi_sq - df_val, 0)
    } else { NA }
    
    # 4. Extract Factor Loadings
    loadings_mat <- fa_result$loadings
    loadings_df <- as.data.frame(unclass(loadings_mat))
    
    # 5. Create estimates list
    estimates_list <- list()
    idx <- 1
    factor_names <- colnames(loadings_df)
    var_names <- rownames(loadings_df)
    
    # Factor loadings
    for(f in 1:ncol(loadings_df)) {
        for(v in 1:nrow(loadings_df)) {
            loading <- loadings_df[v, f]
            if(abs(loading) > 0.001) {
                estimates_list[[idx]] <- list(
                    lhs = factor_names[f],
                    op = "=~",
                    rhs = var_names[v],
                    est = loading,
                    std = loading,
                    se = NA,
                    pvalue = NA
                )
                idx <- idx + 1
            }
        }
    }
    
    # Factor correlations (structural relationships proxy)
    if(ncol(loadings_df) > 1) {
        factor_cors <- fa_result$Phi
        if(!is.null(factor_cors)) {
            for(i in 1:(ncol(factor_cors)-1)) {
                for(j in (i+1):ncol(factor_cors)) {
                    estimates_list[[idx]] <- list(
                        lhs = factor_names[i],
                        op = "~",
                        rhs = factor_names[j],
                        est = factor_cors[i,j],
                        std = factor_cors[i,j],
                        se = NA,
                        pvalue = NA
                    )
                    idx <- idx + 1
                }
            }
        }
    }
    
    list(
        cfi = if(is.na(cfi_val)) 0 else as.numeric(cfi_val),
        tli = if(is.na(tli_val)) 0 else as.numeric(tli_val),
        rmsea = if(is.na(rmsea_val)) 0 else as.numeric(rmsea_val),
        srmr = if(!is.null(fa_result$rms)) as.numeric(fa_result$rms) else 0,
        chisq = if(is.na(chi_sq)) 0 else as.numeric(chi_sq),
        df = if(is.na(df_val)) 0 else as.numeric(df_val),
        pvalue = if(is.na(p_val)) 0 else as.numeric(p_val),
        
        n_ests = length(estimates_list),
        estimates = estimates_list
    )
    `;

    try {
        const result = await webR.evalR(rCode);
        const jsResult = await result.toJs() as any;
        const getValue = parseWebRResult(jsResult);

        const fitMeasures = {
            cfi: getValue('cfi')?.[0] || 0,
            tli: getValue('tli')?.[0] || 0,
            rmsea: getValue('rmsea')?.[0] || 0,
            srmr: getValue('srmr')?.[0] || 0,
            chisq: getValue('chisq')?.[0] || 0,
            df: getValue('df')?.[0] || 0,
            pvalue: getValue('pvalue')?.[0] || 0,
        };

        // Parse Estimates from nested list
        const estimates: any[] = [];
        const estimatesRaw = getValue('estimates');

        if (estimatesRaw && Array.isArray(estimatesRaw)) {
            for (const est of estimatesRaw) {
                if (est && est.values) {
                    const estValues = parseWebRResult(est);
                    estimates.push({
                        lhs: estValues('lhs')?.[0] || '',
                        op: estValues('op')?.[0] || '=~',
                        rhs: estValues('rhs')?.[0] || '',
                        est: estValues('est')?.[0] || 0,
                        std: estValues('std')?.[0] || 0,
                        se: estValues('se')?.[0] || 0,
                        pvalue: estValues('pvalue')?.[0] || 0
                    });
                }
            }
        }

        return { fitMeasures, estimates, rCode };

    } catch (e: any) {
        throw new Error("SEM Error (psych): " + e.message);
    }
}

/**
 * Run Logistic Regression (Binary outcome 0/1)
 * data: Matrix where first column is Binary DV (0/1), others are IVs
 * names: Array of variable names [Y, X1, X2...]
 */
export async function runLogisticRegression(data: number[][], names: string[]): Promise<{
    coefficients: {
        term: string;
        estimate: number; // Log-odds (B)
        oddsRatio: number; // exp(B)
        stdError: number;
        zValue: number;
        pValue: number;
    }[];
    modelFit: {
        nullDeviance: number;
        residualDeviance: number;
        aic: number;
        pseudoR2: number; // McFadden's R²
        accuracy: number; // Classification accuracy
    };
    confusionMatrix: {
        truePositive: number;
        trueNegative: number;
        falsePositive: number;
        falseNegative: number;
    };
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    data_mat <- matrix(c(${data.flat().join(',')}), nrow = ${data.length}, byrow = TRUE)
    df <- as.data.frame(data_mat)
    colnames(df) <- c(${names.map(n => `"${n}"`).join(',')})
    
    # Ensure DV is binary (0/1)
    y_name <- colnames(df)[1]
    df[[y_name]] <- as.factor(df[[y_name]])
    
    # Formula: First col ~ . (all others)
    f_str <- paste(sprintf("\\\`%s\\\`", y_name), "~ .")
    f <- as.formula(f_str)
    
    # Fit Logistic Regression
    model <- glm(f, data = df, family = binomial(link = "logit"))
    s <- summary(model)
    
    # Coefficients
    coefs <- s$coefficients
    odds_ratios <- exp(coefs[, 1])
    
    # Model Fit
    null_dev <- model$null.deviance
    resid_dev <- model$deviance
    aic_val <- model$aic
    
    # McFadden's Pseudo R²
    pseudo_r2 <- 1 - (resid_dev / null_dev)
    
    # Predictions & Confusion Matrix
    probs <- predict(model, type = "response")
    preds <- ifelse(probs > 0.5, 1, 0)
    actual <- as.numeric(as.character(df[[y_name]]))
    
    tp <- sum(preds == 1 & actual == 1)
    tn <- sum(preds == 0 & actual == 0)
    fp <- sum(preds == 1 & actual == 0)
    fn <- sum(preds == 0 & actual == 1)
    accuracy <- (tp + tn) / length(actual)
    
    list(
        coef_names = rownames(coefs),
        estimates = coefs[, 1],
        odds_ratios = odds_ratios,
        std_errors = coefs[, 2],
        z_values = coefs[, 3],
        p_values = coefs[, 4],
        
        null_deviance = null_dev,
        residual_deviance = resid_dev,
        aic = aic_val,
        pseudo_r2 = pseudo_r2,
        accuracy = accuracy,
        
        tp = tp, tn = tn, fp = fp, fn = fn
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;
    const getValue = parseWebRResult(jsResult);

    const coefNames = getValue('coef_names') || [];
    const estimates = getValue('estimates') || [];
    const oddsRatios = getValue('odds_ratios') || [];
    const stdErrors = getValue('std_errors') || [];
    const zValues = getValue('z_values') || [];
    const pValues = getValue('p_values') || [];

    const coefficients = [];
    for (let i = 0; i < coefNames.length; i++) {
        coefficients.push({
            term: coefNames[i],
            estimate: estimates[i] || 0,
            oddsRatio: oddsRatios[i] || 1,
            stdError: stdErrors[i] || 0,
            zValue: zValues[i] || 0,
            pValue: pValues[i] || 1
        });
    }

    return {
        coefficients,
        modelFit: {
            nullDeviance: getValue('null_deviance')?.[0] || 0,
            residualDeviance: getValue('residual_deviance')?.[0] || 0,
            aic: getValue('aic')?.[0] || 0,
            pseudoR2: getValue('pseudo_r2')?.[0] || 0,
            accuracy: getValue('accuracy')?.[0] || 0
        },
        confusionMatrix: {
            truePositive: getValue('tp')?.[0] || 0,
            trueNegative: getValue('tn')?.[0] || 0,
            falsePositive: getValue('fp')?.[0] || 0,
            falseNegative: getValue('fn')?.[0] || 0
        },
        rCode
    };
}

/**
 * Run Kruskal-Wallis Test (Non-parametric ANOVA)
 * For comparing 3+ groups when normality is violated
 */
export async function runKruskalWallis(groups: number[][]): Promise<{
    statistic: number; // Chi-squared
    df: number;
    pValue: number;
    groupMedians: number[];
    effectSize: number; // Epsilon squared
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    values <- c(${groups.map(g => g.join(',')).join(',')})
    groups <- factor(c(${groups.map((g, i) => g.map(() => i + 1).join(',')).join(',')}))
    
    # Kruskal-Wallis Test
    test <- kruskal.test(values ~ groups)
    
    # Group Medians
    groupMedians <- tapply(values, groups, median)
    
    # Effect Size: Epsilon squared = H / (n - 1)
    n <- length(values)
    epsilon_sq <- test$statistic / (n - 1)
    
    list(
        statistic = test$statistic,
        df = test$parameter,
        p_value = test$p.value,
        group_medians = as.numeric(groupMedians),
        effect_size = epsilon_sq
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;
    const getValue = parseWebRResult(jsResult);

    return {
        statistic: getValue('statistic')?.[0] || 0,
        df: getValue('df')?.[0] || 0,
        pValue: getValue('p_value')?.[0] || 0,
        groupMedians: getValue('group_medians') || [],
        effectSize: getValue('effect_size')?.[0] || 0,
        rCode
    };
}

/**
 * Run Wilcoxon Signed-Rank Test (Non-parametric paired)
 * For comparing paired samples when normality is violated
 */
export async function runWilcoxonSignedRank(before: number[], after: number[]): Promise<{
    statistic: number; // V
    pValue: number;
    medianBefore: number;
    medianAfter: number;
    medianDiff: number;
    effectSize: number; // r = Z / sqrt(N)
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    before <- c(${before.join(',')})
    after <- c(${after.join(',')})
    
    # Wilcoxon Signed-Rank Test (paired)
    test <- wilcox.test(before, after, paired = TRUE, conf.int = TRUE)
    
    # Effect Size: r = Z / sqrt(N)
    n <- length(before)
    z_score <- qnorm(test$p.value / 2)
    effect_r <- abs(z_score) / sqrt(n)
    
    # Difference
    diffs <- before - after
    
    list(
        statistic = test$statistic,
        p_value = test$p.value,
        median_before = median(before),
        median_after = median(after),
        median_diff = median(diffs),
        effect_size = effect_r
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;
    const getValue = parseWebRResult(jsResult);

    return {
        statistic: getValue('statistic')?.[0] || 0,
        pValue: getValue('p_value')?.[0] || 0,
        medianBefore: getValue('median_before')?.[0] || 0,
        medianAfter: getValue('median_after')?.[0] || 0,
        medianDiff: getValue('median_diff')?.[0] || 0,
        effectSize: getValue('effect_size')?.[0] || 0,
        rCode
    };
}

/**
 * Run Mediation Analysis (Baron & Kenny method with Sobel test)
 * Tests whether M mediates the relationship between X and Y
 * 
 * Model: X → M → Y (with possible direct effect X → Y)
 * 
 * @param x - Independent variable (predictor)
 * @param m - Mediator variable
 * @param y - Dependent variable (outcome)
 */
export async function runMediationAnalysis(
    x: number[],
    m: number[],
    y: number[]
): Promise<{
    // Path coefficients
    pathA: { estimate: number; se: number; pValue: number }; // X → M
    pathB: { estimate: number; se: number; pValue: number }; // M → Y (controlling X)
    pathC: { estimate: number; se: number; pValue: number }; // X → Y (total effect)
    pathCprime: { estimate: number; se: number; pValue: number }; // X → Y (direct, controlling M)

    // Effects
    indirectEffect: number; // a * b
    totalEffect: number; // c
    directEffect: number; // c'
    proportionMediated: number; // indirect / total

    // Sobel Test
    sobelZ: number;
    sobelP: number;

    // Bootstrap CI for indirect effect (if available)
    bootstrapCI: { lower: number; upper: number } | null;

    // Interpretation
    mediationType: 'full' | 'partial' | 'none';

    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    x <- c(${x.join(',')})
    m <- c(${m.join(',')})
    y <- c(${y.join(',')})
    
    # === BARON & KENNY STEPS ===
    
    # Step 1: Path c (Total Effect) - X predicts Y
    model_c <- lm(y ~ x)
    sum_c <- summary(model_c)
    path_c <- coef(sum_c)[2, 1]
    path_c_se <- coef(sum_c)[2, 2]
    path_c_p <- coef(sum_c)[2, 4]
    
    # Step 2: Path a - X predicts M
    model_a <- lm(m ~ x)
    sum_a <- summary(model_a)
    path_a <- coef(sum_a)[2, 1]
    path_a_se <- coef(sum_a)[2, 2]
    path_a_p <- coef(sum_a)[2, 4]
    
    # Step 3: Paths b and c' - M predicts Y controlling for X
    model_bc <- lm(y ~ x + m)
    sum_bc <- summary(model_bc)
    path_b <- coef(sum_bc)[3, 1]  # M coefficient
    path_b_se <- coef(sum_bc)[3, 2]
    path_b_p <- coef(sum_bc)[3, 4]
    path_cprime <- coef(sum_bc)[2, 1]  # X coefficient (direct effect)
    path_cprime_se <- coef(sum_bc)[2, 2]
    path_cprime_p <- coef(sum_bc)[2, 4]
    
    # === INDIRECT EFFECT ===
    indirect_effect <- path_a * path_b
    total_effect <- path_c
    direct_effect <- path_cprime
    
    # Proportion mediated
    prop_mediated <- 0
    if (abs(total_effect) > 0.0001) {
        prop_mediated <- indirect_effect / total_effect
    }
    
    # === SOBEL TEST ===
    # SE of indirect effect: sqrt(b²*SEa² + a²*SEb²)
    sobel_se <- sqrt(path_b^2 * path_a_se^2 + path_a^2 * path_b_se^2)
    sobel_z <- indirect_effect / sobel_se
    sobel_p <- 2 * (1 - pnorm(abs(sobel_z)))
    
    # === BOOTSTRAP CI (simplified - 1000 iterations) ===
    n <- length(x)
    n_boot <- 1000
    boot_indirect <- numeric(n_boot)
    
    set.seed(123)
    for (i in 1:n_boot) {
        idx <- sample(1:n, n, replace = TRUE)
        x_b <- x[idx]
        m_b <- m[idx]
        y_b <- y[idx]
        
        a_b <- coef(lm(m_b ~ x_b))[2]
        b_b <- coef(lm(y_b ~ x_b + m_b))[3]
        boot_indirect[i] <- a_b * b_b
    }
    
    boot_ci_lower <- quantile(boot_indirect, 0.025, na.rm = TRUE)
    boot_ci_upper <- quantile(boot_indirect, 0.975, na.rm = TRUE)
    
    # === MEDIATION TYPE ===
    # Full: c' not significant, indirect significant
    # Partial: both c' and indirect significant
    # None: indirect not significant
    mediation_type <- "none"
    if (sobel_p < 0.05) {
        if (path_cprime_p >= 0.05) {
            mediation_type <- "full"
        } else {
            mediation_type <- "partial"
        }
    }
    
    list(
        path_a = path_a,
        path_a_se = path_a_se,
        path_a_p = path_a_p,
        
        path_b = path_b,
        path_b_se = path_b_se,
        path_b_p = path_b_p,
        
        path_c = path_c,
        path_c_se = path_c_se,
        path_c_p = path_c_p,
        
        path_cprime = path_cprime,
        path_cprime_se = path_cprime_se,
        path_cprime_p = path_cprime_p,
        
        indirect_effect = indirect_effect,
        total_effect = total_effect,
        direct_effect = direct_effect,
        prop_mediated = prop_mediated,
        
        sobel_z = sobel_z,
        sobel_p = sobel_p,
        
        boot_ci_lower = as.numeric(boot_ci_lower),
        boot_ci_upper = as.numeric(boot_ci_upper),
        
        mediation_type = mediation_type
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;
    const getValue = parseWebRResult(jsResult);

    return {
        pathA: {
            estimate: getValue('path_a')?.[0] || 0,
            se: getValue('path_a_se')?.[0] || 0,
            pValue: getValue('path_a_p')?.[0] || 1
        },
        pathB: {
            estimate: getValue('path_b')?.[0] || 0,
            se: getValue('path_b_se')?.[0] || 0,
            pValue: getValue('path_b_p')?.[0] || 1
        },
        pathC: {
            estimate: getValue('path_c')?.[0] || 0,
            se: getValue('path_c_se')?.[0] || 0,
            pValue: getValue('path_c_p')?.[0] || 1
        },
        pathCprime: {
            estimate: getValue('path_cprime')?.[0] || 0,
            se: getValue('path_cprime_se')?.[0] || 0,
            pValue: getValue('path_cprime_p')?.[0] || 1
        },

        indirectEffect: getValue('indirect_effect')?.[0] || 0,
        totalEffect: getValue('total_effect')?.[0] || 0,
        directEffect: getValue('direct_effect')?.[0] || 0,
        proportionMediated: getValue('prop_mediated')?.[0] || 0,

        sobelZ: getValue('sobel_z')?.[0] || 0,
        sobelP: getValue('sobel_p')?.[0] || 1,

        bootstrapCI: {
            lower: getValue('boot_ci_lower')?.[0] || 0,
            upper: getValue('boot_ci_upper')?.[0] || 0
        },

        mediationType: (getValue('mediation_type')?.[0] || 'none') as 'full' | 'partial' | 'none',

        rCode
    };
}

// Run Moderation Analysis (Hierarchical Regression with Interaction)
// Tests if moderator (W) changes the relationship between X and Y
// @param xData - Independent variable data
// @param yData - Dependent variable data  
// @param wData - Moderator variable data
// @param xName - Name of X variable
// @param yName - Name of Y variable
// @param wName - Name of moderator variable
export async function runModerationAnalysis(
    xData: number[],
    yData: number[],
    wData: number[],
    xName: string = 'X',
    yName: string = 'Y',
    wName: string = 'W'
): Promise<{
    // Model 1: X -> Y (without moderator)
    model1: {
        r2: number;
        adjR2: number;
        fValue: number;
        fPValue: number;
        xCoef: number;
        xSE: number;
        xT: number;
        xP: number;
    };
    // Model 2: X + W -> Y
    model2: {
        r2: number;
        adjR2: number;
        r2Change: number;
        fChange: number;
        fChangePValue: number;
        xCoef: number;
        xP: number;
        wCoef: number;
        wP: number;
    };
    // Model 3: X + W + X*W -> Y (full moderation model)
    model3: {
        r2: number;
        adjR2: number;
        r2Change: number;
        fChange: number;
        fChangePValue: number;
        xCoef: number;
        xP: number;
        wCoef: number;
        wP: number;
        interactionCoef: number;
        interactionSE: number;
        interactionT: number;
        interactionP: number;
    };
    // Simple slopes at different levels of W
    simpleSlopes: {
        lowW: { slope: number; se: number; t: number; p: number };
        meanW: { slope: number; se: number; t: number; p: number };
        highW: { slope: number; se: number; t: number; p: number };
    };
    // Effect sizes
    effectSize: {
        f2Interaction: number; // Cohen's f² for interaction
        interpretation: string; // small/medium/large
    };
    // Moderator descriptives
    moderatorStats: {
        mean: number;
        sd: number;
        lowValue: number;  // Mean - 1 SD
        highValue: number; // Mean + 1 SD
    };
    // Interpretation
    isSignificant: boolean;
    interpretation: string;
    rCode: string;
}> {
    const webR = await initWebR();

    // Build data vectors
    const xVec = xData.join(',');
    const yVec = yData.join(',');
    const wVec = wData.join(',');

    const rCode = `
    # Moderation Analysis with Hierarchical Regression
    x <- c(${xVec})
    y <- c(${yVec})
    w <- c(${wVec})
    
    # Center predictors (recommended for moderation)
    x_c <- scale(x, center = TRUE, scale = FALSE)[,1]
    w_c <- scale(w, center = TRUE, scale = FALSE)[,1]
    
    # Create interaction term
    xw_c <- x_c * w_c
    
    # Model 1: X only
    model1 <- lm(y ~ x_c)
    m1_sum <- summary(model1)
    
    # Model 2: X + W
    model2 <- lm(y ~ x_c + w_c)
    m2_sum <- summary(model2)
    
    # Model 3: X + W + Interaction
    model3 <- lm(y ~ x_c + w_c + xw_c)
    m3_sum <- summary(model3)
    
    # R² change calculations
    r2_change_m2 <- m2_sum$r.squared - m1_sum$r.squared
    r2_change_m3 <- m3_sum$r.squared - m2_sum$r.squared
    
    # F-change for Model 2 vs 1
    n <- length(y)
    df1_m2 <- 1  # one additional predictor
    df2_m2 <- n - 3
    f_change_m2 <- (r2_change_m2 * df2_m2) / ((1 - m2_sum$r.squared) * df1_m2)
    f_change_p_m2 <- pf(f_change_m2, df1_m2, df2_m2, lower.tail = FALSE)
    
    # F-change for Model 3 vs 2
    df1_m3 <- 1  # one additional predictor (interaction)
    df2_m3 <- n - 4
    f_change_m3 <- (r2_change_m3 * df2_m3) / ((1 - m3_sum$r.squared) * df1_m3)
    f_change_p_m3 <- pf(f_change_m3, df1_m3, df2_m3, lower.tail = FALSE)
    
    # Extract coefficients from Model 3
    coefs <- m3_sum$coefficients
    
    # Simple slopes analysis
    w_mean <- mean(w)
    w_sd <- sd(w)
    w_low <- -w_sd   # centered, so -1 SD
    w_high <- w_sd   # centered, so +1 SD
    
    # Simple slope formula: b_X + b_XW * W
    b_x <- coefs['x_c', 'Estimate']
    b_xw <- coefs['xw_c', 'Estimate']
    
    # Variance-covariance matrix for SE calculation
    vcov_m3 <- vcov(model3)
    
    # Simple slope at low W (-1 SD)
    slope_low <- b_x + b_xw * w_low
    se_low <- sqrt(vcov_m3['x_c', 'x_c'] + 2 * w_low * vcov_m3['x_c', 'xw_c'] + w_low^2 * vcov_m3['xw_c', 'xw_c'])
    t_low <- slope_low / se_low
    p_low <- 2 * pt(abs(t_low), df = n - 4, lower.tail = FALSE)
    
    # Simple slope at mean W (0, since centered)
    slope_mean <- b_x + b_xw * 0
    se_mean <- sqrt(vcov_m3['x_c', 'x_c'])
    t_mean <- slope_mean / se_mean
    p_mean <- 2 * pt(abs(t_mean), df = n - 4, lower.tail = FALSE)
    
    # Simple slope at high W (+1 SD)
    slope_high <- b_x + b_xw * w_high
    se_high <- sqrt(vcov_m3['x_c', 'x_c'] + 2 * w_high * vcov_m3['x_c', 'xw_c'] + w_high^2 * vcov_m3['xw_c', 'xw_c'])
    t_high <- slope_high / se_high
    p_high <- 2 * pt(abs(t_high), df = n - 4, lower.tail = FALSE)
    
    # Cohen's f² for interaction effect
    f2_interaction <- r2_change_m3 / (1 - m3_sum$r.squared)
    
    list(
        # Model 1
        m1_r2 = m1_sum$r.squared,
        m1_adjr2 = m1_sum$adj.r.squared,
        m1_f = ifelse(is.null(m1_sum$fstatistic), 0, m1_sum$fstatistic[1]),
        m1_fp = ifelse(is.null(m1_sum$fstatistic), 1, pf(m1_sum$fstatistic[1], m1_sum$fstatistic[2], m1_sum$fstatistic[3], lower.tail = FALSE)),
        m1_x_coef = m1_sum$coefficients['x_c', 'Estimate'],
        m1_x_se = m1_sum$coefficients['x_c', 'Std. Error'],
        m1_x_t = m1_sum$coefficients['x_c', 't value'],
        m1_x_p = m1_sum$coefficients['x_c', 'Pr(>|t|)'],
        
        # Model 2
        m2_r2 = m2_sum$r.squared,
        m2_adjr2 = m2_sum$adj.r.squared,
        m2_r2change = r2_change_m2,
        m2_fchange = f_change_m2,
        m2_fchange_p = f_change_p_m2,
        m2_x_coef = m2_sum$coefficients['x_c', 'Estimate'],
        m2_x_p = m2_sum$coefficients['x_c', 'Pr(>|t|)'],
        m2_w_coef = m2_sum$coefficients['w_c', 'Estimate'],
        m2_w_p = m2_sum$coefficients['w_c', 'Pr(>|t|)'],
        
        # Model 3
        m3_r2 = m3_sum$r.squared,
        m3_adjr2 = m3_sum$adj.r.squared,
        m3_r2change = r2_change_m3,
        m3_fchange = f_change_m3,
        m3_fchange_p = f_change_p_m3,
        m3_x_coef = coefs['x_c', 'Estimate'],
        m3_x_p = coefs['x_c', 'Pr(>|t|)'],
        m3_w_coef = coefs['w_c', 'Estimate'],
        m3_w_p = coefs['w_c', 'Pr(>|t|)'],
        m3_int_coef = coefs['xw_c', 'Estimate'],
        m3_int_se = coefs['xw_c', 'Std. Error'],
        m3_int_t = coefs['xw_c', 't value'],
        m3_int_p = coefs['xw_c', 'Pr(>|t|)'],
        
        # Simple slopes
        slope_low = slope_low,
        se_low = se_low,
        t_low = t_low,
        p_low = p_low,
        slope_mean = slope_mean,
        se_mean = se_mean,
        t_mean = t_mean,
        p_mean = p_mean,
        slope_high = slope_high,
        se_high = se_high,
        t_high = t_high,
        p_high = p_high,
        
        # Effect size
        f2_interaction = f2_interaction,
        
        # Moderator stats
        w_mean = w_mean,
        w_sd = w_sd,
        w_low_val = w_mean - w_sd,
        w_high_val = w_mean + w_sd
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;
    const getValue = parseWebRResult(jsResult);

    const interactionP = getValue('m3_int_p')?.[0] || 1;
    const f2 = getValue('f2_interaction')?.[0] || 0;

    // Determine effect size interpretation
    let effectInterpretation = 'negligible';
    if (f2 >= 0.35) effectInterpretation = 'large';
    else if (f2 >= 0.15) effectInterpretation = 'medium';
    else if (f2 >= 0.02) effectInterpretation = 'small';

    const isSignificant = interactionP < 0.05;

    return {
        model1: {
            r2: getValue('m1_r2')?.[0] || 0,
            adjR2: getValue('m1_adjr2')?.[0] || 0,
            fValue: getValue('m1_f')?.[0] || 0,
            fPValue: getValue('m1_fp')?.[0] || 1,
            xCoef: getValue('m1_x_coef')?.[0] || 0,
            xSE: getValue('m1_x_se')?.[0] || 0,
            xT: getValue('m1_x_t')?.[0] || 0,
            xP: getValue('m1_x_p')?.[0] || 1
        },
        model2: {
            r2: getValue('m2_r2')?.[0] || 0,
            adjR2: getValue('m2_adjr2')?.[0] || 0,
            r2Change: getValue('m2_r2change')?.[0] || 0,
            fChange: getValue('m2_fchange')?.[0] || 0,
            fChangePValue: getValue('m2_fchange_p')?.[0] || 1,
            xCoef: getValue('m2_x_coef')?.[0] || 0,
            xP: getValue('m2_x_p')?.[0] || 1,
            wCoef: getValue('m2_w_coef')?.[0] || 0,
            wP: getValue('m2_w_p')?.[0] || 1
        },
        model3: {
            r2: getValue('m3_r2')?.[0] || 0,
            adjR2: getValue('m3_adjr2')?.[0] || 0,
            r2Change: getValue('m3_r2change')?.[0] || 0,
            fChange: getValue('m3_fchange')?.[0] || 0,
            fChangePValue: getValue('m3_fchange_p')?.[0] || 1,
            xCoef: getValue('m3_x_coef')?.[0] || 0,
            xP: getValue('m3_x_p')?.[0] || 1,
            wCoef: getValue('m3_w_coef')?.[0] || 0,
            wP: getValue('m3_w_p')?.[0] || 1,
            interactionCoef: getValue('m3_int_coef')?.[0] || 0,
            interactionSE: getValue('m3_int_se')?.[0] || 0,
            interactionT: getValue('m3_int_t')?.[0] || 0,
            interactionP: interactionP
        },
        simpleSlopes: {
            lowW: {
                slope: getValue('slope_low')?.[0] || 0,
                se: getValue('se_low')?.[0] || 0,
                t: getValue('t_low')?.[0] || 0,
                p: getValue('p_low')?.[0] || 1
            },
            meanW: {
                slope: getValue('slope_mean')?.[0] || 0,
                se: getValue('se_mean')?.[0] || 0,
                t: getValue('t_mean')?.[0] || 0,
                p: getValue('p_mean')?.[0] || 1
            },
            highW: {
                slope: getValue('slope_high')?.[0] || 0,
                se: getValue('se_high')?.[0] || 0,
                t: getValue('t_high')?.[0] || 0,
                p: getValue('p_high')?.[0] || 1
            }
        },
        effectSize: {
            f2Interaction: f2,
            interpretation: effectInterpretation
        },
        moderatorStats: {
            mean: getValue('w_mean')?.[0] || 0,
            sd: getValue('w_sd')?.[0] || 0,
            lowValue: getValue('w_low_val')?.[0] || 0,
            highValue: getValue('w_high_val')?.[0] || 0
        },
        isSignificant,
        interpretation: isSignificant
            ? `Hiệu ứng điều tiết có ý nghĩa thống kê (p = ${interactionP.toFixed(4)}). ${wName} điều tiết mối quan hệ giữa ${xName} và ${yName}.`
            : `Không có hiệu ứng điều tiết có ý nghĩa (p = ${interactionP.toFixed(4)}). ${wName} không điều tiết mối quan hệ giữa ${xName} và ${yName}.`,
        rCode
    };
}

// Run Two-Way ANOVA (Factorial ANOVA)
// Tests main effects and interaction of two factors on a dependent variable
export async function runTwoWayANOVA(
    yData: number[],
    factor1: (string | number)[],
    factor2: (string | number)[],
    factor1Name: string = 'Factor1',
    factor2Name: string = 'Factor2',
    yName: string = 'Y'
): Promise<{
    mainEffect1: {
        ss: number;
        df: number;
        ms: number;
        f: number;
        pValue: number;
        etaSquared: number;
    };
    mainEffect2: {
        ss: number;
        df: number;
        ms: number;
        f: number;
        pValue: number;
        etaSquared: number;
    };
    interaction: {
        ss: number;
        df: number;
        ms: number;
        f: number;
        pValue: number;
        etaSquared: number;
    };
    residual: {
        ss: number;
        df: number;
        ms: number;
    };
    total: {
        ss: number;
        df: number;
    };
    cellMeans: {
        level1: string;
        level2: string;
        mean: number;
        sd: number;
        n: number;
    }[];
    marginalMeans1: { level: string; mean: number; n: number }[];
    marginalMeans2: { level: string; mean: number; n: number }[];
    assumptions: {
        leveneP: number;
        normalityP: number;
    };
    interpretation: string;
    rCode: string;
}> {
    const webR = await initWebR();

    const yVec = yData.join(',');
    const f1Vec = factor1.map(v => `"${v}"`).join(',');
    const f2Vec = factor2.map(v => `"${v}"`).join(',');

    const rCode = `
    # Two-Way ANOVA
    y <- c(${yVec})
    f1 <- factor(c(${f1Vec}))
    f2 <- factor(c(${f2Vec}))
    df <- data.frame(y = y, f1 = f1, f2 = f2)
    
    # Fit ANOVA model
    model <- aov(y ~ f1 * f2, data = df)
    anova_table <- summary(model)[[1]]
    
    # Extract sums of squares
    ss <- anova_table[, 'Sum Sq']
    dfs <- anova_table[, 'Df']
    ms <- anova_table[, 'Mean Sq']
    f_vals <- anova_table[, 'F value']
    p_vals <- anova_table[, 'Pr(>F)']
    
    ss_total <- sum(ss)
    
    # Eta squared
    eta_f1 <- ss[1] / ss_total
    eta_f2 <- ss[2] / ss_total
    eta_int <- ss[3] / ss_total
    
    # Cell means
    cell_means <- aggregate(y ~ f1 + f2, data = df, FUN = function(x) c(mean = mean(x), sd = sd(x), n = length(x)))
    
    # Marginal means
    marg1 <- aggregate(y ~ f1, data = df, FUN = mean)
    marg1_n <- aggregate(y ~ f1, data = df, FUN = length)
    marg2 <- aggregate(y ~ f2, data = df, FUN = mean)
    marg2_n <- aggregate(y ~ f2, data = df, FUN = length)
    
    # Levene's test for homogeneity of variance
    levene_p <- tryCatch({
        res <- residuals(model)
        groups <- interaction(f1, f2)
        abs_res <- abs(res - ave(res, groups, FUN = median))
        anova(lm(abs_res ~ groups))$'Pr(>F)'[1]
    }, error = function(e) NA)
    
    # Normality test on residuals
    shapiro_p <- tryCatch({
        shapiro.test(residuals(model))$p.value
    }, error = function(e) NA)
    
    list(
        ss_f1 = ss[1], df_f1 = dfs[1], ms_f1 = ms[1], f_f1 = f_vals[1], p_f1 = p_vals[1], eta_f1 = eta_f1,
        ss_f2 = ss[2], df_f2 = dfs[2], ms_f2 = ms[2], f_f2 = f_vals[2], p_f2 = p_vals[2], eta_f2 = eta_f2,
        ss_int = ss[3], df_int = dfs[3], ms_int = ms[3], f_int = f_vals[3], p_int = p_vals[3], eta_int = eta_int,
        ss_resid = ss[4], df_resid = dfs[4], ms_resid = ms[4],
        ss_total = ss_total, df_total = sum(dfs),
        
        cell_levels1 = as.character(cell_means$f1),
        cell_levels2 = as.character(cell_means$f2),
        cell_mean = cell_means$y[, 'mean'],
        cell_sd = cell_means$y[, 'sd'],
        cell_n = cell_means$y[, 'n'],
        
        marg1_levels = as.character(marg1$f1),
        marg1_means = marg1$y,
        marg1_n = marg1_n$y,
        marg2_levels = as.character(marg2$f2),
        marg2_means = marg2$y,
        marg2_n = marg2_n$y,
        
        levene_p = levene_p,
        shapiro_p = shapiro_p
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;
    const getValue = parseWebRResult(jsResult);

    // Build cell means
    const cellLevels1 = getValue('cell_levels1') || [];
    const cellLevels2 = getValue('cell_levels2') || [];
    const cellMean = getValue('cell_mean') || [];
    const cellSd = getValue('cell_sd') || [];
    const cellN = getValue('cell_n') || [];

    const cellMeans = [];
    for (let i = 0; i < cellLevels1.length; i++) {
        cellMeans.push({
            level1: String(cellLevels1[i]),
            level2: String(cellLevels2[i]),
            mean: cellMean[i] || 0,
            sd: cellSd[i] || 0,
            n: cellN[i] || 0
        });
    }

    // Marginal means
    const marg1Levels = getValue('marg1_levels') || [];
    const marg1Means = getValue('marg1_means') || [];
    const marg1N = getValue('marg1_n') || [];
    const marginalMeans1 = marg1Levels.map((level: string, i: number) => ({
        level: String(level),
        mean: marg1Means[i] || 0,
        n: marg1N[i] || 0
    }));

    const marg2Levels = getValue('marg2_levels') || [];
    const marg2Means = getValue('marg2_means') || [];
    const marg2N = getValue('marg2_n') || [];
    const marginalMeans2 = marg2Levels.map((level: string, i: number) => ({
        level: String(level),
        mean: marg2Means[i] || 0,
        n: marg2N[i] || 0
    }));

    const pF1 = getValue('p_f1')?.[0] || 1;
    const pF2 = getValue('p_f2')?.[0] || 1;
    const pInt = getValue('p_int')?.[0] || 1;

    let interpretation = '';
    if (pInt < 0.05) {
        interpretation = `Có tương tác có ý nghĩa giữa ${factor1Name} và ${factor2Name} (p = ${pInt.toFixed(4)}). Cần phân tích đơn giản (simple effects).`;
    } else {
        const effects = [];
        if (pF1 < 0.05) effects.push(`${factor1Name} (p = ${pF1.toFixed(4)})`);
        if (pF2 < 0.05) effects.push(`${factor2Name} (p = ${pF2.toFixed(4)})`);
        interpretation = effects.length > 0
            ? `Có tác động chính có ý nghĩa của: ${effects.join(', ')}.`
            : 'Không có tác động chính hay tương tác có ý nghĩa thống kê.';
    }

    return {
        mainEffect1: {
            ss: getValue('ss_f1')?.[0] || 0,
            df: getValue('df_f1')?.[0] || 0,
            ms: getValue('ms_f1')?.[0] || 0,
            f: getValue('f_f1')?.[0] || 0,
            pValue: pF1,
            etaSquared: getValue('eta_f1')?.[0] || 0
        },
        mainEffect2: {
            ss: getValue('ss_f2')?.[0] || 0,
            df: getValue('df_f2')?.[0] || 0,
            ms: getValue('ms_f2')?.[0] || 0,
            f: getValue('f_f2')?.[0] || 0,
            pValue: pF2,
            etaSquared: getValue('eta_f2')?.[0] || 0
        },
        interaction: {
            ss: getValue('ss_int')?.[0] || 0,
            df: getValue('df_int')?.[0] || 0,
            ms: getValue('ms_int')?.[0] || 0,
            f: getValue('f_int')?.[0] || 0,
            pValue: pInt,
            etaSquared: getValue('eta_int')?.[0] || 0
        },
        residual: {
            ss: getValue('ss_resid')?.[0] || 0,
            df: getValue('df_resid')?.[0] || 0,
            ms: getValue('ms_resid')?.[0] || 0
        },
        total: {
            ss: getValue('ss_total')?.[0] || 0,
            df: getValue('df_total')?.[0] || 0
        },
        cellMeans,
        marginalMeans1,
        marginalMeans2,
        assumptions: {
            leveneP: getValue('levene_p')?.[0] || 1,
            normalityP: getValue('shapiro_p')?.[0] || 1
        },
        interpretation,
        rCode
    };
}

// Run Cluster Analysis (K-Means)
// Segments data into k clusters based on variable similarity
export async function runClusterAnalysis(
    data: number[][],
    k: number = 3,
    method: 'kmeans' | 'hierarchical' = 'kmeans',
    varNames: string[] = []
): Promise<{
    clusters: number[];  // Cluster assignment for each observation
    nClusters: number;
    clusterSizes: number[];
    clusterCenters: number[][];  // Mean values for each cluster
    clusterProfiles: {
        cluster: number;
        size: number;
        percentage: number;
        means: { variable: string; mean: number; sd: number }[];
    }[];
    withinSS: number[];    // Within-cluster sum of squares
    betweenSS: number;
    totalSS: number;
    silhouetteAvg: number; // Average silhouette score
    optimalK: {
        elbow: number;
        silhouette: number;
    };
    interpretation: string;
    rCode: string;
}> {
    const webR = await initWebR();

    const nVars = data[0]?.length || 0;
    const names = varNames.length > 0 ? varNames : Array.from({ length: nVars }, (_, i) => `V${i + 1}`);

    // Build data matrix
    const dataMatrix = arrayToRMatrix(data);

    const rCode = `
    # Cluster Analysis (K-Means)
    data_mat <- ${dataMatrix}
    colnames(data_mat) <- c(${names.map(n => `"${n}"`).join(',')})
    
    # Standardize data
    data_scaled <- scale(data_mat)
    
    # K-Means clustering
    set.seed(123)
    k <- ${k}
    km <- kmeans(data_scaled, centers = k, nstart = 25)
    
    # Results
    clusters <- km$cluster
    centers <- km$centers
    sizes <- km$size
    within_ss <- km$withinss
    between_ss <- km$betweenss
    total_ss <- km$totss
    
    # Calculate silhouette (simplified)
    dist_mat <- dist(data_scaled)
    n <- nrow(data_scaled)
    sil_scores <- numeric(n)
    for (i in 1:n) {
        my_cluster <- clusters[i]
        my_points <- which(clusters == my_cluster)
        other_points <- which(clusters != my_cluster)
        
        a <- if (length(my_points) > 1) mean(as.matrix(dist_mat)[i, my_points[-which(my_points == i)]]) else 0
        b <- if (length(other_points) > 0) min(sapply(unique(clusters[other_points]), function(c) {
            mean(as.matrix(dist_mat)[i, which(clusters == c)])
        })) else 0
        
        sil_scores[i] <- if (max(a, b) > 0) (b - a) / max(a, b) else 0
    }
    sil_avg <- mean(sil_scores)
    
    # Elbow method for optimal k
    wss <- numeric(10)
    for (i in 1:min(10, nrow(data_scaled) - 1)) {
        wss[i] <- sum(kmeans(data_scaled, centers = i, nstart = 10)$withinss)
    }
    
    # Simple elbow detection (max drop)
    drops <- diff(wss)
    optimal_elbow <- which.max(abs(drops)) + 1
    
    # Optimal by silhouette
    sil_scores_k <- numeric(9)
    for (i in 2:10) {
        km_temp <- kmeans(data_scaled, centers = i, nstart = 10)
        # Simplified silhouette calculation
        sil_scores_k[i-1] <- km_temp$betweenss / km_temp$totss
    }
    optimal_sil <- which.max(sil_scores_k) + 1
    
    # Cluster profiles (on original scale)
    profile_means <- aggregate(data_mat, by = list(cluster = clusters), FUN = mean)
    profile_sds <- aggregate(data_mat, by = list(cluster = clusters), FUN = sd)
    
    list(
        clusters = clusters,
        n_clusters = k,
        sizes = sizes,
        centers = as.vector(centers),
        n_vars = ncol(centers),
        within_ss = within_ss,
        between_ss = between_ss,
        total_ss = total_ss,
        sil_avg = sil_avg,
        optimal_elbow = optimal_elbow,
        optimal_sil = optimal_sil,
        profile_means = as.vector(as.matrix(profile_means[, -1])),
        profile_sds = as.vector(as.matrix(profile_sds[, -1]))
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;
    const getValue = parseWebRResult(jsResult);

    const clusters = getValue('clusters') || [];
    const sizes = getValue('sizes') || [];
    const nClusters = getValue('n_clusters')?.[0] || k;
    const nVarsResult = getValue('n_vars')?.[0] || nVars;
    const centersFlat = getValue('centers') || [];
    const profileMeansFlat = getValue('profile_means') || [];
    const profileSdsFlat = getValue('profile_sds') || [];

    // Parse centers matrix
    const clusterCenters: number[][] = [];
    for (let i = 0; i < nClusters; i++) {
        const row: number[] = [];
        for (let j = 0; j < nVarsResult; j++) {
            row.push(centersFlat[j * nClusters + i] || 0);
        }
        clusterCenters.push(row);
    }

    // Build cluster profiles
    const totalN = clusters.length;
    const clusterProfiles = [];
    for (let c = 0; c < nClusters; c++) {
        const means: { variable: string; mean: number; sd: number }[] = [];
        for (let v = 0; v < nVarsResult; v++) {
            means.push({
                variable: names[v] || `V${v + 1}`,
                mean: profileMeansFlat[v * nClusters + c] || 0,
                sd: profileSdsFlat[v * nClusters + c] || 0
            });
        }
        clusterProfiles.push({
            cluster: c + 1,
            size: sizes[c] || 0,
            percentage: ((sizes[c] || 0) / totalN) * 100,
            means
        });
    }

    const silAvg = getValue('sil_avg')?.[0] || 0;
    const interpretation = `Phân ${nClusters} cụm với Silhouette = ${silAvg.toFixed(3)} (${silAvg > 0.7 ? 'cấu trúc mạnh' : silAvg > 0.5 ? 'cấu trúc hợp lý' : silAvg > 0.25 ? 'cấu trúc yếu' : 'không có cấu trúc rõ ràng'}).`;

    return {
        clusters: clusters.map((c: number) => c),
        nClusters,
        clusterSizes: sizes.map((s: number) => s),
        clusterCenters,
        clusterProfiles,
        withinSS: (getValue('within_ss') || []).map((v: number) => v),
        betweenSS: getValue('between_ss')?.[0] || 0,
        totalSS: getValue('total_ss')?.[0] || 0,
        silhouetteAvg: silAvg,
        optimalK: {
            elbow: getValue('optimal_elbow')?.[0] || 3,
            silhouette: getValue('optimal_sil')?.[0] || 3
        },
        interpretation,
        rCode
    };
}
