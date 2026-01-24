'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    BarChart2, Shield, Network, GitCompare, Layers, TrendingUp, Grid3x3,
    Activity, Binary, Target, ArrowRightLeft, Users, ChevronDown, ChevronRight,
    BookOpen, Code, ExternalLink
} from 'lucide-react';

interface Method {
    id: string;
    name: string;
    category: string;
    description: string;
    rFunction: string;
    whenToUse: string;
    assumptions?: string[];
    output: string[];
}

const METHODS: Method[] = [
    // Reliability & Descriptive
    {
        id: 'descriptive',
        name: 'Descriptive Statistics',
        category: 'Reliability & Descriptive',
        description: 'Calculate basic summary statistics for your data.',
        rFunction: 'psych::describe()',
        whenToUse: 'Always run first to understand data distribution and check for anomalies.',
        output: ['Mean, SD, Min, Max, Median', 'Skewness & Kurtosis', 'Missing value count']
    },
    {
        id: 'cronbach',
        name: "Cronbach's Alpha & McDonald's Omega",
        category: 'Reliability & Descriptive',
        description: "Assess internal consistency reliability of measurement scales.",
        rFunction: 'psych::alpha(), psych::omega()',
        whenToUse: 'When validating multi-item scales before further analysis.',
        assumptions: ['Items measure same construct', 'Likert-type scales'],
        output: ['Cronbach α coefficient', 'McDonald ω coefficient', 'Item-total correlations', 'Alpha if item deleted']
    },
    // Group Comparison
    {
        id: 'ttest',
        name: 'Independent Samples T-Test',
        category: 'Group Comparison',
        description: 'Compare means between two independent groups.',
        rFunction: 't.test(var.equal = FALSE)',
        whenToUse: 'Comparing two groups (e.g., male vs female, treatment vs control).',
        assumptions: ['Continuous dependent variable', 'Normal distribution or n > 30', 'Independent samples'],
        output: ['t-statistic, df, p-value', "Cohen's d effect size", "Welch's correction if variances unequal"]
    },
    {
        id: 'ttest-paired',
        name: 'Paired Samples T-Test',
        category: 'Group Comparison',
        description: 'Compare means for the same group at two time points.',
        rFunction: 't.test(paired = TRUE)',
        whenToUse: 'Before-after comparisons, matched pairs.',
        assumptions: ['Paired observations', 'Normal distribution of differences'],
        output: ['t-statistic, df, p-value', "Cohen's d effect size"]
    },
    {
        id: 'anova',
        name: 'One-Way ANOVA / Welch ANOVA',
        category: 'Group Comparison',
        description: 'Compare means across three or more groups.',
        rFunction: 'aov() or oneway.test()',
        whenToUse: 'Comparing multiple groups (e.g., education levels, age groups).',
        assumptions: ['Continuous DV', 'Normal distribution', 'Homogeneity of variance (Levene test)'],
        output: ['F-statistic, p-value', 'Eta-squared effect size', 'Auto-switch to Welch if Levene fails']
    },
    {
        id: 'mannwhitney',
        name: 'Mann-Whitney U Test',
        category: 'Group Comparison',
        description: 'Non-parametric alternative to independent t-test.',
        rFunction: 'wilcox.test()',
        whenToUse: 'When normality assumption is violated for 2-group comparison.',
        output: ['U-statistic, p-value', 'Rank-biserial correlation']
    },
    {
        id: 'kruskalwallis',
        name: 'Kruskal-Wallis H Test',
        category: 'Group Comparison',
        description: 'Non-parametric alternative to one-way ANOVA.',
        rFunction: 'kruskal.test()',
        whenToUse: 'Comparing 3+ groups when data is ordinal or not normally distributed.',
        output: ['H-statistic, p-value', 'Effect size (η²)']
    },
    {
        id: 'wilcoxon',
        name: 'Wilcoxon Signed-Rank Test',
        category: 'Group Comparison',
        description: 'Non-parametric alternative to paired t-test.',
        rFunction: 'wilcox.test(paired = TRUE)',
        whenToUse: 'Before-after comparison with non-normal differences.',
        output: ['V-statistic, p-value', 'Effect size (r)']
    },
    // Correlation & Regression
    {
        id: 'correlation',
        name: 'Correlation Matrix',
        category: 'Correlation & Regression',
        description: 'Examine relationships between continuous variables.',
        rFunction: 'cor(), psych::corr.test()',
        whenToUse: 'Exploring relationships before regression or SEM.',
        output: ['Pearson r coefficients', 'p-values', 'Heatmap visualization']
    },
    {
        id: 'regression',
        name: 'Multiple Linear Regression',
        category: 'Correlation & Regression',
        description: 'Predict continuous outcome from multiple predictors.',
        rFunction: 'lm(), scale()',
        whenToUse: 'Predicting continuous outcomes, testing hypotheses about predictors.',
        assumptions: ['Linearity', 'Normality of residuals', 'Homoscedasticity', 'No multicollinearity (VIF < 5)'],
        output: ['R², Adjusted R²', 'Unstandardized B coefficients', 'Standardized β coefficients', 'VIF values']
    },
    {
        id: 'logistic',
        name: 'Logistic Regression',
        category: 'Correlation & Regression',
        description: 'Predict binary outcomes from predictors.',
        rFunction: 'glm(family = binomial)',
        whenToUse: 'When outcome is binary (yes/no, pass/fail).',
        output: ['Odds ratios', 'Confidence intervals', 'Model accuracy', 'Pseudo R²']
    },
    {
        id: 'mediation',
        name: 'Mediation Analysis',
        category: 'Correlation & Regression',
        description: 'Test if variable M mediates effect of X on Y.',
        rFunction: 'Baron & Kenny method + Sobel test',
        whenToUse: 'Testing indirect effects and causal mechanisms.',
        output: ['Direct effect (c\')', 'Indirect effect (a×b)', 'Total effect (c)', 'Sobel z-test', 'Bootstrap CI']
    },
    // Factor Analysis & SEM
    {
        id: 'efa',
        name: 'Exploratory Factor Analysis (EFA)',
        category: 'Factor Analysis & SEM',
        description: 'Discover underlying factor structure in data.',
        rFunction: 'psych::fa(), psych::fa.parallel()',
        whenToUse: 'Developing new scales, exploring dimensionality.',
        assumptions: ['KMO > 0.7', 'Bartlett p < 0.05', 'Sufficient sample size'],
        output: ['Factor loadings', 'Eigenvalues', 'Parallel Analysis suggestion', 'Variance explained']
    },
    {
        id: 'cfa',
        name: 'Confirmatory Factor Analysis (CFA)',
        category: 'Factor Analysis & SEM',
        description: 'Test hypothesized factor structure.',
        rFunction: 'lavaan::cfa()',
        whenToUse: 'Validating measurement models, assessing construct validity.',
        output: ['Factor loadings', 'Model fit: CFI, TLI, RMSEA, SRMR', 'Modification indices']
    },
    {
        id: 'sem',
        name: 'Structural Equation Modeling (SEM)',
        category: 'Factor Analysis & SEM',
        description: 'Test complex relationships between latent variables.',
        rFunction: 'lavaan::sem()',
        whenToUse: 'Testing theoretical models with latent constructs.',
        output: ['Path coefficients', 'Model fit indices', 'Direct/indirect effects', 'R² for endogenous variables']
    },
    // Categorical
    {
        id: 'chisq',
        name: 'Chi-Square Test',
        category: 'Categorical',
        description: 'Test independence between categorical variables.',
        rFunction: 'chisq.test(), fisher.test()',
        whenToUse: 'Analyzing association between categorical variables.',
        assumptions: ['Expected cell count ≥ 5 (Fisher exact for small samples)'],
        output: ['χ² statistic, p-value', "Cramér's V effect size", 'Fisher exact for 2×2 tables']
    }
];

