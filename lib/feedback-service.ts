import { v4 as uuidv4 } from 'uuid';

// Types for the feedback forms
export interface DemographicData {
    education: string;
    role: string;
    experience: string;
    publication: string;
}

export interface AIFeedbackData {
    accuracy: string;
    formatting: number; // Likert 1-5
    statisticalSignificance: string; // Knowledge check
    testType?: string; // e.g. "SEM", "T-test"
}

export interface ApplicabilityData {
    manuscriptUtility: string;
    timeSavings: string;
    dataSovereignty: string;
    openFeedback: string;
}

const STORAGE_KEYS = {
    USER_ID: 'ncs_user_id',
    DEMOGRAPHICS: 'ncs_feedback_demographics',
    AI_FEEDBACK: 'ncs_feedback_ai',
    APPLICABILITY: 'ncs_feedback_applicability',
    DEMOGRAPHICS_DONE: 'ncs_demographics_done',
    HAS_GIVEN_AI_FEEDBACK: 'ncs_has_given_ai_feedback',
    HAS_GIVEN_APPLICABILITY_FEEDBACK: 'ncs_has_given_applicability_feedback',
    GAS_URL: 'ncs_gas_url'
};

export const FeedbackService = {
    // Config
    setGASUrl: (url: string) => {
        localStorage.setItem(STORAGE_KEYS.GAS_URL, url);
    },

    getGASUrl: () => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
    },

    // Helper to send to Google Sheets
    sendToGoogleSheets: async (data: any) => {
        const url = FeedbackService.getGASUrl();
        if (!url) return; // No config, skip

        try {
            // fetch 'no-cors' mode is needed for opaque response from GAS
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            console.log('[Feedback] Sent to Google Sheets');
        } catch (err) {
            console.error('[Feedback] Google Sheets Sync Error:', err);
        }
    },

    // Get or create a persistent anonymous User ID
    getUserId: (): string => {
        if (typeof window === 'undefined') return '';
        let uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (!uid) {
            uid = uuidv4();
            localStorage.setItem(STORAGE_KEYS.USER_ID, uid);
        }
        return uid;
    },



    // Helper to send to Supabase
    saveToSupabase: async (type: string, data: any) => {
        try {
            const { getSupabase } = await import('@/utils/supabase/client');
            const supabase = getSupabase();

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.warn('[Feedback] No authenticated user found for Supabase sync');
                return;
            }

            let content = '';
            let rating = null;

            // Map fields based on type
            if (type === 'demographics') {
                content = `Role: ${data.role}, Exp: ${data.experience}`;
            } else if (type === 'ai_feedback') {
                content = `Type: ${data.testType}, Accuracy: ${data.accuracy}`;
                rating = data.formatting; // Assuming formatting is 1-5
            } else if (type === 'applicability') {
                content = data.openFeedback || data.manuscriptUtility;
            }

            const { error } = await supabase.from('feedback').insert({
                user_id: user.id,
                type,
                content: content.substring(0, 500), // Truncate if needed
                rating,
                details: data
            });

            if (error) {
                console.error('[Feedback] Supabase Insert Error:', error.message, error.details, error.hint);
            } else {
                console.log('[Feedback] Saved to Supabase');
            }
        } catch (err) {
            console.error('[Feedback] Supabase Sync Unexpected Error:', err);
        }
    },

    // Part 1: Demographics
    hasCompletedDemographics: (): boolean => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(STORAGE_KEYS.DEMOGRAPHICS_DONE);
    },

    // Check if user has already given AI feedback (for suppression)
    hasGivenAIFeedback: (): boolean => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(STORAGE_KEYS.HAS_GIVEN_AI_FEEDBACK);
    },

    // Check if user has already given Applicability feedback (for suppression)
    hasGivenApplicabilityFeedback: (): boolean => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(STORAGE_KEYS.HAS_GIVEN_APPLICABILITY_FEEDBACK);
    },

    saveDemographics: (data: DemographicData) => {
        const payload = {
            userId: FeedbackService.getUserId(), // Local anonymous ID
            timestamp: new Date().toISOString(),
            ...data
        };

        // Save to local list
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMOGRAPHICS) || '[]');
        existing.push(payload);
        localStorage.setItem(STORAGE_KEYS.DEMOGRAPHICS, JSON.stringify(existing));

        // Mark as done
        localStorage.setItem(STORAGE_KEYS.DEMOGRAPHICS_DONE, 'true');

        // Sync to Cloud
        FeedbackService.sendToGoogleSheets(payload);
        FeedbackService.saveToSupabase('demographics', data);

        console.log('[Feedback] Saved Demographics:', payload);
    },

    // Part 2: AI Interpretation
    saveAIFeedback: (data: AIFeedbackData) => {
        const payload = {
            userId: FeedbackService.getUserId(),
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            ...data
        };

        const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_FEEDBACK) || '[]');
        existing.push(payload);
        localStorage.setItem(STORAGE_KEYS.AI_FEEDBACK, JSON.stringify(existing));

        // Mark as done for suppression
        localStorage.setItem(STORAGE_KEYS.HAS_GIVEN_AI_FEEDBACK, 'true');


        // Sync to Cloud
        FeedbackService.sendToGoogleSheets(payload);
        FeedbackService.saveToSupabase('ai_feedback', data);

        console.log('[Feedback] Saved AI Feedback:', payload);
    },

    // Part 3: Applicability
    saveApplicability: (data: ApplicabilityData) => {
        const payload = {
            userId: FeedbackService.getUserId(),
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            ...data
        };

        const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICABILITY) || '[]');
        existing.push(payload);
        localStorage.setItem(STORAGE_KEYS.APPLICABILITY, JSON.stringify(existing));

        // Mark as done for suppression
        localStorage.setItem(STORAGE_KEYS.HAS_GIVEN_APPLICABILITY_FEEDBACK, 'true');


        // Sync to Cloud
        FeedbackService.sendToGoogleSheets(payload);
        FeedbackService.saveToSupabase('applicability', data);

        console.log('[Feedback] Saved Applicability Feedback:', payload);
    },

    // Export all data (for the developer/user to retrieve)
    exportAllData: () => {
        const data = {
            demographics: JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMOGRAPHICS) || '[]'),
            aiFeedback: JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_FEEDBACK) || '[]'),
            applicability: JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICABILITY) || '[]'),
        };
        return data;
    }
};
