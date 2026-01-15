// WebR Wrapper for R Statistical Analysis
import { WebR } from 'webr';

let webRInstance: WebR | null = null;
let isInitializing = false;
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
 * Initialize WebR instance (singleton)
 */
export async function initWebR(): Promise<WebR> {
    if (webRInstance) {
        return webRInstance;
    }

    if (isInitializing) {
        // Wait for initialization to complete
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return webRInstance!;
    }

    isInitializing = true;
    updateProgress('Đang khởi tạo WebR...');

    try {
        webRInstance = new WebR({
            channelType: 1, // PostMessage channel
        });

        updateProgress('Đang tải R runtime...');
        await webRInstance.init();

        // Install required packages
        updateProgress('Đang cài đặt packages (psych, lavaan)...');
        await webRInstance.installPackages(['psych', 'lavaan', 'corrplot']);

        updateProgress('Sẵn sàng!');
        isInitializing = false;
        return webRInstance;
    } catch (error) {
        isInitializing = false;
        updateProgress('Lỗi khởi tạo!');
        throw new Error(`Failed to initialize WebR: ${error}`);
    }
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
}> {
    const webR = await initWebR();

    const rCode = `
    library(psych)
    data <- ${arrayToRMatrix(data)}
    result <- alpha(data)
    
    # Extract item-total statistics
    item_stats <- result$item.stats
    alpha_drop <- result$alpha.drop
    
    list(
      raw_alpha = result$total$raw_alpha,
      std_alpha = result$total$std.alpha,
      n_items = ncol(data),
      # Item-total statistics
      scale_mean_deleted = alpha_drop$mean,
      scale_var_deleted = alpha_drop$sd^2,
      corrected_item_total = item_stats$r.drop,
      alpha_if_deleted = alpha_drop$raw_alpha
    )
  `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;



    // WebR list parsing helper
    const getValue = (name: string): any => {
        if (!jsResult.names || !jsResult.values) return null;
        const idx = jsResult.names.indexOf(name);
        if (idx === -1) return null;
        const item = jsResult.values[idx];
        if (item && item.values) return item.values;
        return item;
    };

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
            itemName: `VAR${(i + 1).toString().padStart(2, '0')}`,
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
        itemTotalStats: itemTotalStats
    };
}

/**
 * Run Exploratory Factor Analysis (EFA)
 */
export async function runEFA(data: number[][], nfactors: number): Promise<{
    kmo: number;
    bartlettP: number;
    loadings: any;
    variance: any;
    communalities: any;
}> {
    const webR = await initWebR();

    const rCode = `
    library(psych)
    data <- ${arrayToRMatrix(data)}
    
    # KMO test
    kmo_result <- KMO(data)
    
    # Bartlett test
    bart_result <- cortest.bartlett(data)
    
    # EFA with varimax rotation
    efa_result <- fa(data, nfactors=${nfactors}, rotate="varimax", fm="ml")
    
    list(
      kmo = kmo_result$MSA,
      bartlett_p = bart_result$p.value,
      loadings = efa_result$loadings[],
      variance = efa_result$Vaccounted,
      communalities = efa_result$communality
    )
  `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = (name: string): any => {
        if (!jsResult.names || !jsResult.values) return null;
        const idx = jsResult.names.indexOf(name);
        if (idx === -1) return null;
        const item = jsResult.values[idx];
        if (item && item.values) return item.values;
        return item;
    };

    return {
        kmo: getValue('kmo')?.[0] || 0,
        bartlettP: getValue('bartlett_p')?.[0] || 0,
        loadings: getValue('loadings'),
        variance: getValue('variance'),
        communalities: getValue('communalities')
    };
}

/**
 * Run correlation analysis
 */
export async function runCorrelation(data: number[][]): Promise<{
    correlationMatrix: number[][];
    pValues: number[][];
}> {
    const webR = await initWebR();

    const nCols = data[0]?.length || 0;

    const rCode = `
    data <- ${arrayToRMatrix(data)}
    
    # Use base R cor() function - simpler and no row name issues
    n <- nrow(data)
    ncols <- ncol(data)
    
    # Correlation matrix
    corr_matrix <- cor(data, use="pairwise.complete.obs")
    
    # Calculate p-values manually using t-test formula
    p_matrix <- matrix(0, ncols, ncols)
    for (i in 1:ncols) {
      for (j in 1:ncols) {
        if (i == j) {
          p_matrix[i,j] <- 0
        } else {
          r <- corr_matrix[i,j]
          t_stat <- r * sqrt((n-2)/(1-r^2))
          p_matrix[i,j] <- 2 * pt(-abs(t_stat), df=n-2)
        }
      }
    }
    
    list(
      correlation = as.vector(corr_matrix),
      p_values = as.vector(p_matrix),
      n_cols = ncols
    )
  `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;



    const getValue = (name: string): any => {
        if (!jsResult.names || !jsResult.values) return null;
        const idx = jsResult.names.indexOf(name);
        if (idx === -1) return null;
        const item = jsResult.values[idx];
        if (item && item.values) return item.values;
        return item;
    };

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
        pValues: parseMatrix(getValue('p_values'), numCols)
    };
}

