'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Coins, TrendingUp, TrendingDown, Gift } from 'lucide-react';

interface TokenBalanceProps {
    compact?: boolean;
}

interface BalanceData {
    tokens: number;
    total_earned: number;
    total_spent: number;
}

export default function TokenBalance({ compact = false }: TokenBalanceProps) {
    const [balance, setBalance] = useState<BalanceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBalance() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('tokens, total_earned, total_spent')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setBalance(data);
                }
            }
            setLoading(false);
        }

        fetchBalance();
    }, []);

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
