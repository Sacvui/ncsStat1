// Points configuration - separate file to avoid 'use server' export restrictions

export const POINTS_CONFIG = {
    SIGNUP_BONUS: 100,
    INVITE_SUCCESS: 50,
    SHARE_POST: 30,
    FEEDBACK: 20,
    DAILY_LOGIN: 5,
    SPEND_BASIC_ANALYSIS: -5,
    SPEND_SEM_CFA: -20,
    SPEND_EXPORT_PDF: -10,
    SPEND_AI_INTERPRETATION: -15,
} as const;

export type TransactionType =
    | 'signup_bonus'
    | 'earn_invite'
    | 'earn_share'
    | 'earn_feedback'
    | 'daily_bonus'
    | 'spend_analysis'
    | 'spend_sem'
    | 'spend_export'
    | 'spend_ai'
    | 'admin_adjust';