/**
 * Run descriptive statistics
 */

function toArray(val: any): number[] {
    if (!val) return [];
    // WebR often returns {values: [...]} structure
    if (typeof val === 'object' && val.values && Array.isArray(val.values)) {
        return val.values;
    }
    if (Array.isArray(val)) return val;
    if (typeof val === 'object' && 'length' in val) return Array.from(val);
    if (typeof val === 'object') {
        const values = Object.values(val);
        // If values are numbers, return them
        if (values.every(v => typeof v === 'number')) {
            return values as number[];
        }
        // If values are objects with 'values' property
        if (values.length > 0 && typeof values[0] === 'object') {
            return values.map((v: any) => v?.values?.[0] ?? v ?? 0) as number[];
        }
        return values as number[];
    }
    return [Number(val)];
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
    N: number;
}> {
    const webR = await initWebR();

    const rCode = `
    data <- ${arrayToRMatrix(data)}
    
    list(
      mean = colMeans(data, na.rm=TRUE),
      sd = apply(data, 2, sd, na.rm=TRUE),
      min = apply(data, 2, min, na.rm=TRUE),
      max = apply(data, 2, max, na.rm=TRUE),
      median = apply(data, 2, median, na.rm=TRUE),
      n = nrow(data)
    )
  `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;



    // WebR returns {type:'list', names:[...], values:[{type:'double', values:[...]}, ...]}
    // We need to extract values by index based on names array
    const getValue = (name: string): any => {
        if (!jsResult.names || !jsResult.values) return null;
        const idx = jsResult.names.indexOf(name);
        if (idx === -1) return null;
        const item = jsResult.values[idx];
        // Handle nested structure: {type: 'double', values: [...]}
        if (item && item.values) return item.values;
        return item;
    };

    const processed = {
        mean: getValue('mean') || [],
        sd: getValue('sd') || [],
        min: getValue('min') || [],
        max: getValue('max') || [],
        median: getValue('median') || [],
        N: (getValue('n') && getValue('n')[0]) || 0
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
}> {
    const webR = await initWebR();

    const rCode = `
    group1 <- c(${group1.join(',')})
    group2 <- c(${group2.join(',')})
    
    result <- t.test(group1, group2, var.equal = FALSE)
    
    # Cohen's d effect size
    pooledSD <- sqrt(((length(group1)-1)*sd(group1)^2 + (length(group2)-1)*sd(group2)^2) / (length(group1)+length(group2)-2))
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
      cohensD = cohensD
    )
  `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = (name: string): number => {
        if (!jsResult.names || !jsResult.values) return 0;
        const idx = jsResult.names.indexOf(name);
        if (idx === -1) return 0;
        const item = jsResult.values[idx];
        if (item && item.values) return item.values[0];
        return 0;
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
        effectSize: getValue('cohensD')
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
}> {
    const webR = await initWebR();

    const rCode = `
    before <- c(${before.join(',')})
    after <- c(${after.join(',')})
    
    result <- t.test(before, after, paired = TRUE)
    
    list(
      t = result$statistic,
      df = result$parameter,
      pValue = result$p.value,
      meanBefore = mean(before),
      meanAfter = mean(after),
      meanDiff = mean(before - after),
      ci95Lower = result$conf.int[1],
      ci95Upper = result$conf.int[2]
    )
  `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = (name: string): number => {
        if (!jsResult.names || !jsResult.values) return 0;
        const idx = jsResult.names.indexOf(name);
        if (idx === -1) return 0;
        const item = jsResult.values[idx];
        if (item && item.values) return item.values[0];
        return 0;
    };

    return {
        t: getValue('t'),
        df: getValue('df'),
        pValue: getValue('pValue'),
        meanBefore: getValue('meanBefore'),
        meanAfter: getValue('meanAfter'),
        meanDiff: getValue('meanDiff'),
        ci95Lower: getValue('ci95Lower'),
        ci95Upper: getValue('ci95Upper')
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
    
    # Run ANOVA
    model <- aov(values ~ groups)
    result <- summary(model)[[1]]
    
    # Calculate eta squared
    ssb <- result[1, 2]  # Sum of squares between
    sst <- ssb + result[2, 2]  # Total sum of squares
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
      etaSquared = etaSquared
    )
  `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    const getValue = (name: string): any => {
        if (!jsResult.names || !jsResult.values) return null;
        const idx = jsResult.names.indexOf(name);
        if (idx === -1) return null;
        const item = jsResult.values[idx];
        if (item && item.values) return item.values;
        return item;
    };

    return {
        F: getValue('F')?.[0] || 0,
        dfBetween: getValue('dfBetween')?.[0] || 0,
        dfWithin: getValue('dfWithin')?.[0] || 0,
        pValue: getValue('pValue')?.[0] || 0,
        groupMeans: getValue('groupMeans') || [],
        grandMean: getValue('grandMean')?.[0] || 0,
        etaSquared: getValue('etaSquared')?.[0] || 0
    };
}
