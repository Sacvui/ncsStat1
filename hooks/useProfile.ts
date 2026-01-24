'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/utils/supabase/client';

interface ProfileData {
    id: string;
    email: string;
    full_name: string;
    role: string;
    tokens: number;
    total_earned: number;
    total_spent: number;
    last_active: string;
}

interface UseProfileResult {
    profile: ProfileData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: ProfileData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for fetching and caching user profile data
 * Uses stale-while-revalidate pattern for optimal UX
 */
export function useProfile(userId: string | undefined): UseProfileResult {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        // Check cache first
        const cached = cache.get(userId);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            setProfile(cached.data);
            setIsLoading(false);
            return;
        }

        // Show stale data while revalidating
        if (cached) {
            setProfile(cached.data);
        }

        try {
            const supabase = getSupabase();
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, tokens, total_earned, total_spent, last_active')
                .eq('id', userId)
                .single();

            if (fetchError) {
                setError(fetchError.message);
            } else if (data) {
                const profileData = data as ProfileData;
                cache.set(userId, { data: profileData, timestamp: now });
                setProfile(profileData);
                setError(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return {
        profile,
        isLoading,
        error,
        refetch: fetchProfile,
    };
}

/**
 * Hook for token balance with cache
 */
export function useTokenBalance(userId: string | undefined) {
    const { profile, isLoading, refetch } = useProfile(userId);

    return {
        tokens: profile?.tokens ?? 0,
        totalEarned: profile?.total_earned ?? 0,
        totalSpent: profile?.total_spent ?? 0,
        isLoading,
        refetch,
    };
}

/**
 * Invalidate cache for a specific user (call after mutations)
 */
export function invalidateProfileCache(userId: string) {
    cache.delete(userId);
}
