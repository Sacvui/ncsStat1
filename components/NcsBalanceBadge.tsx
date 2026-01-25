'use client';

import { Coins } from 'lucide-react';

interface NcsBalanceBadgeProps {
    balance: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function NcsBalanceBadge({ balance, showLabel = true, size = 'md' }: NcsBalanceBadgeProps) {
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5'
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const formatBalance = (value: number) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toLocaleString();
    };

    return (
        <div
            className={`
                inline-flex items-center gap-1.5 
                bg-gradient-to-r from-amber-50 to-yellow-50 
                border border-amber-200 rounded-full 
                font-semibold text-amber-700
                ${sizeClasses[size]}
            `}
            title={`${balance.toLocaleString()} NCS Credits`}
        >
            <Coins className={`${iconSizes[size]} text-amber-500`} />
            <span>{formatBalance(balance)}</span>
            {showLabel && <span className="text-amber-500/70">NCS</span>}
        </div>
    );
}
