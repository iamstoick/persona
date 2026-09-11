import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from '../db/pool.js';

export function configurePassport(passport) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('[passport] GOOGLE_CLIENT_ID/SECRET not set — Google OAuth disabled.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatarUrl = profile.photos?.[0]?.value;

          const { rows } = await pool.query(
            `INSERT INTO users (google_id, email, name, avatar_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (google_id) DO UPDATE
               SET email = EXCLUDED.email,
                   name = EXCLUDED.name,
                   avatar_url = EXCLUDED.avatar_url,
                   updated_at = NOW()
             RETURNING *`,
            [profile.id, email, profile.displayName, avatarUrl]
          );

          done(null, rows[0]);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}
