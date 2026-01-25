/**
 * NCS Credits Management Library
 * Handles credit balance checks, deductions, and configuration
 */

import { getSupabase } from '@/utils/supabase/client';

// Cache for analysis costs (avoid excessive DB calls)
let costCache: { data: Record<string, number>; expiresAt: number } | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Analysis types and their display names
 */
export const ANALYSIS_TYPES = {
    descriptive: 'Thống kê mô tả',
    cronbach: "Cronbach's Alpha",
    correlation: 'Tương quan',
    ttest: 'T-Test',
    'ttest-indep': 'Independent T-Test',
    'ttest-paired': 'Paired T-Test',
    anova: 'ANOVA',
    efa: 'EFA',
    cfa: 'CFA',
    sem: 'SEM',
    regression: 'Hồi quy',
    chisquare: 'Chi-Square',
    'mann-whitney': 'Mann-Whitney U',
    ai_explain: 'AI Giải thích',
    export_pdf: 'Xuất PDF'
} as const;

export type AnalysisType = keyof typeof ANALYSIS_TYPES;

/**
 * Get analysis costs from database (with caching)
 */
export async function getAnalysisCosts(): Promise<Record<string, number>> {
    // Check cache first
    if (costCache && Date.now() < costCache.expiresAt) {
        return costCache.data;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'analysis_costs')
        .single();

    if (error || !data) {
        console.warn('Failed to fetch analysis costs, using defaults');
        return getDefaultCosts();
    }

    const costs = typeof data.value === 'string'
        ? JSON.parse(data.value)
        : data.value;

    // Update cache
    costCache = {
        data: costs,
        expiresAt: Date.now() + CACHE_TTL
    };

    return costs;
}

/**
 * Get cost for a specific analysis type
 */
export async function getAnalysisCost(analysisType: string): Promise<number> {
    const costs = await getAnalysisCosts();
    return costs[analysisType] ?? 0;
}

/**
 * Get default NCS balance for new users
 */
export async function getDefaultBalance(): Promise<number> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'default_ncs_balance')
        .single();

    if (error || !data) {
        console.warn('Failed to fetch default balance, using 100000');
        return 100000;
    }

    return typeof data.value === 'number'
        ? data.value
        : parseInt(data.value as string) || 100000;
}

/**
 * Check if user has enough credits for an analysis
 */
export async function checkBalance(userId: string, cost: number): Promise<{
    hasEnough: boolean;
    currentBalance: number;
    required: number;
}> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error('Error checking balance:', error);
        return { hasEnough: false, currentBalance: 0, required: cost };
    }

    const currentBalance = data.tokens || 0;
    return {
        hasEnough: currentBalance >= cost,
        currentBalance,
        required: cost
    };
}

/**
 * Deduct credits from user balance
 * Returns true if successful, false if insufficient funds or error
 */
export async function deductCredits(
    userId: string,
    amount: number,
    reason: string,
    analysisType?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const supabase = getSupabase();

    // First check current balance
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('tokens, total_spent')
        .eq('id', userId)
        .single();

    if (fetchError || !profile) {
        return { success: false, newBalance: 0, error: 'Không thể lấy thông tin tài khoản' };
    }

    const currentBalance = profile.tokens || 0;
    if (currentBalance < amount) {
        return {
            success: false,
            newBalance: currentBalance,
            error: `Không đủ NCS. Cần ${amount.toLocaleString()}, hiện có ${currentBalance.toLocaleString()}`
        };
    }

    const newBalance = currentBalance - amount;
    const newTotalSpent = (profile.total_spent || 0) + amount;

    // Update balance
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            tokens: newBalance,
            total_spent: newTotalSpent,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Error deducting credits:', updateError);
        return { success: false, newBalance: currentBalance, error: 'Lỗi trừ điểm' };
    }

    // Log the transaction (non-blocking)
    supabase.from('token_transactions').insert({
        user_id: userId,
        amount: -amount,
        type: 'spend_analysis',
        description: reason,
        metadata: analysisType ? { analysis_type: analysisType } : {}
    }).then(() => { });

    return { success: true, newBalance };
}

/**
 * Get user's current NCS balance
 */
export async function getUserBalance(userId: string): Promise<number> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return 0;
    }

    return data.tokens || 0;
}

/**
 * Update analysis costs (admin only)
 */
export async function updateAnalysisCosts(costs: Record<string, number>): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
        .from('system_config')
        .upsert({
            key: 'analysis_costs',
            value: costs,
            updated_at: new Date().toISOString()
        });

    if (!error) {
        // Clear cache
        costCache = null;
    }

    return !error;
}

/**
 * Update default balance (admin only)
 */
export async function updateDefaultBalance(balance: number): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
        .from('system_config')
        .upsert({
            key: 'default_ncs_balance',
            value: balance,
            updated_at: new Date().toISOString()
        });

    return !error;
}

/**
 * Default costs (fallback if DB fails)
 */
function getDefaultCosts(): Record<string, number> {
    return {
        descriptive: 100,
        cronbach: 500,
        omega: 500, // Same as cronbach
        correlation: 300,
        ttest: 400,
        'ttest-indep': 400,
        'ttest-paired': 400,
        anova: 600,
        efa: 1000,
        cfa: 2000,
        sem: 3000,
        regression: 800,
        chisquare: 400,
        'mann-whitney': 400,
        ai_explain: 1500,
        export_pdf: 200
    };
}

/**
 * Clear cost cache (call when admin updates costs)
 */
export function clearCostCache(): void {
    costCache = null;
}

/**
 * Get referral reward amount from database
 */
export async function getReferralReward(): Promise<number> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'referral_reward')
        .single();

    if (error || !data) {
        console.warn('Failed to fetch referral reward, using 5000');
        return 5000;
    }

    return typeof data.value === 'number'
        ? data.value
        : parseInt(data.value as string) || 5000;
}

/**
 * Update referral reward amount (admin only)
 */
export async function updateReferralReward(amount: number): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
        .from('system_config')
        .upsert({
            key: 'referral_reward',
            value: amount,
            updated_at: new Date().toISOString()
        });

    return !error;
}
