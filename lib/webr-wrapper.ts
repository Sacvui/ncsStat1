// WebR Wrapper for R Statistical Analysis
import { WebR } from 'webr';

let webRInstance: WebR | null = null;
let isInitializing = false;

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

    try {
        webRInstance = new WebR({
            baseUrl: '/webr/',
            serviceWorkerUrl: '/webr-serviceworker.js'
        });

        await webRInstance.init();

        // Install required packages
        console.log('Installing R packages...');
        await webRInstance.installPackages(['psych', 'lavaan', 'corrplot']);
        console.log('R packages installed successfully');

        isInitializing = false;
        return webRInstance;
    } catch (error) {
        isInitializing = false;
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
 * Run Cronbach's Alpha analysis
 */
export async function runCronbachAlpha(data: number[][]): Promise<{
    alpha: number;
    rawAlpha: number;
    standardizedAlpha: number;
    itemStats: any;
}> {
    const webR = await initWebR();

    const rCode = `
    library(psych)
    data <- ${arrayToRMatrix(data)}
    result <- alpha(data)
    
    list(
      raw_alpha = result$total$raw_alpha,
      std_alpha = result$total$std.alpha,
      item_stats = result$item.stats
    )
  `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    return {
        alpha: jsResult.raw_alpha,
        rawAlpha: jsResult.raw_alpha,
        standardizedAlpha: jsResult.std_alpha,
        itemStats: jsResult.item_stats
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

    return {
        kmo: jsResult.kmo,
        bartlettP: jsResult.bartlett_p,
        loadings: jsResult.loadings,
        variance: jsResult.variance,
        communalities: jsResult.communalities
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

    const rCode = `
    library(psych)
    data <- ${arrayToRMatrix(data)}
    
    # Correlation with p-values
    result <- corr.test(data)
    
    list(
      correlation = result$r,
      p_values = result$p
    )
  `;

    const result = await webR.evalR(rCode);
    const jsResult = await result.toJs() as any;

    return {
        correlationMatrix: jsResult.correlation,
        pValues: jsResult.p_values
    };
}

/**
 * Run descriptive statistics
 */

function toArray(val: any): number[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object' && 'length' in val) return Array.from(val);
    if (typeof val === 'object') return Object.values(val) as number[];
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

    return {
        mean: toArray(jsResult.mean),
        sd: toArray(jsResult.sd),
        min: toArray(jsResult.min),
        max: toArray(jsResult.max),
        median: toArray(jsResult.median),
        N: jsResult.n
    };
}
