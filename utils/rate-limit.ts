/**
 * Simple In-Memory Rate Limiter
 * Note: For production serverless with strict limits, use Redis (e.g., Upstash).
 * This implementation helps prevent basic spamming.
 */

interface RateLimitTracker {
    count: number;
    expiresAt: number;
}

const ipCache = new Map<string, RateLimitTracker>();

// Clean up expired entries every minute
setInterval(() => {
    const now = Date.now();
    for (const [ip, tracker] of ipCache.entries()) {
        if (now > tracker.expiresAt) {
            ipCache.delete(ip);
        }
    }
}, 60 * 1000);

/**
 * Check Rate Limit
 * @param identifier Unique ID (IP address or User ID)
 * @param limit Max requests allowed
 * @param windowMs Time window in milliseconds
 * @returns true if request is allowed, false if blocked
 */
export function checkRateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const tracker = ipCache.get(identifier);

    if (!tracker) {
        ipCache.set(identifier, {
            count: 1,
            expiresAt: now + windowMs
        });
        return true;
    }

    if (now > tracker.expiresAt) {
        // Reset window
        ipCache.set(identifier, {
            count: 1,
            expiresAt: now + windowMs
        });
        return true;
    }

    if (tracker.count >= limit) {
        return false;
    }

    tracker.count++;
    return true;
}
