import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// The multipart Content-Type is client-supplied and trivially spoofed, so the
// allowlist alone can't prove a file is what it claims to be. Verify the magic
// bytes of the saved file before accepting it.
const SIGNATURES = {
  '.jpg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  '.gif': (b) => b.length >= 6 && b.toString('ascii', 0, 6).startsWith('GIF8'),
  '.webp': (b) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  '.avif': (b) => b.length >= 32 && b.toString('ascii', 4, 8) === 'ftyp' && /avif|mif1|msf1/.test(b.toString('ascii', 8, 32)),
  '.mp4': (b) => b.length >= 12 && b.toString('ascii', 4, 8) === 'ftyp',
  '.webm': (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  '.pdf': (b) => b.length >= 5 && b.toString('ascii', 0, 5) === '%PDF-',
};

function headerMatches(ext, filePath) {
  const check = SIGNATURES[ext];
  if (!check) return false;
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(64);
    const read = fs.readSync(fd, buf, 0, 64, 0);
    return check(buf.subarray(0, read));
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

// Maps each accepted MIME type to the extension we save it under — the stored extension
// must never come from the client-supplied original filename (or from trusting the
// client's Content-Type at face value), or a spoofed mimetype paired with an attacker-
// chosen filename extension (e.g. "shell.html" sent as image/png) could get saved and
// served statically with a browser-executable extension. SVG is deliberately excluded:
// it can embed <script> and executes when navigated to directly from the same origin.
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${ALLOWED_TYPES[file.mimetype] || ''}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, file.mimetype)) return cb(null, true);
    req.rejectedMime = file.mimetype;
    cb(null, false);
  },
});

// Multer failures (oversize, aborted multipart) otherwise fall through to the generic
// error handler as a bare 500, which the uploader can't explain — translate them here.
function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large — 10 MB maximum' });
    }
    return res.status(400).json({ error: err.message || 'Upload rejected' });
  });
}

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');
// 30 uploads/hour per user — enough for real editorial work, too slow to fill
// the volume with 10 MB posts from a compromised account.
const uploadThrottle = rateLimit({
  prefix: 'media',
  max: 30,
  windowMs: 60 * 60 * 1000,
  keyBy: (req) => req.user?.id || req.ip,
});

router.post('/', editorOrAdmin, uploadThrottle, uploadSingle, async (req, res) => {
  if (!req.file) {
    const detail = req.rejectedMime ? ` (received "${req.rejectedMime}")` : '';
    return res.status(400).json({
      error: `Unsupported file type${detail}. Allowed: JPEG, PNG, GIF, WebP, AVIF, MP4, WebM, PDF.`,
    });
  }

  // The declared mimetype is client-controlled — confirm the bytes agree before
  // the file becomes servable, or any script/polyglot with a fake Content-Type
  // would land on the trusted origin.
  const ext = path.extname(req.file.filename);
  if (!headerMatches(ext, req.file.path)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'File content does not match its type.' });
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/${req.file.filename}`;
  const { rows } = await pool.query(
    `INSERT INTO media (uploader_id, filename, url, mime_type, size_bytes, alt_text)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.user.id, req.file.originalname, url, req.file.mimetype, req.file.size, req.body.alt_text || '']
  );

  res.status(201).json(rows[0]);
});

router.get('/', editorOrAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM media ORDER BY created_at DESC');
  res.json(rows);
});

router.delete('/:id', editorOrAdmin, async (req, res) => {
  const { rows } = await pool.query('DELETE FROM media WHERE id = $1 RETURNING *', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  // Confine the unlink to the uploads dir: the filename comes from a DB row, so
  // a compromised-DB path segment must never escape into the filesystem.
  const raw = (rows[0].url.split('/uploads/')[1] || '').split('?')[0];
  const filename = path.basename(raw);
  const target = path.resolve(UPLOAD_DIR, filename);
  if (filename && target.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    fs.unlink(target, (err) => {
      if (err) console.warn('[media] orphan file (DB row deleted):', target);
    });
  } else if (filename) {
    console.warn('[media] refused out-of-dir unlink:', raw);
  }
  res.json({ ok: true });
});

export default router;
