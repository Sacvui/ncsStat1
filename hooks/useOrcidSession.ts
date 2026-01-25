'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/utils/supabase/client';

interface OrcidUser {
    id: string;
    orcid_id: string;
    full_name: string | null;
    email: string | null;
    tokens?: number;
}

/**
 * Get ORCID user from cookie
 */
export function getOrcidUserFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'orcid_user') {
            return decodeURIComponent(value);
        }
    }
    return null;
}

/**
 * Hook to get ORCID user profile from cookie
 */
export function useOrcidUser() {
    const [orcidUser, setOrcidUser] = useState<OrcidUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrcidUser = async () => {
            const userId = getOrcidUserFromCookie();

            if (!userId) {
                setIsLoading(false);
                return;
            }

            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('profiles')
                .select('id, orcid_id, full_name, email, tokens')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setOrcidUser(data as OrcidUser);
            }
            setIsLoading(false);
        };

        fetchOrcidUser();
    }, []);

    return { orcidUser, isLoading };
}

/**
 * Clear ORCID session cookie
 */
export function clearOrcidSession() {
    if (typeof document !== 'undefined') {
        document.cookie = 'orcid_user=; Max-Age=0; path=/';
        document.cookie = 'orcid_pending=; Max-Age=0; path=/';
    }
}

/**
 * Check if user is logged in via ORCID
 */
export function isOrcidLoggedIn(): boolean {
    return getOrcidUserFromCookie() !== null;
}
