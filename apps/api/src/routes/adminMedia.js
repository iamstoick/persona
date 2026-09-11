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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /image\/(jpeg|png|gif|webp|svg\+xml)|video\/|application\/pdf/;
    cb(null, allowed.test(file.mimetype));
  },
});

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');

router.post('/', editorOrAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

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
