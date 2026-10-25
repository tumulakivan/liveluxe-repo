import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { listQuerySchema } from '@repo/shared';
import { z } from 'zod';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { admin, passwordRoute } from './admin.ts';
import { fill } from './fill.ts';
import { fillRelay } from './fill-relay.ts';
import { currentAdmin, requireAppHeader, signIn, signOut } from './auth.ts';
import { config, ROOT } from './config.ts';
import { facets, getProperty, listProperties } from './properties.ts';

const app = new Hono();

app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://hostaway-platform.s3.us-west-2.amazonaws.com', 'https://*.hostaway.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
    referrerPolicy: 'same-origin',
  }),
);
// Staff-only reference: keep it out of search engines.
app.use('*', async (c, next) => {
  await next();
  c.header('X-Robots-Tag', 'noindex, nofollow');
});

if (config.apiDelayMs > 0) {
  app.use('/api/*', async (_c, next) => {
    await new Promise((r) => setTimeout(r, config.apiDelayMs));
    await next();
  });
}

app.use('/api/*', requireAppHeader);

app.get('/api/health', (c) => c.json({ ok: true }));

// ---- admin sign-in
const credentials = z.object({ username: z.string().trim().min(1).max(64), password: z.string().min(1).max(200) });

app.post('/api/auth/sign-in', async (c) => {
  const parsed = credentials.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'Enter your username and password.' }, 400);
  const result = await signIn(c, parsed.data.username, parsed.data.password);
  if (result === 'limited') return c.json({ error: 'Too many attempts. Wait 15 minutes, then try again.' }, 429);
  if (!result) return c.json({ error: 'That username and password don’t match.' }, 401);
  return c.json({ username: result.username, mustChangePassword: result.mustChangePassword });
});

app.post('/api/auth/sign-out', (c) => {
  signOut(c);
  return c.json({ ok: true });
});

app.get('/api/auth/me', (c) => {
  const me = currentAdmin(c);
  return c.json(me ? { username: me.username, mustChangePassword: me.mustChangePassword } : null);
});

app.route('/api/auth/password', passwordRoute);
app.route('/api/admin', admin);
app.route('/api/fill', fill);
// The fill relay: a page that opens a signed-in Hostaway tab and saves what it sends back (see fill-relay.ts).
app.route('/fill-relay', fillRelay);

// Uploaded display photos (properties added by hand). File names are generated, never user-chosen.
app.get('/photos/:file', async (c) => {
  const file = c.req.param('file');
  if (!/^\d+-[0-9a-f]{12}\.(webp|jpg|png)$/.test(file)) return c.notFound();
  const path = resolve(config.photosDir, file);
  if (!existsSync(path)) return c.notFound();
  const type = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png' }[file.split('.').pop() as 'webp'];
  return c.body(await readFile(path), 200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' });
});

app.get('/api/properties', (c) => {
  const parsed = listQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: 'Invalid filter' }, 400);
  return c.json(listProperties({ ...parsed.data, removed: 'hide', manualOnly: false, activeOnly: false, archivedOnly: false }));
});

app.get('/api/facets', (c) => {
  const parsed = listQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: 'Invalid filter' }, 400);
  return c.json(facets({ ...parsed.data, removed: 'hide' }));
});

app.get('/api/properties/:id', (c) => {
  const id = Number(c.req.param('id'));
  const property = Number.isInteger(id) ? getProperty(id) : null;
  return property ? c.json(property) : c.json({ error: 'Property not found' }, 404);
});

app.get('/robots.txt', (c) => c.text('User-agent: *\nDisallow: /\n'));

// Production: serve the built web app and fall back to index.html for client routes.
if (existsSync(config.webDist)) {
  const root = relative(process.cwd(), config.webDist) || '.';
  app.use('/*', serveStatic({ root }));
  app.get('*', async (c) => c.html(await readFile(resolve(config.webDist, 'index.html'), 'utf8')));
}

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Listing Repo API on http://localhost:${info.port} (root ${ROOT})`);
});
