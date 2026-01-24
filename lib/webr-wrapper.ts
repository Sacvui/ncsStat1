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
    updateProgress('Đang khởi tạo WebR...');

    // Retry logic wrapper
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        initPromise = (async () => {
            try {
                const webR = new WebR({
                    channelType: 1, // PostMessage channel
                });

                updateProgress('Đang tải R runtime...');
                await webR.init();

                // Step 1: Set correct WASM Repo (Priority: 1. Core WASM, 2. R-Universe for missing binaries like quadprog)
                await webR.evalR('options(repos = c(R_WASM = "https://repo.r-wasm.org/", CRAN = "https://cran.r-universe.dev/"))');

                // Verify initialization
                if (!webR.evalR) {
                    throw new Error('WebR initialized but evalR is not available');
                }

                // Step 2: Install required packages (psych-based CFA/SEM - no lavaan needed)
                updateProgress('Đang tải thư viện chính (psych, GPArotation)...');
                try {
                    await webR.installPackages(['psych', 'corrplot', 'GPArotation']);
                } catch (pkgError) {
                    console.warn('Package install warning:', pkgError);
                }

                // Step 3 & 4: Load packages and integrity check
                updateProgress('Đang kích hoạt R environment...');

                await webR.evalR('library(psych)');
                await webR.evalR('library(GPArotation)');

                updateProgress('Sẵn sàng!');
                webRInstance = webR;
                isInitializing = false;
                initPromise = null;
                return webR;
            } catch (error) {
                // If not last attempt, retry
                if (attempt < maxRetries - 1) {
                    console.warn(`WebR init attempt ${attempt + 1} failed, retrying...`);
                    updateProgress(`Thử lại lần ${attempt + 2}...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    throw error; // Throw to trigger retry
                }

                // Last attempt failed
                isInitializing = false;
                webRInstance = null;
                initPromise = null;
                updateProgress('Lỗi khởi tạo!');
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
 */
export async function runCronbachAlpha(data: number[][]): Promise<{
    alpha: number;
    rawAlpha: number;
    standardizedAlpha: number;
    nItems: number | string;
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
    
    # DATA CLEANING: Clamp outliers to valid Likert range (1-5)
    # This prevents values like -5, 0, 10 from corrupting the analysis
    valid_min <- 1
    valid_max <- 5
    data <- pmax(pmin(raw_data, valid_max), valid_min)
    
    # Run Cronbach's Alpha with auto key checking for reversed items
    result <- alpha(data, check.keys = TRUE)
    
    # Extract item-total statistics - USE BUILT-IN VALUES (no manual for loop needed!)
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
        n_items = n_items,
        
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
        nItems: nItems,
        itemTotalStats: itemTotalStats,
        rCode: rCode
    };
}



/**
 * Run correlation analysis
 */
/**
 * Run correlation analysis
 */
export async function runCorrelation(data: number[][]): Promise<{
    correlationMatrix: number[][];
    pValues: number[][];
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

    # Use psych::corr.test for robust pairwise p-values and handling missing data
    # adjust = "none" matches standard SPSS / Excel output (unadjusted p-values)
    ct <- corr.test(df, use = "pairwise", method = "pearson", adjust = "none")

    list(
        correlation = as.vector(ct$r),
        p_values = as.vector(ct$p),
        n_cols = ncol(df)
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = parseWebRResult(jsResult);

    // Parse flat array to matrix
    const parseMatrix = (val: any, dim: number): number[][] => {
        if (!val || !Array.isArray(val)) return [];
        const matrix: number[][] = [];
        for (let i = 0; i < dim; i++) {
            matrix.push(val.slice(i * dim, (i + 1) * dim));
        }
        return matrix;
    };

    const numCols = getValue('n_cols')?.[0] || nCols;

    return {
        correlationMatrix: parseMatrix(getValue('correlation'), numCols),
        pValues: parseMatrix(getValue('p_values'), numCols),
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
    varTestP: number; // Variance homogeneity
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    group1 <- c(${group1.join(',')})
    group2 <- c(${group2.join(',')})
    
    # Levene's Test (Brown-Forsythe method - Median)
    # 1. Calculate medians
    med1 <- median(group1)
    med2 <- median(group2)
    
    # 2. Calculate absolute deviations
    z1 <- abs(group1 - med1)
    z2 <- abs(group2 - med2)
    
    # 3. ANOVA on deviations
    z_val <- c(z1, z2)
    g_fac <- factor(c(rep(1, length(z1)), rep(2, length(z2))))
    levene_test <- oneway.test(z_val ~ g_fac, var.equal = TRUE)
    levene_p <- levene_test$p.value
    
    var_equal <- levene_p > 0.05

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
        leveneP = levene_p
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
        varTestP: getValue('leveneP'), // Updated from varTestP
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
    rCode: string;
}> {
    const webR = await initWebR();

    const rCode = `
    before <- c(${before.join(',')})
    after <- c(${after.join(',')})

    result <- t.test(before, after, paired = TRUE)
    
    # Calculate Cohen's d for Paired Samples
    # d = MeanDiff / SD_diff
    diffs <- before - after
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
        effectSize = cohens_d
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
    assumptionCheckP: number; // Bartlett's test P-value
    rCode: string;
}> {
    const webR = await initWebR();

    // Build group data for R
    const groupData = groups.map((g, i) =>
        g.map(v => `c(${v}, ${i + 1})`).join(',')
    ).join(',');

    const rCode = `
    # Create data frame with values and group labels
    values <- c(${groups.map(g => g.join(',')).join(',')})
    groups <- factor(c(${groups.map((g, i) => g.map(() => i + 1).join(',')).join(',')}))
    
    # Assumption Check: Levene's Test (Brown-Forsythe - Median) for Homogeneity of Variance
    # Manual implementation since 'car' package might be heavy
    
    # 1. Calculate group medians
    group_medians <- tapply(values, groups, median)
    
    # 2. Calculate absolute deviations |x - median|
    # We map through groups
    deviations <- numeric(length(values))
    group_indices <- as.numeric(groups)
    
    for(i in 1:length(values)) {
        g_idx <- group_indices[i]
        deviations[i] <- abs(values[i] - group_medians[g_idx])
    }
    
    # 3. Run ANOVA on deviations
    levene_model <- aov(deviations ~ groups)
    levene_p <- summary(levene_model)[[1]][1, 5]
    
    # Run Main ANOVA
    model <- aov(values ~ groups)
    result <- summary(model)[[1]]
    
    # Calculate eta squared
    ssb <- result[1, 2] # Sum of squares between
    sst <- ssb + result[2, 2] # Total sum of squares
    etaSquared <- ssb / sst
    
    # Group means
    groupMeans <- tapply(values, groups, mean)

    list(
        F = result[1, 4],
        dfBetween = result[1, 1],
        dfWithin = result[2, 1],
        pValue = result[1, 5],
        groupMeans = as.numeric(groupMeans),
        grandMean = mean(values),
        etaSquared = etaSquared,
        bartlettP = levene_p
    )
    `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = parseWebRResult(jsResult);

    return {
        F: getValue('F')?.[0] || 0,
        dfBetween: getValue('dfBetween')?.[0] || 0,
        dfWithin: getValue('dfWithin')?.[0] || 0,
        pValue: getValue('pValue')?.[0] || 0,
        groupMeans: getValue('groupMeans') || [],
        grandMean: getValue('grandMean')?.[0] || 0,
        etaSquared: getValue('etaSquared')?.[0] || 0,
        assumptionCheckP: getValue('bartlettP')?.[0] || 0,
        rCode
    };
}

/**
 * Run Exploratory Factor Analysis (EFA)
 */
export async function runEFA(data: number[][], nFactors: number, rotation: string = 'varimax'): Promise<{
    kmo: number;
    bartlettP: number;
    loadings: number[][];
    communalities: number[];
    structure: number[][];
    eigenvalues: number[];
    nFactorsUsed: number;
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
    # Convert to dataframe to handle mixed checks easily, though matrix is fine
    df <- as.data.frame(raw_data)
    df_clean <- na.omit(df)
    # Also filter out Inf if any (simplistic check)
    df_clean <- df_clean[apply(df_clean, 1, function(x) all(is.finite(x))), ]

    if (nrow(df_clean) < ncol(df_clean)) {
        stop("Lỗi: Số lượng mẫu hợp lệ (sau khi loại bỏ NA) nhỏ hơn số lượng biến. Vui lòng kiểm tra dữ liệu trống (missing value) hoặc giảm bớt biến.")
    }
    if (nrow(df_clean) < 3) {
        stop("Quá ít dữ liệu hợp lệ để chạy phân tích.")
    }

    # 3. Calculate Correlation Matrix & Eigenvalues
    # Check for zero variance
    if (any(apply(df_clean, 2, sd) == 0)) {
        stop("Biến có phương sai bằng 0 (hằng số). Hãy loại bỏ biến này.")
    }

    cor_mat <- cor(df_clean)
    eigenvalues <- eigen(cor_mat)$values

    # 4. Determine Number of Factors (if auto)
    n_factors_run <- ${nFactors}
    if (n_factors_run <= 0) {
        n_factors_run <- sum(eigenvalues > 1)
        if (n_factors_run < 1) n_factors_run <- 1 # Fallback
    }

    # 5. KMO and Bartlett on Cleaned Data
    kmo_result <- tryCatch(KMO(df_clean), error = function(e) list(MSA = 0))
    bartlett_result <- tryCatch(cortest.bartlett(cor_mat, n = nrow(df_clean)), error = function(e) list(p.value = 1))
    
    # 6. Run EFA
    # fa() handles the correlation matrix or raw data. Raw data is better for scores but here we want loadings.
    # Using 'pa' (Principal Axis) and selected rotation.
    rotation_method <- "${rotation}"
    efa_result <- fa(df_clean, nfactors = n_factors_run, rotate = rotation_method, fm = "pa")

    list(
        kmo = if (is.numeric(kmo_result$MSA)) kmo_result$MSA[1] else 0,
        bartlett_p = bartlett_result$p.value,
        loadings = efa_result$loadings,
        communalities = efa_result$communalities,
        structure = efa_result$Structure,
        eigenvalues = eigenvalues,
        n_factors_used = n_factors_run
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
        stdError: number;
        tValue: number;
        pValue: number;
        vif?: number; // Added VIF
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

    list(
        coef_names = rownames(coefs),
        estimates = coefs[, 1],
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
 */
/**
 * Run Chi-Square Test of Independence
 * Expects data as an array of rows, each row has 2 values [cat1, cat2]
 */
export async function runChiSquare(data: any[][]): Promise<{
    statistic: number;
    df: number;
    pValue: number;
    observed: { data: number[][]; rows: string[]; cols: string[] };
    expected: { data: number[][]; rows: string[]; cols: string[] };
    cramersV: number; // Effect Size
    rCode: string;
}> {
    const webR = await initWebR();

    // Serialize data for R
    // We treat everything as string for categorical analysis
    // flatten
    const flatData = data.flat().map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    const nRows = data.length;

    const rCode = `
    # Create Data Frame
    raw_vec <- c(${flatData})
    df_raw <- matrix(raw_vec, nrow = ${nRows}, byrow = TRUE)
    
    # Create Table
    # table(RowVar, ColVar)
    tbl <- table(df_raw[,1], df_raw[,2])
    
    # Run Chi-Square
    # simulate.p.value=TRUE makes it robust for small samples, but standard is fine unless warning.
    # We'll use standard first.
    test <- chisq.test(tbl)
    
    # Calculate Cramer's V (Effect Size)
    chisq_val <- test$statistic
    n <- sum(tbl)
    k <- min(nrow(tbl), ncol(tbl))
    cramers_v <- 0
    # Formula: V = sqrt(chisq / (n * (min(r,c)-1)))
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




