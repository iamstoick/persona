import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('error', (err) => console.warn('[redis] connection error:', err.message));

export const TTL = {
  POSTS: 5 * 60,
  MENUS: 10 * 60,
};

export async function cacheGet(key) {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttl) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // non-fatal
  }
}

export async function cacheDel(...keys) {
  try {
    await redis.del(...keys);
  } catch {
    // non-fatal
  }
}

export async function cacheDelPattern(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // non-fatal
  }
}
