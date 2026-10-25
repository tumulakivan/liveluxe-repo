// `pnpm fill:import <file.json> [--save]`: sends a Claude fill file to the fill API.
//
// The file maps Hostaway listing IDs to field values: { "317097": { "houseManual": "...", ... }, ... }.
// It's read from Hostaway's dashboard in a signed-in browser tab (Hostaway's page can't call other servers,
// so the values travel as a file). Without --save this is a preview: nothing changes.
// Uses LISTING_REPO_TOKEN (an access token) and FILL_API_URL (default http://localhost:4200).
import { readFileSync } from 'node:fs';
import './config.ts';

const [file, ...flags] = process.argv.slice(2);
if (!file) {
  console.error('Usage: pnpm fill:import <file.json> [--save]');
  process.exit(1);
}
const save = flags.includes('--save');
const token = process.env.LISTING_REPO_TOKEN;
if (!token) {
  console.error('Set LISTING_REPO_TOKEN to an access token (Dashboard → Accounts → Access tokens).');
  process.exit(1);
}
const api = (process.env.FILL_API_URL ?? `http://localhost:${process.env.PORT ?? 4200}`).replace(/\/$/, '');

const data = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, '')) as Record<string, Record<string, unknown>>;
const items = Object.entries(data).map(([hostawayId, values]) => ({ hostawayId: Number(hostawayId), values }));

interface BatchResult {
  wouldSave: number;
  saved: number;
  results: { ref: { hostawayId?: number }; changes: { field: string }[]; skipped: { field: string; reason: string }[]; unchanged: string[]; errors: string[] }[];
  error?: string;
}

const totals = { wouldSave: 0, saved: 0, unchanged: 0, skipped: 0, errors: [] as string[], perField: new Map<string, number>() };
for (let i = 0; i < items.length; i += 50) {
  const res = await fetch(`${api}/api/fill/batch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-listing-repo': '1' },
    body: JSON.stringify({ dryRun: !save, items: items.slice(i, i + 50) }),
  });
  const body = (await res.json()) as BatchResult;
  if (!res.ok) throw new Error(body.error ?? `Fill API returned ${res.status}`);
  totals.wouldSave += body.wouldSave;
  totals.saved += body.saved;
  for (const r of body.results) {
    totals.unchanged += r.unchanged.length;
    totals.skipped += r.skipped.length;
    for (const c of r.changes) totals.perField.set(c.field, (totals.perField.get(c.field) ?? 0) + 1);
    for (const e of r.errors) totals.errors.push(`${r.ref.hostawayId}: ${e}`);
  }
}

console.log(`${save ? 'Saved' : 'Preview'}: ${items.length} listings, ${save ? totals.saved : totals.wouldSave} values ${save ? 'saved' : 'would change'}, ${totals.unchanged} unchanged, ${totals.skipped} skipped (set by an admin).`);
for (const [field, n] of [...totals.perField].sort((a, b) => b[1] - a[1])) console.log(`  ${field}: ${n}`);
if (totals.errors.length) {
  console.log(`${totals.errors.length} problems:`);
  for (const e of totals.errors.slice(0, 30)) console.log(`  ${e}`);
}
