export type AnalysisStep = 'upload' | 'profile' | 'analyze' | 'results' | 'cronbach-select' | 'cronbach-batch-select' | 'ttest-select' | 'ttest-paired-select' | 'anova-select' | 'efa-select' | 'regression-select' | 'cfa-select' | 'sem-select' | 'chisq-select' | 'mannwhitney-select' | 'descriptive-select';

// Workflow Mode Types
export interface WorkflowStep {
    type: string;
    timestamp: number;
    variables: string[];
    results: any;
}

export interface PreviousAnalysisData {
    type: 'cronbach' | 'efa' | 'cfa';
    variables: string[];
    factors?: { name: string; indicators: string[] }[];
    goodItems?: string[];
    results: any;
}
