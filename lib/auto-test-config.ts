/**
 * Auto Test Configuration
 * Pre-configured settings for automated testing of all statistical analyses
 */

// Scale definitions for test_data_sem_cfa.csv
export interface ScaleDefinition {
    name: string;
    items: string[];
    likertMin: number;
    likertMax: number;
}

export interface AnalysisConfig {
    id: string;
    name: string;
    description: string;
    ncsCost: number; // Points cost for this analysis
    enabled: boolean;
}

export interface CFAModelDefinition {
    syntax: string;
    description: string;
}

export interface SEMModelDefinition {
    measurementModel: string;
    structuralModel: string;
    description: string;
}

// Test data scales (8 constructs × 5 items)
export const TEST_DATA_SCALES: ScaleDefinition[] = [
    {
        name: 'SAT (Satisfaction)',
        items: ['SAT1', 'SAT2', 'SAT3', 'SAT4', 'SAT5'],
        likertMin: 1,
        likertMax: 5
    },
    {
        name: 'TRUST (Trust)',
        items: ['TRUST1', 'TRUST2', 'TRUST3', 'TRUST4', 'TRUST5'],
        likertMin: 1,
        likertMax: 5
    },
    {
        name: 'QUAL (Quality)',
        items: ['QUAL1', 'QUAL2', 'QUAL3', 'QUAL4', 'QUAL5'],
        likertMin: 1,
        likertMax: 5
    },
    {
        name: 'VAL (Value)',
        items: ['VAL1', 'VAL2', 'VAL3', 'VAL4', 'VAL5'],
        likertMin: 1,
        likertMax: 5
    },
    {
        name: 'LOY (Loyalty)',
        items: ['LOY1', 'LOY2', 'LOY3', 'LOY4', 'LOY5'],
        likertMin: 1,
        likertMax: 5
    },
    {
        name: 'COM (Commitment)',
        items: ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'],
        likertMin: 1,
        likertMax: 5
    },
    {
        name: 'IMG (Image)',
        items: ['IMG1', 'IMG2', 'IMG3', 'IMG4', 'IMG5'],
        likertMin: 1,
        likertMax: 5
    },
    {
        name: 'EXP (Experience)',
        items: ['EXP1', 'EXP2', 'EXP3', 'EXP4', 'EXP5'],
        likertMin: 1,
        likertMax: 5
    }
];

// All 18 analysis methods with default costs
export const ANALYSIS_CONFIGS: AnalysisConfig[] = [
    // Reliability & Descriptive (2)
    { id: 'descriptive', name: 'Descriptive Statistics', description: 'Mean, SD, Skewness, Kurtosis', ncsCost: 100, enabled: true },
    { id: 'cronbach', name: "Cronbach's Alpha & Omega", description: 'Scale reliability analysis', ncsCost: 200, enabled: true },

    // Group Comparison (6)
    { id: 'ttest', name: 'Independent T-Test', description: 'Compare 2 independent groups', ncsCost: 150, enabled: true },
    { id: 'ttest-paired', name: 'Paired T-Test', description: 'Before-after comparison', ncsCost: 150, enabled: true },
    { id: 'anova', name: 'ANOVA / Welch', description: 'Compare multiple groups', ncsCost: 200, enabled: true },
    { id: 'mannwhitney', name: 'Mann-Whitney U', description: 'Non-parametric 2 groups', ncsCost: 150, enabled: true },
    { id: 'kruskalwallis', name: 'Kruskal-Wallis H', description: 'Non-parametric multiple groups', ncsCost: 200, enabled: true },
    { id: 'wilcoxon', name: 'Wilcoxon Signed-Rank', description: 'Non-parametric paired', ncsCost: 150, enabled: true },

    // Correlation & Regression (4)
    { id: 'correlation', name: 'Correlation Matrix', description: 'Pearson/Spearman correlation', ncsCost: 200, enabled: true },
    { id: 'regression', name: 'Linear Regression', description: 'Multiple regression with β', ncsCost: 300, enabled: true },
    { id: 'logistic', name: 'Logistic Regression', description: 'Binary outcome prediction', ncsCost: 350, enabled: true },
    { id: 'mediation', name: 'Mediation Analysis', description: 'Baron & Kenny + Sobel', ncsCost: 400, enabled: true },

    // Factor Analysis & SEM (3)
    { id: 'efa', name: 'EFA', description: 'Exploratory Factor Analysis', ncsCost: 400, enabled: true },
    { id: 'cfa', name: 'CFA', description: 'Confirmatory Factor Analysis', ncsCost: 500, enabled: true },
    { id: 'sem', name: 'SEM', description: 'Structural Equation Modeling', ncsCost: 600, enabled: true },

    // Categorical (1)
    { id: 'chisq', name: 'Chi-Square Test', description: 'Independence + Fisher exact', ncsCost: 150, enabled: true },
];

