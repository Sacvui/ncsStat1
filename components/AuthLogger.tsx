'use client';

import { useEffect, useRef } from 'react';
import { getSupabase } from '@/utils/supabase/client';
import { logLogin, logLogout } from '@/lib/activity-logger';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

export function AuthLogger() {
    // Refs to track state without triggering re-renders
    const lastUserRef = useRef<string | null>(null);
    const sessionStartRef = useRef<Date | null>(null);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        const supabase = getSupabase();

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            if (session?.user) {
                lastUserRef.current = session.user.id;
                sessionStartRef.current = new Date();
                // Log login on initial app load if session exists? 
                // Mostly meaningful if we want to track "visits".
                // But typically "Login" event is when they actually sign in.
                // Let's rely on onAuthStateChange for explicit sign-ins/outs
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            const userId = session?.user?.id;
            const lastUserId = lastUserRef.current;

            if (event === 'SIGNED_IN' && userId && userId !== lastUserId) {
                // User explicitly signed in
                await logLogin(userId);
                lastUserRef.current = userId;
                sessionStartRef.current = new Date();
            } else if (event === 'SIGNED_OUT' && lastUserId) {
                // User signed out
                await logLogout(lastUserId, sessionStartRef.current || undefined);
                lastUserRef.current = null;
                sessionStartRef.current = null;
            } else if (event === 'INITIAL_SESSION' && userId) {
                // If we want to track every app open as a "login" (session start)
                if (userId !== lastUserId) {
                    await logLogin(userId);
                    lastUserRef.current = userId;
                    sessionStartRef.current = new Date();
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return null; // This component renders nothing
}
