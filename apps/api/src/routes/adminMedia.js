import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${ALLOWED_TYPES[file.mimetype] || ''}`);
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

router.post('/', editorOrAdmin, uploadSingle, async (req, res) => {
  if (!req.file) {
    const detail = req.rejectedMime ? ` (received "${req.rejectedMime}")` : '';
    return res.status(400).json({
      error: `Unsupported file type${detail}. Allowed: JPEG, PNG, GIF, WebP, AVIF, MP4, WebM, PDF.`,
    });
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

  const filename = rows[0].url.split('/uploads/')[1];
  if (filename) {
    fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
  }
  res.json({ ok: true });
});

export default router;
