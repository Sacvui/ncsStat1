/**
 * AI Explainer using Gemini API
 */

export interface ExplanationRequest {
    analysisType: string;
    results: any;
    context?: string;
}

export interface ExplanationResponse {
    explanation: string;
    interpretation: string;
    academicWriting: string;
}

/**
 * Explain statistical results using AI
 */
export async function explainResults(
    analysisType: string,
    results: any,
    context: string = '',
    apiKey: string
): Promise<ExplanationResponse> {
    try {
        const response = await fetch('/api/ai-explain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-gemini-api-key': apiKey
            },
            body: JSON.stringify({
                analysisType,
                results,
                context
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to get AI explanation:', error);
        throw error;
    }
}

/**
 * Suggest appropriate analysis method based on research description
 */
export async function suggestAnalysisMethod(
    researchDescription: string,
    dataDescription: string,
    apiKey: string
): Promise<{
    suggestedMethod: string;
    reasoning: string;
    alternatives: string[];
}> {
    try {
        const response = await fetch('/api/ai-suggest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-gemini-api-key': apiKey
            },
            body: JSON.stringify({
                researchDescription,
                dataDescription
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to get method suggestion:', error);
        throw error;
    }
}
