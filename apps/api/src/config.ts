import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Repo root, whether running from src/ (dev) or dist/ (production bundle).
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const envFile = resolve(ROOT, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

export const config = {
  port: Number(process.env.PORT ?? 4200),
  dbFile: resolve(ROOT, process.env.DB_FILE ?? 'data/listing-repo.db'),
  webDist: resolve(ROOT, 'apps/web/dist'),
  /** Uploaded display photos of properties added by hand. Lives beside the database (the Railway volume). */
  photosDir: resolve(ROOT, process.env.PHOTOS_DIR ?? 'data/photos'),
  /** Secure cookies behind HTTPS (Railway). Off for http://localhost. */
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  hostaway: {
    accountId: process.env.HOSTAWAY_ACCT_ID ?? '',
    apiKey: process.env.HOSTAWAY_API_KEY ?? '',
  },
  /** Artificial latency for checking loading states in development. */
  apiDelayMs: Number(process.env.API_DELAY_MS ?? 0),
};
