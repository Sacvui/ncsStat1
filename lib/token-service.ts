'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { POINTS_CONFIG, TransactionType } from './points-config';


// Record a token transaction
export async function recordTokenTransaction(
    userId: string,
    amount: number,
    type: TransactionType,
    description?: string,
    relatedId?: string
) {
    const supabase = await createClient();

    // Get current balance
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tokens, total_earned, total_spent')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return { error: profileError.message };
    }

    const currentBalance = profile?.tokens || 0;
    const newBalance = currentBalance + amount;

    // Check if user has enough tokens for spending
    if (amount < 0 && newBalance < 0) {
        return { error: 'Insufficient tokens', balance: currentBalance };
    }

    // Update profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            tokens: newBalance,
            total_earned: amount > 0 ? (profile?.total_earned || 0) + amount : profile?.total_earned,
            total_spent: amount < 0 ? (profile?.total_spent || 0) + Math.abs(amount) : profile?.total_spent,
            last_active: new Date().toISOString(),
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Error updating profile:', updateError);
        return { error: updateError.message };
    }

    // Insert transaction record
    const { data: transaction, error: txError } = await supabase
        .from('token_transactions')
        .insert({
            user_id: userId,
            amount,
            type,
            description,
            related_id: relatedId,
            balance_after: newBalance,
        })
        .select()
        .single();

    if (txError) {
        console.error('Error recording transaction:', txError);
        return { error: txError.message };
    }

    return {
        success: true,
        transaction,
        newBalance
    };
}

// Record a token transaction (Admin Version - Bypasses RLS)
export async function recordTokenTransactionAdmin(
    userId: string,
    amount: number,
    type: TransactionType,
    description?: string,
    relatedId?: string
) {
    const supabase = createAdminClient();

    // Get current balance
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tokens, total_earned, total_spent')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return { error: profileError.message };
    }

    const currentBalance = profile?.tokens || 0;
    const newBalance = currentBalance + amount;

    // Check if user has enough tokens for spending
    if (amount < 0 && newBalance < 0) {
        return { error: 'Insufficient tokens', balance: currentBalance };
    }

    // Update profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            tokens: newBalance,
            total_earned: amount > 0 ? (profile?.total_earned || 0) + amount : profile?.total_earned,
            total_spent: amount < 0 ? (profile?.total_spent || 0) + Math.abs(amount) : profile?.total_spent,
            last_active: new Date().toISOString(),
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Error updating profile:', updateError);
        return { error: updateError.message };
    }

    // Insert transaction record
    const { data: transaction, error: txError } = await supabase
        .from('token_transactions')
        .insert({
            user_id: userId,
            amount,
            type,
            description,
            related_id: relatedId,
            balance_after: newBalance,
        })
        .select()
        .single();

    if (txError) {
        console.error('Error recording transaction:', txError);
        return { error: txError.message };
    }

    return {
        success: true,
        transaction,
        newBalance
    };
}

// Get user's token balance
export async function getTokenBalance(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('tokens, total_earned, total_spent')
        .eq('id', userId)
        .single();

    if (error) {
        return { tokens: 0, total_earned: 0, total_spent: 0 };
    }

    return {
        tokens: data.tokens || 0,
        total_earned: data.total_earned || 0,
        total_spent: data.total_spent || 0,
    };
}

// Get user's transaction history
export async function getTransactionHistory(userId: string, limit = 20) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('token_transactions')
        .select('id, amount, type, description, created_at, balance_after')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return data;
}

// Log user activity
export async function logActivity(
    userId: string,
    actionType: string,
    details: Record<string, unknown> = {},
    pointsEarned = 0,
    pointsSpent = 0
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('activity_logs')
        .insert({
            user_id: userId,
            action_type: actionType,
            action_details: details,
            points_earned: pointsEarned,
            points_spent: pointsSpent,
        });

    if (error) {
        console.error('Error logging activity:', error);
    }

    // Update last_active
    await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', userId);
}

// Record login session
export async function recordLoginSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('user_sessions')
        .insert({
            user_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent,
        })
        .select()
        .single();

    if (error) {
        console.error('Error recording session:', error);
        return null;
    }

    // Log the login activity
    await logActivity(userId, 'login', { session_id: data.id });

    return data;
}

// Check and award daily login bonus
export async function checkDailyLoginBonus(userId: string) {
    const supabase = await createClient();

    // Check last login bonus
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: recentBonus } = await supabase
        .from('token_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'daily_bonus')
        .gte('created_at', today.toISOString())
        .limit(1);

    if (recentBonus && recentBonus.length > 0) {
        return { alreadyClaimed: true };
    }

    // Award daily bonus
    const result = await recordTokenTransaction(
        userId,
        POINTS_CONFIG.DAILY_LOGIN,
        'daily_bonus',
        'Daily login bonus'
    );

    return {
        awarded: true,
        points: POINTS_CONFIG.DAILY_LOGIN,
        ...result
    };
}

// Spend tokens for an action
export async function spendTokens(
    userId: string,
    actionType: 'analysis' | 'sem' | 'export' | 'ai',
    details?: string
) {
    const costMap = {
        analysis: POINTS_CONFIG.SPEND_BASIC_ANALYSIS,
        sem: POINTS_CONFIG.SPEND_SEM_CFA,
        export: POINTS_CONFIG.SPEND_EXPORT_PDF,
        ai: POINTS_CONFIG.SPEND_AI_INTERPRETATION,
    };

    const cost = costMap[actionType];
    const description = details || `Used tokens for ${actionType}`;

    const result = await recordTokenTransaction(
        userId,
        cost,
        `spend_${actionType}` as TransactionType,
        description
    );

    if (result.success) {
        await logActivity(userId, actionType, { cost }, 0, Math.abs(cost));
    }

    return result;
}
