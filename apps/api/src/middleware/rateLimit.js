import { redis } from '../cache/redis.js';

// Fixed-window throttle backed by Redis. Fail-open: if Redis is unreachable,
// the request is allowed (availability over strictness for a small site).
export function rateLimit({ prefix, max, windowMs, keyBy = (req) => req.ip }) {
  const windowSec = Math.ceil(windowMs / 1000);
  return async (req, res, next) => {
    let key;
    try {
      key = `ratelimit:${prefix}:${keyBy(req)}`;
    } catch {
      return next();
    }
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSec);
      if (count > max) {
        return res.status(429).json({ error: 'too many requests — try again later' });
      }
      return next();
    } catch {
      return next();
    }
  };
}
