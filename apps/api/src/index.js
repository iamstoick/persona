import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { configurePassport } from './middleware/passport.js';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import adminPostsRoutes from './routes/adminPosts.js';
import adminMediaRoutes from './routes/adminMedia.js';
import adminUsersRoutes from './routes/adminUsers.js';
import menusRoutes from './routes/menus.js';
import contactRoutes from './routes/contact.js';
import settingsRoutes from './routes/settings.js';
import adminSettingsRoutes from './routes/adminSettings.js';
import projectsRoutes from './routes/projects.js';
import adminProjectsRoutes from './routes/adminProjects.js';
import servicesRoutes from './routes/services.js';
import adminServicesRoutes from './routes/adminServices.js';
import coursesRoutes from './routes/courses.js';
import adminCoursesRoutes from './routes/adminCourses.js';
import slidesRoutes from './routes/slides.js';
import adminSlidesRoutes from './routes/adminSlides.js';

const MISSING_VARS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
  .filter((k) => !process.env[k]);

if (MISSING_VARS.length > 0) {
  console.warn(`[startup] Missing env vars: ${MISSING_VARS.join(', ')} — some features will not work.`);
}

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:8899', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

configurePassport(passport);
app.use(passport.initialize());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/pages', postsRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/slides', slidesRoutes);
app.use('/api/admin/posts', adminPostsRoutes);
app.use('/api/admin/media', adminMediaRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/projects', adminProjectsRoutes);
app.use('/api/admin/services', adminServicesRoutes);
app.use('/api/admin/courses', adminCoursesRoutes);
app.use('/api/admin/slides', adminSlidesRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