const CATEGORIES = [
    { name: 'Reliability & Descriptive', color: 'blue', icon: Shield },
    { name: 'Group Comparison', color: 'green', icon: GitCompare },
    { name: 'Correlation & Regression', color: 'purple', icon: TrendingUp },
    { name: 'Factor Analysis & SEM', color: 'orange', icon: Layers },
    { name: 'Categorical', color: 'teal', icon: Grid3x3 }
];

export default function DocsPage() {
    const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-6 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-8 h-8" />
                        <h1 className="text-3xl font-bold">ncsStat Documentation</h1>
                    </div>
                    <p className="text-white/80">
                        Complete guide to 18 statistical analysis methods for Vietnamese PhD researchers
                    </p>
                </div>
            </div>

            {/* Intro - Hai Rong Choi */}
            <div className="max-w-5xl mx-auto px-6 pt-10 pb-4">
                <div className="bg-white rounded-2xl p-8 border border-indigo-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            <span className="text-indigo-600">Hai Rong Choi</span> greets you.
                        </h3>
                        <div className="space-y-4 text-slate-700 leading-relaxed text-lg font-light">
                            <p>
                                Welcome to the sanctuary of rigorous analysis. This documentation is not merely a manual; it is a testament to the precision that defines <strong className="font-semibold text-slate-900">ncsStat</strong>.
                            </p>
                            <p>
                                Every function here has been battle-tested against standard academic benchmarks to ensure that your results are unassailable. Research is a lonely path, but here, you walk with certainty. Let us walk through the tools that will empower your thesis.
                            </p>
                        </div>
                    </div>
                    {/* Decorative Watermark */}
                    <div className="absolute -bottom-10 -right-10 text-slate-50 opacity-10 transform -rotate-12 pointer-events-none">
                        <Code className="w-64 h-64" />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Quick Links */}
                <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Quick Navigation</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {CATEGORIES.map(cat => (
                            <a
                                key={cat.name}
                                href={`#${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                className={`flex items-center gap-2 p-3 rounded-lg border hover:shadow-md transition-all text-sm
                                    ${cat.color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
                                    ${cat.color === 'green' ? 'bg-green-50 border-green-200 text-green-700' : ''}
                                    ${cat.color === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-700' : ''}
                                    ${cat.color === 'orange' ? 'bg-orange-50 border-orange-200 text-orange-700' : ''}
                                    ${cat.color === 'teal' ? 'bg-teal-50 border-teal-200 text-teal-700' : ''}
                                `}
                            >
                                <cat.icon className="w-4 h-4" />
                                <span className="font-medium">{cat.name}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Methods by Category */}
                {CATEGORIES.map(cat => (
                    <section key={cat.name} id={cat.name.toLowerCase().replace(/\s+/g, '-')} className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 flex items-center gap-2
                            ${cat.color === 'blue' ? 'text-blue-700' : ''}
                            ${cat.color === 'green' ? 'text-green-700' : ''}
                            ${cat.color === 'purple' ? 'text-purple-700' : ''}
                            ${cat.color === 'orange' ? 'text-orange-700' : ''}
                            ${cat.color === 'teal' ? 'text-teal-700' : ''}
                        `}>
                            <cat.icon className="w-6 h-6" />
                            {cat.name}
                        </h2>

                        <div className="space-y-3">
                            {METHODS.filter(m => m.category === cat.name).map(method => (
                                <div
                                    key={method.id}
                                    className="bg-white rounded-lg border shadow-sm overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedMethod(
                                            expandedMethod === method.id ? null : method.id
                                        )}
                                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="text-left">
                                            <h3 className="font-semibold text-slate-800">{method.name}</h3>
                                            <p className="text-sm text-slate-500">{method.description}</p>
                                        </div>
                                        {expandedMethod === method.id ? (
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>

                                    {expandedMethod === method.id && (
                                        <div className="px-5 pb-5 border-t bg-slate-50">
                                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <h4 className="font-medium text-slate-700 mb-2">When to Use</h4>
                                                    <p className="text-sm text-slate-600">{method.whenToUse}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                                                        <Code className="w-4 h-4" />
                                                        R Function
                                                    </h4>
                                                    <code className="text-sm bg-slate-800 text-green-400 px-2 py-1 rounded">
                                                        {method.rFunction}
                                                    </code>
                                                </div>
                                            </div>

                                            {method.assumptions && (
                                                <div className="mt-4">
                                                    <h4 className="font-medium text-slate-700 mb-2">Assumptions</h4>
                                                    <ul className="text-sm text-slate-600 list-disc list-inside">
                                                        {method.assumptions.map((a, i) => (
                                                            <li key={i}>{a}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="mt-4">
                                                <h4 className="font-medium text-slate-700 mb-2">Output</h4>
                                                <ul className="text-sm text-slate-600 list-disc list-inside">
                                                    {method.output.map((o, i) => (
                                                        <li key={i}>{o}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {/* Footer */}
                <div className="mt-12 text-center text-sm text-slate-500 pb-8">
                    <p>
                        <strong>ncsStat</strong> - Professional statistical analysis for Vietnamese PhD researchers
                    </p>
                    <p className="mt-1">
                        Built with WebR (R in browser) • No data uploaded to server •
                        <Link href="/analyze" className="text-indigo-600 hover:underline ml-1">
                            Start Analyzing →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
