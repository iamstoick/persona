import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = header.slice(7);
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
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
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
