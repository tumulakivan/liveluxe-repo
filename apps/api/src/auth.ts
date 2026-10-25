import { createHash, randomBytes } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { config } from './config.ts';
import { db } from './db.ts';
import { hashPassword, verifyPassword } from './passwords.ts';

// Admin sign-in: random session tokens in an httpOnly cookie; only a SHA-256 of the token is stored.

const COOKIE = 'lr_session';
const SESSION_DAYS = 14;
export const MIN_PASSWORD = 10;

export interface Admin {
  id: number;
  username: string;
  mustChangePassword: boolean;
}

type AdminRow = { id: number; username: string; must_change_password: number; password_hash: string };

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// A sign-in still costs one scrypt run for unknown usernames, so timing doesn't reveal which exist.
let dummyHash: Promise<string> | null = null;

// In-memory limiter: 10 failed sign-ins per 15 minutes per IP and username. Five users don't need a shared store.
const failures = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

function limited(key: string): boolean {
  const recent = (failures.get(key) ?? []).filter((t) => Date.now() - t < WINDOW_MS);
  failures.set(key, recent);
  return recent.length >= MAX_FAILURES;
}

export function clientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export async function signIn(c: Context, username: string, password: string): Promise<Admin | 'limited' | null> {
  const key = `${clientIp(c)}|${username.toLowerCase()}`;
  if (limited(key)) return 'limited';
  const row = db
    .prepare('SELECT id, username, must_change_password, password_hash FROM admins WHERE username = ?')
    .get(username.trim()) as AdminRow | undefined;
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
  const ok = await verifyPassword(password, row?.password_hash ?? (await dummyHash));
  if (!row || !ok) {
    failures.get(key)!.push(Date.now());
    return null;
  }
  failures.delete(key);

  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  db.prepare('INSERT INTO sessions (token_hash, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    sha256(token),
    row.id,
    now.toISOString(),
    expires.toISOString(),
  );
  db.prepare('UPDATE admins SET last_sign_in_at = ? WHERE id = ?').run(now.toISOString(), row.id);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now.toISOString());
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: config.cookieSecure,
    path: '/',
    expires,
  });
  return { id: row.id, username: row.username, mustChangePassword: row.must_change_password === 1 };
}

export function currentAdmin(c: Context): Admin | null {
  const token = getCookie(c, COOKIE);
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT a.id, a.username, a.must_change_password FROM sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(sha256(token), new Date().toISOString()) as Omit<AdminRow, 'password_hash'> | undefined;
  return row ? { id: row.id, username: row.username, mustChangePassword: row.must_change_password === 1 } : null;
}

export function signOut(c: Context) {
  const token = getCookie(c, COOKIE);
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  deleteCookie(c, COOKIE, { path: '/' });
}

export async function changePassword(admin: Admin, current: string, next: string): Promise<string | null> {
  if (next.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  const row = db.prepare('SELECT password_hash FROM admins WHERE id = ?').get(admin.id) as { password_hash: string };
  if (!(await verifyPassword(current, row.password_hash))) return 'Your current password is not right.';
  if (await verifyPassword(next, row.password_hash)) return 'Choose a password different from the current one.';
  db.prepare('UPDATE admins SET password_hash = ?, must_change_password = 0, password_changed_at = ? WHERE id = ?').run(
    await hashPassword(next),
    new Date().toISOString(),
    admin.id,
  );
  return null;
}

export type AdminEnv = { Variables: { admin: Admin } };

/** Admin routes: a valid session, and a password already changed from the starting one. */
export const requireAdmin: MiddlewareHandler<AdminEnv> = async (c, next) => {
  const admin = currentAdmin(c);
  if (!admin) return c.json({ error: 'Sign in to continue.', code: 'signed_out' }, 401);
  if (admin.mustChangePassword) return c.json({ error: 'Choose a new password first.', code: 'password_change_required' }, 403);
  c.set('admin', admin);
  await next();
};

/**
 * CSRF guard: every write must carry a custom header. A cross-site page can't send one without a
 * CORS preflight, and this server never approves one.
 */
export const requireAppHeader: MiddlewareHandler = async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD' && c.req.header('x-listing-repo') !== '1') {
    return c.json({ error: 'Request refused.' }, 403);
  }
  await next();
};
