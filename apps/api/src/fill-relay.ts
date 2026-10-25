import { Hono } from 'hono';

// The fill relay. Hostaway's dashboard won't let its pages call other servers (its CSP), so a fill run
// goes the other way round: this page opens a signed-in Hostaway window, and the script running there
// hands each batch back with window.postMessage. This page then saves it to /api/fill with the access
// token given in the address's #fragment (never sent to any server, cleared once read).
// Messages are accepted only from https://dashboard.hostaway.com.

const PAGE = `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8" />
<meta name="robots" content="noindex, nofollow" />
<title>Fill relay · Listing Repo</title>
<style>
  body { font: 15px/1.6 'Helvetica Neue', Arial, sans-serif; background: #f2eee6; color: #2e2d31; margin: 0; padding: 48px; }
  h1 { font: 600 32px/1.1 Georgia, serif; color: #0a0a0c; margin: 0 0 12px; }
  p { max-width: 64ch; }
  button { font: 500 12px/1 'Helvetica Neue', Arial, sans-serif; letter-spacing: .2em; text-transform: uppercase;
    background: #0a0a0c; color: #f8f5ef; border: 0; padding: 14px 18px; cursor: pointer; }
  button:disabled { background: #5e574e; cursor: not-allowed; }
  :focus-visible { outline: 2px solid #7c5e26; outline-offset: 2px; }
  #log { margin-top: 24px; border-top: 1px solid rgb(211 172 96 / .9); padding-top: 12px; white-space: pre-wrap;
    font: 13px/1.5 ui-monospace, Consolas, monospace; }
</style>
</head>
<body>
<h1>Fill relay</h1>
<p>Opens your Hostaway dashboard in a new window. A script there reads the fields only the dashboard shows and sends them back here, and this page saves them to the Listing Repo with the access token. Hostaway itself is never changed.</p>
<button id="open" type="button" disabled>Open Hostaway</button>
<div id="log" role="log" aria-live="polite"></div>
<script src="/fill-relay/relay.js"></script>
</body>
</html>`;

const SCRIPT = `(() => {
  const HOSTAWAY = 'https://dashboard.hostaway.com';
  const log = (m) => { const el = document.getElementById('log'); el.textContent += m + '\\n'; };
  const token = new URLSearchParams(location.hash.slice(1)).get('token');
  history.replaceState(null, '', location.pathname);
  const button = document.getElementById('open');
  if (!token) { log('No access token. Open this page as /fill-relay#token=<token>.'); return; }
  button.disabled = false;
  button.addEventListener('click', () => {
    window.open(HOSTAWAY + '/listings', 'hostaway-fill');
    log('Hostaway opened. Waiting for its script.');
  });
  const call = async (path, init = {}) => {
    const res = await fetch('/api/fill' + path, {
      ...init,
      headers: { Authorization: 'Bearer ' + token, 'content-type': 'application/json', 'x-listing-repo': '1', ...(init.headers || {}) },
    });
    return res.json();
  };
  window.addEventListener('message', async (e) => {
    if (e.origin !== HOSTAWAY || !e.data || typeof e.data !== 'object') return;
    const { id, kind, body } = e.data;
    let reply;
    try {
      if (kind === 'properties') reply = await call('/properties');
      else if (kind === 'batch') {
        reply = await call('/batch', { method: 'POST', body: JSON.stringify(body) });
        log((body.dryRun ? 'Preview' : 'Saved') + ': ' + body.items.length + ' properties, ' + (body.dryRun ? reply.wouldSave + ' values would change' : reply.saved + ' values saved'));
      } else return;
    } catch (err) {
      reply = { error: String(err) };
    }
    e.source.postMessage({ id, reply }, HOSTAWAY);
  });
})();`;

export const fillRelay = new Hono();
fillRelay.get('/', (c) => c.html(PAGE));
fillRelay.get('/relay.js', (c) => c.body(SCRIPT, 200, { 'Content-Type': 'text/javascript; charset=utf-8' }));
