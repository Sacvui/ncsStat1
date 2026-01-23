'use server';

import { createClient } from '@/utils/supabase/server';
import { recordTokenTransaction, POINTS_CONFIG } from './token-service';

// Get admin dashboard statistics
export async function getAdminDashboardStats() {
    const supabase = await createClient();

    // Total users
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // Active users in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: activeToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', oneDayAgo);

    // Active users in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', sevenDaysAgo);

    // Total tokens in circulation
    const { data: tokenStats } = await supabase
        .from('profiles')
        .select('tokens.sum(), total_earned.sum(), total_spent.sum()');

    // Total logins today
    const { count: loginsToday } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('login_at', oneDayAgo);

    // Total analyses performed
    const { count: totalAnalyses } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .in('action_type', ['analysis', 'sem', 'cfa', 'efa']);

    return {
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        activeWeek: activeWeek || 0,
        loginsToday: loginsToday || 0,
        totalAnalyses: totalAnalyses || 0,
        tokenStats: tokenStats?.[0] || { sum: 0 },
    };
}

// Get user activity chart data (logins per day)
export async function getUserActivityChart(days = 30) {
    const supabase = await createClient();

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
        .from('user_sessions')
        .select('login_at')
        .gte('login_at', startDate)
        .order('login_at', { ascending: true });

    // Group by date
    const groupedData: Record<string, number> = {};
    data?.forEach(session => {
        const date = new Date(session.login_at).toISOString().split('T')[0];
        groupedData[date] = (groupedData[date] || 0) + 1;
    });

    return Object.entries(groupedData).map(([date, count]) => ({
        date,
        logins: count,
    }));
}

// Get all users with pagination
export async function getAllUsers(page = 1, pageSize = 20, search?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('profiles')
        .select('id, email, full_name, role, tokens, total_earned, total_spent, last_active, created_at, referral_code', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error('Error fetching users:', error);
        return { users: [], total: 0, page, pageSize };
    }

    return {
        users: data || [],
        total: count || 0,
        page,
        pageSize,
    };
}

// Get detailed user info
export async function getUserDetails(userId: string) {
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        return null;
    }

    // Get recent activity
    const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    // Get recent transactions
    const { data: transactions } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    // Get session history
    const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('login_at', { ascending: false })
        .limit(10);

    // Get invitations
    const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('inviter_id', userId);

    return {
        profile,
        activities: activities || [],
        transactions: transactions || [],
        sessions: sessions || [],
        invitations: invitations || [],
    };
}

// Adjust user tokens (admin action)
export async function adjustUserTokens(
    userId: string,
    amount: number,
    reason: string
) {
    const supabase = await createClient();

    // Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (adminProfile?.role !== 'admin') {
        return { error: 'Not authorized' };
    }

    const result = await recordTokenTransaction(
        userId,
        amount,
        'admin_adjust',
        `Admin adjustment: ${reason}`
    );

    return result;
}

// Update user role
export async function updateUserRole(userId: string, role: 'user' | 'researcher' | 'admin') {
    const supabase = await createClient();

    // Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (adminProfile?.role !== 'admin') {
        return { error: 'Not authorized' };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

// Get invitation statistics
export async function getInvitationStats() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('invitations')
        .select('status, inviter_id, created_at');

    if (error) {
        return { total: 0, pending: 0, accepted: 0, conversionRate: 0 };
    }

    const total = data.length;
    const pending = data.filter(i => i.status === 'pending').length;
    const accepted = data.filter(i => i.status === 'accepted').length;

    return {
        total,
        pending,
        accepted,
        conversionRate: total > 0 ? (accepted / total * 100).toFixed(1) : 0,
    };
}

// Get top inviters
export async function getTopInviters(limit = 10) {
    const supabase = await createClient();

    const { data } = await supabase
        .from('invitations')
        .select('inviter_id, status')
        .eq('status', 'accepted');

    if (!data) return [];

    // Count invites per user
    const inviteCounts: Record<string, number> = {};
    data.forEach(inv => {
        inviteCounts[inv.inviter_id] = (inviteCounts[inv.inviter_id] || 0) + 1;
    });

    // Get top inviters
    const topIds = Object.entries(inviteCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

    if (topIds.length === 0) return [];

    // Get user details
    const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', topIds);

    return topIds.map(id => {
        const user = users?.find(u => u.id === id);
        return {
            id,
            email: user?.email || 'Unknown',
            full_name: user?.full_name || '',
            inviteCount: inviteCounts[id],
        };
    });
}

// Get activity breakdown
export async function getActivityBreakdown(days = 30) {
    const supabase = await createClient();

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
        .from('activity_logs')
        .select('action_type')
        .gte('created_at', startDate);

    if (!data) return [];

    // Count by action type
    const counts: Record<string, number> = {};
    data.forEach(log => {
        counts[log.action_type] = (counts[log.action_type] || 0) + 1;
    });

    return Object.entries(counts).map(([type, count]) => ({
        type,
        count,
    }));
}
