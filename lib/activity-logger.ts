/**
 * User Activity Logging Library
 * Tracks login/logout, feature usage, and time spent in app
 */

import { getSupabase } from '@/utils/supabase/client';

export type ActivityType = 'login' | 'logout' | 'analysis' | 'export' | 'page_view';

interface LogActivityParams {
    userId: string;
    actionType: ActivityType;
    details?: Record<string, any>;
    sessionId?: string;
}

/**
 * Log a user activity
 */
export async function logActivity({
    userId,
    actionType,
    details = {},
    sessionId
}: LogActivityParams): Promise<boolean> {
    const supabase = getSupabase();

    try {
        const { error } = await supabase
            .from('user_activity')
            .insert({
                user_id: userId,
                action_type: actionType,
                action_details: details,
                session_id: sessionId || generateSessionId()
            });

        if (error) {
            console.warn('Failed to log activity:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.warn('Activity logging error:', err);
        return false;
    }
}

/**
 * Log login event
 */
export async function logLogin(userId: string): Promise<void> {
    await logActivity({
        userId,
        actionType: 'login',
        details: {
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
            timestamp: new Date().toISOString()
        },
        sessionId: generateSessionId()
    });
}

/**
 * Log logout event with session duration
 */
export async function logLogout(userId: string, sessionStartTime?: Date): Promise<void> {
    const duration = sessionStartTime
        ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
        : 0;

    await logActivity({
        userId,
        actionType: 'logout',
        details: {
            duration_seconds: duration,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Log analysis usage
 */
export async function logAnalysisUsage(
    userId: string,
    analysisType: string,
    cost: number
): Promise<void> {
    await logActivity({
        userId,
        actionType: 'analysis',
        details: {
            analysis_type: analysisType,
            cost_ncs: cost,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Log export action
 */
export async function logExport(userId: string, exportType: string): Promise<void> {
    await logActivity({
        userId,
        actionType: 'export',
        details: {
            export_type: exportType,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Get activities for admin dashboard
 */
export async function getActivities(params: {
    fromDate?: Date;
    toDate?: Date;
    userRole?: string;
    actionType?: ActivityType;
    limit?: number;
    offset?: number;
}): Promise<{ data: any[]; count: number }> {
    const supabase = getSupabase();
    const { fromDate, toDate, actionType, limit = 50, offset = 0 } = params;

    let query = supabase
        .from('user_activity')
        .select(`
            *,
            profiles!user_activity_user_id_fkey(email, full_name, role, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
    }
    if (toDate) {
        query = query.lte('created_at', toDate.toISOString());
    }
    if (actionType) {
        query = query.eq('action_type', actionType);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Failed to fetch activities:', error);
        return { data: [], count: 0 };
    }

    return { data: data || [], count: count || 0 };
}

/**
 * Get activity summary statistics
 */
export async function getActivityStats(fromDate?: Date, toDate?: Date): Promise<{
    totalLogins: number;
    uniqueUsers: number;
    totalAnalyses: number;
    totalExports: number;
}> {
    const supabase = getSupabase();

    let query = supabase
        .from('user_activity')
        .select('action_type, user_id');

    if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
    }
    if (toDate) {
        query = query.lte('created_at', toDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data) {
        return { totalLogins: 0, uniqueUsers: 0, totalAnalyses: 0, totalExports: 0 };
    }

    const uniqueUserIds = new Set(data.map(d => d.user_id));

    return {
        totalLogins: data.filter(d => d.action_type === 'login').length,
        uniqueUsers: uniqueUserIds.size,
        totalAnalyses: data.filter(d => d.action_type === 'analysis').length,
        totalExports: data.filter(d => d.action_type === 'export').length
    };
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
