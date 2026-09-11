import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { redis } from '../cache/redis.js';

const router = Router();

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

    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:8899');
    redirectUrl.pathname = safeRedirectPath(req.query.state);
    redirectUrl.searchParams.set('token', accessToken);
    redirectUrl.searchParams.set('refresh', refreshToken);
    res.redirect(redirectUrl.toString());
  }
);

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const stored = await redis.get(`refresh:${payload.id}`);
  if (stored !== refreshToken) return res.status(401).json({ error: 'Refresh token revoked' });

  const { accessToken, refreshToken: newRefresh } = signTokens(payload);
  await redis.set(`refresh:${payload.id}`, newRefresh, 'EX', 60 * 60 * 24 * 7);

  res.json({ accessToken, refreshToken: newRefresh });
});

router.post('/logout', async (req, res) => {
  const { userId } = req.body;
  if (userId) await redis.del(`refresh:${userId}`);
  res.json({ ok: true });
});

export default router;
