/**
 * Security Utility Functions
 */

/**
 * Sanitize input string to prevent Prompt Injection and XSS
 * - Removes control characters
 * - Escapes potential prompt injection delimiters like triple backticks
 * - Trims excessive whitespace
 */
export function sanitizeInput(input: string, maxLength: number = 2000): string {
    if (!input) return '';

    let clean = input
        // Remove null bytes and control characters (except newlines/tabs)
        .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
        // Escape potential prompt injection delimiters
        .replace(/```/g, '\\`\\`\\`')
        // Normalize whitespace
        .trim();

    // Truncate to safe length
    if (clean.length > maxLength) {
        clean = clean.substring(0, maxLength) + '... (truncated)';
    }

    return clean;
}
