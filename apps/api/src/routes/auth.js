import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { redis } from '../cache/redis.js';
import { pool } from '../db/pool.js';
import { requireAuth, extractToken } from '../middleware/requireAuth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

const isProd = process.env.NODE_ENV === 'production';

// Access token: readable on every path (default '/') since most routes need it.
// Refresh token: scoped to '/api/auth' only — it's never sent on ordinary API calls,
// shrinking the set of endpoints that ever see this longer-lived, more sensitive cookie.
// Both are httpOnly (invisible to JS/XSS) and Secure in production (HTTPS only).
const ACCESS_COOKIE = 'gv_access';
const REFRESH_COOKIE = 'gv_refresh';
const ACCESS_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_MAX_AGE_MS,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_MAX_AGE_MS,
  });
  // Non-secret, JS-readable flag so the frontend can tell "logged in" from "logged out"
  // without ever touching the actual tokens — mirrors the access token's lifetime.
  res.cookie('gv_logged_in', '1', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_MAX_AGE_MS,
  });
}

function clearAuthCookies(res) {
  // Flags must match setAuthCookies or browsers keep the Secure/Lax cookies.
  const opts = { httpOnly: true, secure: isProd, sameSite: 'lax' };
  res.clearCookie(ACCESS_COOKIE, { ...opts, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...opts, path: '/api/auth' });
  res.clearCookie('gv_logged_in', { ...opts, path: '/' });
}

function signTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  // The access jti backs the logout denylist checked in requireAuth — a logged-out
  // token is rejected immediately instead of living out its full TTL.
  const accessToken = jwt.sign({ ...payload, jti: randomUUID() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '6h',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
  return { accessToken, refreshToken };
}

// The OAuth `state` carries only the post-login path, but it is HMAC-signed with a
// random nonce and a 10-minute expiry so an attacker can't plant a fixed state value
// (login CSRF / session fixation) or replay an old one.
function signState(redirect) {
  const payload = Buffer.from(
    JSON.stringify({ r: safeRedirectPath(redirect), n: randomUUID(), exp: Date.now() + 10 * 60 * 1000 })
  ).toString('base64url');
  const sig = createHmac('sha256', process.env.JWT_SECRET || 'state-fallback').update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyState(state) {
  const [payload, sig] = String(state || '').split('.');
  if (!payload || !sig) return null;
  let expected;
  try {
    expected = createHmac('sha256', process.env.JWT_SECRET || 'state-fallback').update(payload).digest();
    const actual = Buffer.from(sig, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.exp !== 'number' || Date.now() > data.exp) return null;
    return safeRedirectPath(data.r);
  } catch {
    return null;
  }
}

const oauthThrottle = rateLimit({ prefix: 'oauth', max: 20, windowMs: 60 * 60 * 1000 });
const refreshThrottle = rateLimit({ prefix: 'refresh', max: 30, windowMs: 15 * 60 * 1000 });

// Only an internal relative path is accepted as a post-login redirect target — this is
// user-controlled input, and anything else (a full URL, protocol-relative "//evil.com")
// would turn login into an open redirect.
function safeRedirectPath(path) {
  if (typeof path === 'string' && /^\/[a-zA-Z0-9\-_/]*$/.test(path)) return path;
  return '/admin';
}

router.get('/google', oauthThrottle, (req, res, next) => {
  const state = signState(req.query.redirect);
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});

router.get(
  '/google/callback',
  oauthThrottle,
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  async (req, res) => {
    const { accessToken, refreshToken } = signTokens(req.user);
    await redis.set(`refresh:${req.user.id}`, refreshToken, 'EX', 60 * 60 * 24 * 7);
    setAuthCookies(res, accessToken, refreshToken);

    // Tokens travel in cookies now, never in the URL — nothing sensitive left to strip
    // client-side, and nothing sensitive lands in server/CDN access logs or browser history.
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:8899');
    redirectUrl.pathname = verifyState(req.query.state) || '/admin';
    res.redirect(redirectUrl.toString());
  }
);

// Deliberately one generic message for every failure here: distinguishing "invalid"
// from "revoked" would give an attacker a session-state oracle.
const REFRESH_FAILED = { error: 'Invalid session' };

router.post('/refresh', refreshThrottle, async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) return res.status(401).json(REFRESH_FAILED);

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    clearAuthCookies(res);
    return res.status(401).json(REFRESH_FAILED);
  }

  const stored = await redis.get(`refresh:${payload.id}`);
  if (!stored) {
    clearAuthCookies(res);
    return res.status(401).json(REFRESH_FAILED);
  }
  if (stored !== refreshToken) {
    // Reuse detected: this refresh was already rotated, so someone is replaying an
    // old token. Kill the whole session family instead of minting new tokens.
    await redis.del(`refresh:${payload.id}`);
    clearAuthCookies(res);
    return res.status(401).json(REFRESH_FAILED);
  }

  // Reload the user so role changes (demotion, deletion) take effect on refresh
  // instead of persisting in stale token claims for up to 7 days.
  const { rows } = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [payload.id]);
  const user = rows[0];
  if (!user) {
    await redis.del(`refresh:${payload.id}`);
    clearAuthCookies(res);
    return res.status(401).json(REFRESH_FAILED);
  }

  const { accessToken, refreshToken: newRefresh } = signTokens(user);
  await redis.set(`refresh:${payload.id}`, newRefresh, 'EX', 60 * 60 * 24 * 7);
  setAuthCookies(res, accessToken, newRefresh);

  res.json({ ok: true });
});

// Lets the frontend check who's actually logged in and what role they have — the
// gv_logged_in cookie only says "some session exists," not who it belongs to. Used by
// the admin UI to hide admin-only navigation from authenticated non-admin/editor users
// (e.g. a course subscriber), even though the API itself already blocks their requests.
router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
});

router.post('/logout', async (req, res) => {
  // Revoke the refresh token AND deny-list the current access token, so neither
  // works after logout — without the denylist a stolen access token would stay
  // valid until its full TTL.
  const accessToken = extractToken(req);
  if (accessToken) {
    try {
      const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
      if (payload.jti) {
        const ttl = Math.max(1, Math.min(payload.exp - Math.floor(Date.now() / 1000), 6 * 60 * 60));
        await redis.set(`auth:denied:${payload.jti}`, '1', 'EX', ttl);
      }
    } catch {
      // Already invalid/expired — nothing to deny-list.
    }
  }
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await redis.del(`refresh:${payload.id}`);
    } catch {
      // Already invalid/expired — nothing to revoke.
    }
  }
  clearAuthCookies(res);
  res.json({ ok: true });
});

export default router;
