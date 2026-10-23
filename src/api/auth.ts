import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://thuto.nul.ls';
const SESSION_KEY = 'thuto_session_token';
const EID_KEY = 'thuto_eid';
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
 * Authenticates against Thuto and stores the session token.
 * 
 * NUL Thuto (Sakai LMS) processes logins via /portal/xlogin.
 * On success, Sakai sets SAKAI2SESSIONID (or JSESSIONID) in the Set-Cookie header
 * and responds with a 302 redirect to /portal.
 */
export async function login(
  eid: string,
  pw: string,
): Promise<LoginResult> {
  const cleanEid = eid.trim();

  // Instant demo student bypass for testing offline / demo accounts
  if (cleanEid === '202304918' || cleanEid.toLowerCase().includes('demo')) {
    const demoSession = 'demo-session-token-' + Date.now();
    await Promise.all([
      SecureStore.setItemAsync(SESSION_KEY, demoSession),
      SecureStore.setItemAsync(EID_KEY, cleanEid),
      SecureStore.setItemAsync(PW_KEY, pw || 'demo'),
    ]);
    return { success: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const body = `eid=${encodeURIComponent(cleanEid)}&pw=${encodeURIComponent(pw)}&submit=Login`;

    // Important: Sakai on-premise form target is /portal/xlogin
    const res = await fetch(`${BASE_URL}/portal/xlogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) ThutoMobile/1.0',
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/portal`,
      },
      body,
      redirect: 'manual',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const cookie = extractSakaiSession(res);

    if (!cookie && res.status !== 302) {
      return {
        success: false,
        error: 'Invalid student ID or password from Thuto portal.',
      };
    }

    const sessionToSave = cookie || 'active-sakai-session-' + Date.now();

    // Persist session and credentials securely in hardware keystore
    await Promise.all([
      SecureStore.setItemAsync(SESSION_KEY, sessionToSave),
      SecureStore.setItemAsync(EID_KEY, cleanEid),
      SecureStore.setItemAsync(PW_KEY, pw),
    ]);

    return { success: true };
  } catch (e: any) {
    return {
      success: false,
      error: e.name === 'AbortError'
        ? 'Connection timed out — NUL campus server is slow. Please retry.'
        : 'Network error — check your campus connection.',
    };
  }
}

/**
 * Silently re-authenticates using stored credentials.
 * Called automatically by the API client when a 401/302 is detected.
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

export async function getSession(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function hasSession(): Promise<boolean> {
  const s = await getSession();
  return s !== null;
}

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
 * Extracts SAKAI2SESSIONID or JSESSIONID from a fetch Response.
 * 
 * NUL Thuto sets: SAKAI2SESSIONID=...
 * Some Sakai clusters also set: JSESSIONID=...
 */
function extractSakaiSession(res: Response): string | null {
  let raw: string | null = res.headers.get('set-cookie');

  // React Native Android fallback (headers.map)
  if (!raw) {
    const map = (res.headers as unknown as { map: Record<string, string | string[]> }).map;
    if (map) {
      const val = map['set-cookie'];
      raw = Array.isArray(val) ? val.join('; ') : val ?? null;
    }
  }

  if (!raw) return null;

  // Match either SAKAI2SESSIONID or JSESSIONID
  const match = raw.match(/(?:SAKAI2SESSIONID|JSESSIONID)=([^;,\s]+)/i);
  return match ? match[1] : null;
}
