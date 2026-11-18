// One fetch wrapper for the browse and admin APIs, so every failure reaches the screen as a
// sentence a person can act on, with the HTTP status kept for code that branches on it.

export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status; 0 when the server couldn't be reached at all. */
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

function statusMessage(status: number): string {
  if (status === 401) return 'Your session has ended. Sign in again.';
  if (status === 403) return "You don't have access to this.";
  if (status === 404) return 'Not found.';
  if (status === 429) return 'Too many requests. Wait a moment, then try again.';
  if (status >= 500) return 'The server ran into a problem. Try again in a moment.';
  return `The request failed (${status}).`;
}

export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("Can't reach the server. Check your connection, then try again.", 0, 'network');
  }
  const text = await res.text().catch(() => '');
  let body: unknown;
  let parsed = false;
  try {
    body = JSON.parse(text);
    parsed = true;
  } catch {
    // Not JSON: a proxy error page, or the API is down behind the dev server.
  }
  if (!res.ok) {
    const b = (parsed ? body : null) as { error?: string; code?: string } | null;
    throw new ApiError(b?.error ?? statusMessage(res.status), res.status, b?.code);
  }
  if (!parsed) throw new ApiError('The server sent an unexpected reply. Try again in a moment.', res.status, 'bad-reply');
  return body as T;
}

/** Client errors (4xx) won't change on a retry; network and server errors might. */
export const isRetryable = (error: unknown) => !(error instanceof ApiError && error.status >= 400 && error.status < 500);
