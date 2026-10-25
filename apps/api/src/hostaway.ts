import { config } from './config.ts';

// Read-only client for the Hostaway public API. This app never writes to Hostaway.

const BASE = 'https://api.hostaway.com/v1';

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const { accountId, apiKey } = config.hostaway;
  if (!accountId || !apiKey) throw new Error('HOSTAWAY_ACCT_ID and HOSTAWAY_API_KEY must be set in .env');
  const res = await fetch(`${BASE}/accessTokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: accountId,
      client_secret: apiKey,
      scope: 'general',
    }),
  });
  if (!res.ok) throw new Error(`Hostaway sign-in failed (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return token.value;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${await accessToken()}` } });
  if (!res.ok) throw new Error(`Hostaway GET ${path} failed (${res.status})`);
  const body = (await res.json()) as { status: string; result: T };
  if (body.status !== 'success') throw new Error(`Hostaway GET ${path} returned ${body.status}`);
  return body.result;
}

export type HostawayListing = Record<string, unknown> & { id: number; name: string };

export interface Named {
  id: number;
  name: string;
}

export async function fetchListings(): Promise<HostawayListing[]> {
  const all: HostawayListing[] = [];
  for (let offset = 0; ; offset += 200) {
    const page = await get<HostawayListing[]>(`/listings?limit=200&offset=${offset}&includeResources=1`);
    all.push(...page);
    if (page.length < 200) return all;
  }
}

export const fetchPropertyTypes = () => get<Named[]>('/propertyTypes');

/** Cancellation policy names by id, across the account's own and each channel's list. */
export async function fetchCancellationPolicies(): Promise<Map<number, string>> {
  const names = new Map<number, string>();
  for (const path of ['/cancellationPolicies', '/cancellationPolicies/airbnb', '/cancellationPolicies/vrbo', '/cancellationPolicies/bookingcom']) {
    try {
      for (const p of await get<Named[]>(path)) names.set(p.id, p.name);
    } catch {
      // A channel without its own list falls back to showing the id.
    }
  }
  return names;
}
