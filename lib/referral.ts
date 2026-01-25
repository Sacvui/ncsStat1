/**
 * Referral System Library
 * Handles referral code generation, application, and rewards
 */

import { getSupabase } from '@/utils/supabase/client';
import { getReferralReward } from '@/lib/ncs-credits';

/**
 * Generate unique referral code for a user
 * Uses 8 random alphanumeric characters for uniqueness
 */
export function generateReferralCode(userId: string): string {
    // Use a combination of timestamp and random for uniqueness
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NCS-${timestamp}${random}`;
}

/**
 * Get or create referral code for user
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
    const supabase = getSupabase();

    // Check if user already has a code
    const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();

    if (profile?.referral_code) {
        return profile.referral_code;
    }

    // Generate new code
    const code = generateReferralCode(userId);

    // Save to profile
    await supabase
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', userId);

    return code;
}

/**
 * Apply referral code for new user
 * Returns referrer userId if successful
 */
export async function applyReferralCode(
    userId: string,
    referralCode: string
): Promise<{ success: boolean; error?: string; referrerId?: string }> {
    const supabase = getSupabase();

    // Get referral reward amount from config
    const referralReward = await getReferralReward();

    // Find referrer by code
    const { data: referrer, error: findError } = await supabase
        .from('profiles')
        .select('id, tokens, total_earned, referral_count')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

    if (findError || !referrer) {
        return { success: false, error: 'Mã giới thiệu không hợp lệ' };
    }

    // Check if user is trying to refer themselves
    if (referrer.id === userId) {
        return { success: false, error: 'Không thể sử dụng mã của chính mình' };
    }

    // Check if user was already referred
    const { data: currentUser } = await supabase
        .from('profiles')
        .select('referred_by, tokens, total_earned')
        .eq('id', userId)
        .single();

    if (currentUser?.referred_by) {
        return { success: false, error: 'Bạn đã sử dụng mã giới thiệu rồi' };
    }

    // Update new user with referrer info and reward
    const { error: updateNewUser } = await supabase
        .from('profiles')
        .update({
            referred_by: referralCode.toUpperCase(),
            tokens: (currentUser?.tokens || 0) + referralReward,
            total_earned: (currentUser?.total_earned || 0) + referralReward
        })
        .eq('id', userId);

    if (updateNewUser) {
        return { success: false, error: 'Lỗi cập nhật thông tin' };
    }

    // Reward referrer
    await supabase
        .from('profiles')
        .update({
            tokens: (referrer.tokens || 0) + referralReward,
            total_earned: (referrer.total_earned || 0) + referralReward,
            referral_count: (referrer.referral_count || 0) + 1
        })
        .eq('id', referrer.id);

    // Log transaction for both users
    await supabase.from('token_transactions').insert([
        {
            user_id: userId,
            amount: referralReward,
            type: 'referral_bonus',
            description: `Thưởng đăng ký qua mã giới thiệu`
        },
        {
            user_id: referrer.id,
            amount: referralReward,
            type: 'referral_reward',
            description: `Thưởng giới thiệu người dùng mới`
        }
    ]);

    return { success: true, referrerId: referrer.id };
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string): Promise<{
    referralCode: string;
    referralCount: number;
    totalEarned: number;
}> {
    const supabase = getSupabase();
    const referralReward = await getReferralReward();

    const { data } = await supabase
        .from('profiles')
        .select('referral_code, referral_count, total_earned')
        .eq('id', userId)
        .single();

    return {
        referralCode: data?.referral_code || '',
        referralCount: data?.referral_count || 0,
        totalEarned: (data?.referral_count || 0) * referralReward
    };
}

/**
 * Get list of users referred by this user
 */
export async function getReferredUsers(userId: string): Promise<Array<{
    email: string;
    createdAt: string;
}>> {
    const supabase = getSupabase();

    // First get user's referral code
    const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();

    if (!profile?.referral_code) return [];

    // Get users who used this code
    const { data: referred } = await supabase
        .from('profiles')
        .select('email, created_at')
        .eq('referred_by', profile.referral_code)
        .order('created_at', { ascending: false })
        .limit(10);

    return (referred || []).map((u: { email?: string; created_at: string }) => ({
        email: u.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        createdAt: u.created_at
    }));
}
