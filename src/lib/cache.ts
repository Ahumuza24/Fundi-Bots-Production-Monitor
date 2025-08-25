// Simple in-memory cache for frequently accessed data
class SimpleCache {
    private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
    private maxSize: number;
    private hitCount = 0;
    private missCount = 0;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
    }

    set(key: string, data: any, ttlMs: number = 5 * 60 * 1000) { // 5 minutes default
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs
        });
    }

    get(key: string) {
        const item = this.cache.get(key);
        if (!item) {
            this.missCount++;
            return null;
        }

        const now = Date.now();
        if (now - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.missCount++;
            return null;
        }

        // Move to end for LRU
        this.cache.delete(key);
        this.cache.set(key, item);
        this.hitCount++;
        return item.data;
    }

    clear() {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }

    delete(key: string) {
        return this.cache.delete(key);
    }

    has(key: string): boolean {
        const item = this.cache.get(key);
        if (!item) return false;

        const now = Date.now();
        if (now - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    // Get cache stats for debugging
    getStats() {
        const total = this.hitCount + this.missCount;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(2) + '%' : '0%',
            keys: Array.from(this.cache.keys())
        };
    }

    // Clean expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

export const appCache = new SimpleCache(200); // Increased cache size

// Cache keys
export const CACHE_KEYS = {
    PROJECTS: 'projects',
    WORKERS: 'workers',
    DASHBOARD_STATS: 'dashboard_stats',
    REPORT_DATA: 'report_data',
    USER_PROFILE: 'user_profile',
    PROJECT_DETAILS: 'project_details',
    WORKER_DETAILS: 'worker_details',
    RECENT_ACTIVITIES: 'recent_activities'
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    SHORT: 2 * 60 * 1000,      // 2 minutes
    MEDIUM: 5 * 60 * 1000,     // 5 minutes
    LONG: 15 * 60 * 1000,      // 15 minutes
    VERY_LONG: 60 * 60 * 1000  // 1 hour
} as const;

// Helper function to create cache key with parameters
export function createCacheKey(base: string, params?: Record<string, any>): string {
    if (!params) return base;
    const paramString = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
    return `${base}:${paramString}`;
}

// Cached async function wrapper
export function withCache<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    keyGenerator: (...args: T) => string,
    ttl: number = CACHE_TTL.MEDIUM
) {
    return async (...args: T): Promise<R> => {
        const cacheKey = keyGenerator(...args);

        // Try to get from cache first
        const cached = appCache.get(cacheKey);
        if (cached !== null) {
            return cached;
        }

        // Execute function and cache result
        try {
            const result = await fn(...args);
            appCache.set(cacheKey, result, ttl);
            return result;
        } catch (error) {
            // Don't cache errors
            throw error;
        }
    };
}

// Invalidate cache entries by pattern
export function invalidateCache(pattern: string | RegExp) {
    const stats = appCache.getStats();
    const keysToDelete: string[] = [];

    for (const key of stats.keys) {
        if (typeof pattern === 'string') {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        } else {
            if (pattern.test(key)) {
                keysToDelete.push(key);
            }
        }
    }

    keysToDelete.forEach(key => appCache.delete(key));
    return keysToDelete.length;
}

// Auto cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
    setInterval(() => {
        appCache.cleanup();
    }, 10 * 60 * 1000);
}