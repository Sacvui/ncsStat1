'use client';

import { useEffect, useState } from 'react';
import { getAnalysisCost } from '@/lib/ncs-credits';

interface PointBadgeProps {
    analysisType: string;
    className?: string;
}

/**
 * Small badge showing NCS cost for an analysis method
 * Example: 🔷 500 NCS
 */
export function PointBadge({ analysisType, className = '' }: PointBadgeProps) {
    const [cost, setCost] = useState<number | null>(null);

    useEffect(() => {
        getAnalysisCost(analysisType).then(setCost);
    }, [analysisType]);

    if (cost === null || cost === 0) return null;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs 
                bg-gradient-to-r from-blue-50 to-indigo-50 
                text-blue-700 rounded-full font-medium
                border border-blue-200 shadow-sm ${className}`}
            title={`Chi phí: ${cost.toLocaleString()} NCS`}
        >
            <span className="text-blue-500">◆</span>
            {cost.toLocaleString()}
        </span>
    );
}

/**
 * Static badge for use in server components or when cost is known
 */
export function PointBadgeStatic({ cost, className = '' }: { cost: number; className?: string }) {
    if (cost === 0) return null;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs 
                bg-gradient-to-r from-blue-50 to-indigo-50 
                text-blue-700 rounded-full font-medium
                border border-blue-200 shadow-sm ${className}`}
        >
            <span className="text-blue-500">◆</span>
            {cost.toLocaleString()}
        </span>
    );
}

/**
 * Earned points indicator (green)
 */
export function EarnedBadge({ amount }: { amount: number }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs 
            bg-green-50 text-green-700 rounded-full font-medium border border-green-200">
            <span>+</span>
            {amount.toLocaleString()} NCS
        </span>
    );
}
