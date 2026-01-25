import React, { useState } from 'react';
import { BarChart2, Shield, Network, Users, GitCompare, Layers, TrendingUp, Grid3x3, Activity, ChevronDown, ChevronRight, Star, Binary, FlaskConical, ArrowRightLeft, Target, CircleDot, Shuffle } from 'lucide-react';
import { PointBadge } from '@/components/ui/PointBadge';

interface AnalysisSelectorProps {
    onSelect: (step: string) => void;
    onRunAnalysis: (type: string) => void;
    isAnalyzing: boolean;
}

interface AnalysisOption {
    id: string;
    title: string;
    desc: string;
    icon: any;
    action: 'select' | 'run';
    recommended?: boolean;
    costType?: string; // Maps to analysis cost type
}

interface AnalysisCategory {
    name: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    options: AnalysisOption[];
}

export function AnalysisSelector({ onSelect, onRunAnalysis, isAnalyzing }: AnalysisSelectorProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['reliability', 'comparison']);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const categories: { id: string; category: AnalysisCategory }[] = [
        {
            id: 'reliability',
            category: {
                name: 'Reliability & Descriptive',
                description: 'Basic statistics and scale reliability',
                color: 'text-blue-700',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                options: [
                    { id: 'descriptive-select', title: 'Descriptive Statistics', desc: 'Mean, SD, Min, Max, Median, Skewness, Kurtosis', icon: BarChart2, action: 'select', costType: 'descriptive' },
                    { id: 'cronbach-select', title: "Cronbach's Alpha", desc: 'Classic scale reliability (α)', icon: Shield, action: 'select', recommended: true, costType: 'cronbach' },
                    { id: 'omega-select', title: "McDonald's Omega", desc: 'Modern reliability (ω) for better precision', icon: Shield, action: 'select', costType: 'cronbach' },
                ]
            }
        },
        {
            id: 'comparison',
            category: {
                name: 'Group Comparison',
                description: 'Compare means between groups',
                color: 'text-green-700',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                options: [
                    { id: 'ttest-select', title: 'Independent T-test', desc: 'Compare 2 independent groups', icon: GitCompare, action: 'select', costType: 'ttest-indep' },
                    { id: 'ttest-paired-select', title: 'Paired T-test', desc: 'Compare before-after (paired)', icon: Users, action: 'select', costType: 'ttest-paired' },
                    { id: 'anova-select', title: 'One-Way ANOVA / Welch', desc: 'Compare multiple groups', icon: Layers, action: 'select', costType: 'anova' },
                    { id: 'twoway-anova-select', title: 'Two-Way ANOVA', desc: 'Factorial ANOVA with interaction', icon: Grid3x3, action: 'select', costType: 'anova' },
                    { id: 'mannwhitney-select', title: 'Mann-Whitney U', desc: 'Non-parametric 2 groups', icon: Activity, action: 'select', costType: 'mann-whitney' },
                    { id: 'kruskalwallis-select', title: 'Kruskal-Wallis H', desc: 'Non-parametric multiple groups', icon: Layers, action: 'select', costType: 'anova' },
                    { id: 'wilcoxon-select', title: 'Wilcoxon Signed-Rank', desc: 'Non-parametric paired comparison', icon: ArrowRightLeft, action: 'select', costType: 'ttest-paired' },
                ]
            }
        },
        {
            id: 'relationship',
            category: {
                name: 'Correlation & Regression',
                description: 'Analyze relationships between variables',
                color: 'text-purple-700',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                options: [
                    { id: 'correlation', title: 'Correlation Matrix', desc: 'Pearson/Spearman correlation', icon: Network, action: 'run', costType: 'correlation' },
                    { id: 'regression-select', title: 'Linear Regression', desc: 'Multiple linear regression with β', icon: TrendingUp, action: 'select', costType: 'regression' },
                    { id: 'logistic-select', title: 'Logistic Regression', desc: 'Binary outcome prediction', icon: Binary, action: 'select', costType: 'regression' },
                    { id: 'mediation-select', title: 'Mediation Analysis', desc: 'Baron & Kenny + Sobel test', icon: Target, action: 'select', costType: 'regression' },
                    { id: 'moderation-select', title: 'Moderation Analysis', desc: 'Interaction effect with simple slopes', icon: Shuffle, action: 'select', costType: 'regression' },
                ]
            }
        },
        {
            id: 'factor',
            category: {
                name: 'Factor Analysis & SEM',
                description: 'EFA, CFA, SEM for measurement models',
                color: 'text-orange-700',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                options: [
                    { id: 'efa-select', title: 'EFA', desc: 'Exploratory Factor Analysis + Parallel Analysis', icon: Grid3x3, action: 'select', recommended: true, costType: 'efa' },
                    { id: 'cfa-select', title: 'CFA', desc: 'Confirmatory Factor Analysis', icon: Network, action: 'select', costType: 'cfa' },
                    { id: 'sem-select', title: 'SEM', desc: 'Structural Equation Modeling', icon: Layers, action: 'select', costType: 'sem' },
                ]
            }
        },
        {
            id: 'categorical',
            category: {
                name: 'Categorical Variables',
                description: 'Tests for categorical data',
                color: 'text-teal-700',
                bgColor: 'bg-teal-50',
                borderColor: 'border-teal-200',
                options: [
                    { id: 'chisq-select', title: 'Chi-Square Test', desc: 'Test of independence (Large sample)', icon: Grid3x3, action: 'select', costType: 'chisquare' },
                    { id: 'fisher-select', title: "Fisher's Exact Test", desc: 'Test of independence (Small sample)', icon: Grid3x3, action: 'select', costType: 'chisquare' },
                ]
            }
        },
        {
            id: 'clustering',
            category: {
                name: 'Clustering & Segmentation',
                description: 'Segment data into groups',
                color: 'text-pink-700',
                bgColor: 'bg-pink-50',
                borderColor: 'border-pink-200',
                options: [
                    { id: 'cluster-select', title: 'Cluster Analysis', desc: 'K-Means clustering with profiles', icon: CircleDot, action: 'select', costType: 'efa' },
                ]
            }
        }
    ];

    // Count total methods
    const totalMethods = categories.reduce((sum, cat) => sum + cat.category.options.length, 0);

    return (
        <div className="space-y-4">
            {/* Quick Stats */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <span className="px-2 py-1 bg-slate-100 rounded font-medium">{totalMethods} methods</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    Recommended
                </span>
            </div>

            {categories.map(({ id, category }) => {
                const isExpanded = expandedCategories.includes(id);

                return (
                    <div key={id} className={`rounded-xl border-2 ${category.borderColor} overflow-hidden transition-all`}>
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(id)}
                            className={`w-full px-5 py-4 flex items-center justify-between ${category.bgColor} hover:brightness-95 transition-all`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center ${category.color}`}>
                                    {id === 'reliability' && <Shield className="w-5 h-5" />}
                                    {id === 'comparison' && <GitCompare className="w-5 h-5" />}
                                    {id === 'relationship' && <Network className="w-5 h-5" />}
                                    {id === 'factor' && <Layers className="w-5 h-5" />}
                                    {id === 'categorical' && <Grid3x3 className="w-5 h-5" />}
                                    {id === 'clustering' && <CircleDot className="w-5 h-5" />}
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-semibold ${category.color}`}>{category.name}</h3>
                                    <p className="text-xs text-slate-500">{category.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{category.options.length} methods</span>
                                {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        </button>

                        {/* Category Content */}
                        {isExpanded && (
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-3">
                                {category.options.map((opt) => {
                                    const Icon = opt.icon;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => opt.action === 'run' ? onRunAnalysis(opt.id) : onSelect(opt.id)}
                                            disabled={isAnalyzing}
                                            className={`group relative p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-white hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {opt.recommended && (
                                                <div className="absolute -top-2 -right-2">
                                                    <Star className="w-5 h-5 text-amber-500 fill-current drop-shadow" />
                                                </div>
                                            )}
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 group-hover:scale-110 transition-transform shrink-0">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-slate-800 text-sm leading-tight">
                                                        {opt.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                        {opt.desc}
                                                    </p>
                                                    {opt.costType && (
                                                        <div className="mt-1.5">
                                                            <PointBadge analysisType={opt.costType} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
