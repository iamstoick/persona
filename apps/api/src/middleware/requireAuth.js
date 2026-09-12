import jwt from 'jsonwebtoken';

// The access token lives in an httpOnly cookie (set by /api/auth/*) so client-side JS —
// and by extension any XSS — can never read it. The Authorization header is still
// accepted as a fallback for non-browser callers (scripts, future mobile clients).
function extractToken(req) {
  if (req.cookies?.gv_access) return req.cookies.gv_access;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Never rejects — sets req.user when a valid token is present, otherwise leaves it
// undefined. For endpoints that render differently for logged-in vs anonymous visitors
// (e.g. a course outline that's public, with lesson content gated to registered users).
export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Invalid/expired token on an optional-auth route: treat as anonymous rather than failing.
  }
  next();
}

export function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      if (!roles.includes(req.user?.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    },
  ];
}