// Pre-configured CFA model for test data
export const DEFAULT_CFA_MODEL: CFAModelDefinition = {
    syntax: `SAT =~ SAT1 + SAT2 + SAT3 + SAT4 + SAT5
TRUST =~ TRUST1 + TRUST2 + TRUST3 + TRUST4 + TRUST5
QUAL =~ QUAL1 + QUAL2 + QUAL3 + QUAL4 + QUAL5
VAL =~ VAL1 + VAL2 + VAL3 + VAL4 + VAL5
LOY =~ LOY1 + LOY2 + LOY3 + LOY4 + LOY5
COM =~ COM1 + COM2 + COM3 + COM4 + COM5
IMG =~ IMG1 + IMG2 + IMG3 + IMG4 + IMG5
EXP =~ EXP1 + EXP2 + EXP3 + EXP4 + EXP5`,
    description: '8-factor measurement model with 5 indicators each'
};

// Pre-configured SEM model for test data
export const DEFAULT_SEM_MODEL: SEMModelDefinition = {
    measurementModel: DEFAULT_CFA_MODEL.syntax,
    structuralModel: `# Structural relationships
LOY ~ SAT + TRUST + VAL
SAT ~ QUAL + EXP + IMG
TRUST ~ QUAL + COM
VAL ~ QUAL + IMG`,
    description: 'Customer Loyalty Model: Quality/Experience/Image → Satisfaction → Loyalty'
};

// EFA configuration
export const DEFAULT_EFA_CONFIG = {
    variables: TEST_DATA_SCALES.flatMap(s => s.items), // All 40 items
    rotation: 'promax' as const,
    nFactors: 8,
    useFAMethod: 'ml' as const // Maximum Likelihood
};

// Regression configuration (example)
export const DEFAULT_REGRESSION_CONFIG = {
    dependent: 'LOY1', // Will be computed as composite
    independents: ['SAT1', 'TRUST1', 'QUAL1'] // Simplified
};

// Mediation configuration
export const DEFAULT_MEDIATION_CONFIG = {
    x: 'QUAL1', // Predictor
    m: 'SAT1',  // Mediator
    y: 'LOY1',  // Outcome
    covariates: [] as string[]
};

// Auto Test execution order (scientific workflow)
export const AUTO_TEST_WORKFLOW = [
    'descriptive',  // 1. Data overview
    'cronbach',     // 2. Reliability
    'efa',          // 3. Exploratory analysis
    'cfa',          // 4. Confirmatory analysis
    'correlation',  // 5. Relationship exploration
    'regression',   // 6. Predictive modeling
    'sem'           // 7. Full structural model
];

// Function to get all items as flat array
export function getAllItems(): string[] {
    return TEST_DATA_SCALES.flatMap(scale => scale.items);
}

// Function to get scale by name
export function getScaleByName(name: string): ScaleDefinition | undefined {
    return TEST_DATA_SCALES.find(s => s.name.includes(name));
}

// Default NCS points for new users
export const DEFAULT_USER_NCS_POINTS = 100000;

// Referral bonus configuration
export const REFERRAL_CONFIG = {
    bonusForReferrer: 5000,  // Points given to referrer
    bonusForReferred: 2000,  // Points given to new user
    minPointsToRefer: 1000   // Minimum points needed to generate referral
};
