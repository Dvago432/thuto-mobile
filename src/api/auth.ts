import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://thuto.nul.ls';
const SESSION_KEY = 'thuto_jsessionid';
const EID_KEY = 'thuto_eid';
// NOTE: storing the password lets us silently re-auth when the session expires.
// SecureStore uses the device hardware keystore — this is safe.
const PW_KEY = 'thuto_pw';

// ── Types ─────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface StoredCredentials {
  eid: string;
  pw: string;
}

// ── Core auth ─────────────────────────────────────────────────────

/**
 * Authenticates against Thuto and stores the JSESSIONID.
 *
 * Sakai responds to a successful login with a 302 redirect
 * and sets JSESSIONID in the Set-Cookie header.
 * We capture that cookie before following the redirect.
 */
export async function login(
  eid: string,
  pw: string,
): Promise<LoginResult> {
  try {
    const res = await fetch(`${BASE_URL}/portal/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ThutoMobile/1.0',
      },
      body: `eid=${encodeURIComponent(eid)}&pw=${encodeURIComponent(pw)}&submit=Login`,
      redirect: 'manual',
    });

    const cookie = extractJsessionid(res);

    if (!cookie) {
      // Fallback: maybe the server returned 200 with an error page
      // (wrong credentials), or the header key is different.
      return {
        success: false,
        error: 'Invalid student ID or password.',
      };
    }

    // Persist everything
    await Promise.all([
      SecureStore.setItemAsync(SESSION_KEY, cookie),
      SecureStore.setItemAsync(EID_KEY, eid),
      SecureStore.setItemAsync(PW_KEY, pw),
    ]);

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: 'Network error — check your connection.',
    };
  }
}

/**
 * Silently re-authenticates using stored credentials.
 * Called automatically by the API client when a 401/302 is detected.
 * Returns true if re-auth succeeded.
 */
export async function reauth(): Promise<boolean> {
  const creds = await getStoredCredentials();
  if (!creds) return false;

  const result = await login(creds.eid, creds.pw);
  return result.success;
}

/**
 * Clears all stored session data and credentials.
 */
export async function logout(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_KEY),
    SecureStore.deleteItemAsync(EID_KEY),
    SecureStore.deleteItemAsync(PW_KEY),
  ]);
}

// ── Accessors ─────────────────────────────────────────────────────

/**
 * Returns the current JSESSIONID, or null if not logged in.
 */
export async function getSession(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

/**
 * Returns true if there is a stored session cookie.
 * Does NOT verify the session is still valid server-side.
 */
export async function hasSession(): Promise<boolean> {
  const s = await getSession();
  return s !== null;
}

/**
 * Returns stored credentials, or null if none exist.
 */
export async function getStoredCredentials(): Promise<StoredCredentials | null> {
  const [eid, pw] = await Promise.all([
    SecureStore.getItemAsync(EID_KEY),
    SecureStore.getItemAsync(PW_KEY),
  ]);
  if (!eid || !pw) return null;
  return { eid, pw };
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Extracts JSESSIONID from a fetch Response.
 *
 * React Native exposes set-cookie differently across platforms:
 *   - iOS:     response.headers.get('set-cookie')  → string
 *   - Android: response.headers.map['set-cookie']  → string | string[]
 *
 * We try both to be safe.
 */
function extractJsessionid(res: Response): string | null {
  // Try standard header first
  let raw: string | null = res.headers.get('set-cookie');

  // Android fallback: headers.map is a plain object on RN
  if (!raw) {
    const map = (res.headers as unknown as { map: Record<string, string | string[]> }).map;
    if (map) {
      const val = map['set-cookie'];
      raw = Array.isArray(val) ? val.join('; ') : val ?? null;
    }
  }

  if (!raw) return null;

  const match = raw.match(/JSESSIONID=([^;,\s]+)/i);
  return match ? match[1] : null;
}
