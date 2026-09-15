import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { redis } from '../cache/redis.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

const isProd = process.env.NODE_ENV === 'production';

// Access token: readable on every path (default '/') since most routes need it.
// Refresh token: scoped to '/api/auth' only — it's never sent on ordinary API calls,
// shrinking the set of endpoints that ever see this longer-lived, more sensitive cookie.
// Both are httpOnly (invisible to JS/XSS) and Secure in production (HTTPS only).
const ACCESS_COOKIE = 'gv_access';
const REFRESH_COOKIE = 'gv_refresh';
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
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
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.clearCookie('gv_logged_in', { path: '/' });
}

function signTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
  return { accessToken, refreshToken };
}

// Only an internal relative path is accepted as a post-login redirect target — this is
// user-controlled input, and anything else (a full URL, protocol-relative "//evil.com")
// would turn login into an open redirect.
function safeRedirectPath(path) {
  if (typeof path === 'string' && /^\/[a-zA-Z0-9\-_/]*$/.test(path)) return path;
  return '/admin';
}

router.get('/google', (req, res, next) => {
  const state = safeRedirectPath(req.query.redirect);
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  async (req, res) => {
    const { accessToken, refreshToken } = signTokens(req.user);
    await redis.set(`refresh:${req.user.id}`, refreshToken, 'EX', 60 * 60 * 24 * 7);
    setAuthCookies(res, accessToken, refreshToken);

    // Tokens travel in cookies now, never in the URL — nothing sensitive left to strip
    // client-side, and nothing sensitive lands in server/CDN access logs or browser history.
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:8899');
    redirectUrl.pathname = safeRedirectPath(req.query.state);
    res.redirect(redirectUrl.toString());
  }
);

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const stored = await redis.get(`refresh:${payload.id}`);
  if (stored !== refreshToken) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Refresh token revoked' });
  }

  const { accessToken, refreshToken: newRefresh } = signTokens(payload);
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
