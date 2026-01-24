'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/utils/supabase/client';
import { useTokenBalance as useTokenBalanceHook } from '@/hooks/useProfile';
import { Coins, TrendingUp, TrendingDown, Gift } from 'lucide-react';

interface TokenBalanceProps {
    compact?: boolean;
    userId?: string;
}

export default function TokenBalance({ compact = false, userId }: TokenBalanceProps) {
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(userId);

    // Get user ID if not provided
    useEffect(() => {
        if (!userId) {
            const supabase = getSupabase();
            supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
                if (user) setCurrentUserId(user.id);
            });
        }
    }, [userId]);

    const { tokens, totalEarned, totalSpent, isLoading } = useTokenBalanceHook(currentUserId);

    const balance = currentUserId ? { tokens, total_earned: totalEarned, total_spent: totalSpent } : null;
    const loading = isLoading;

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-24"></div>
        );
    }

    if (!balance) {
        return null;
    }

    if (compact) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full border border-amber-200">
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-800">{balance.tokens}</span>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-amber-800">Token Balance</h3>
                <Gift className="w-5 h-5 text-amber-500" />
            </div>

            <div className="flex items-baseline gap-1 mb-4">
                <Coins className="w-6 h-6 text-amber-600" />
                <span className="text-3xl font-bold text-amber-900">{balance.tokens}</span>
                <span className="text-sm text-amber-600">tokens</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-amber-200">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <div>
                        <div className="text-xs text-gray-500">Earned</div>
                        <div className="text-sm font-semibold text-green-600">+{balance.total_earned}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <div>
                        <div className="text-xs text-gray-500">Spent</div>
                        <div className="text-sm font-semibold text-red-500">-{balance.total_spent}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
