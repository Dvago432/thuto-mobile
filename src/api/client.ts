import { getSession, reauth, logout } from './auth';

const BASE_URL = 'https://thuto.nul.ls';

// ── Types ─────────────────────────────────────────────────────────

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired and re-auth failed. Please log in again.');
    this.name = 'SessionExpiredError';
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Client ────────────────────────────────────────────────────────

/**
 * Authenticated fetch wrapper for the Sakai /direct/ REST API.
 *
 * Automatically:
 *  - Injects SAKAI2SESSIONID and JSESSIONID cookies on every request
 *  - Detects expired sessions (401 / redirect to login page)
 *  - Attempts one silent re-auth before giving up
 *  - Throws SessionExpiredError if re-auth fails
 */
export async function apiGet<T>(path: string): Promise<T> {
  return withAuth<T>(path, false);
}

// ── Internal ──────────────────────────────────────────────────────

async function withAuth<T>(
  path: string,
  isRetry: boolean,
): Promise<T> {
  const session = await getSession();
  if (!session) {
    throw new SessionExpiredError();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 16000);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        // NUL Sakai uses SAKAI2SESSIONID; pass both for compatibility
        Cookie: `SAKAI2SESSIONID=${session}; JSESSIONID=${session}`,
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) ThutoMobile/1.0',
      },
      redirect: 'manual',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Sakai signals an expired session via a redirect back to login (302/401)
    const isExpired =
      res.status === 401 ||
      res.status === 302 ||
      (res.status === 0 && !isRetry);

    if (isExpired) {
      if (isRetry) {
        await logout();
        throw new SessionExpiredError();
      }

      const reauthOk = await reauth();
      if (!reauthOk) {
        await logout();
        throw new SessionExpiredError();
      }

      // One more attempt with the fresh session
      return withAuth<T>(path, true);
    }

    if (!res.ok) {
      throw new ApiError(res.status, `API error ${res.status} on ${path}`);
    }

    const json = (await res.json()) as T;
    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(408, `Request timed out on ${path}. Campus connection is slow.`);
    }
    throw err;
  }
}
