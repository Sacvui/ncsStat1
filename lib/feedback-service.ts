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
  DEMOGRAPHICS_DONE: 'ncs_demographics_done'
};

export const FeedbackService = {
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

  // Part 1: Demographics
  hasCompletedDemographics: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEYS.DEMOGRAPHICS_DONE);
  },

  saveDemographics: (data: DemographicData) => {
    const payload = {
      userId: FeedbackService.getUserId(),
      timestamp: new Date().toISOString(),
      ...data
    };
    
    // Save to local list
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMOGRAPHICS) || '[]');
    existing.push(payload);
    localStorage.setItem(STORAGE_KEYS.DEMOGRAPHICS, JSON.stringify(existing));
    
    // Mark as done
    localStorage.setItem(STORAGE_KEYS.DEMOGRAPHICS_DONE, 'true');
    
    // In a real app, you would send this to an API
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
