import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentUser } from '../types';
import { notificationService } from '../services/notifications';

/**
 * Result of a login attempt. A discriminated union so the UI can never
 * "accidentally" treat a failure as success — the shape itself enforces it.
 *   success:true   -> user is set
 *   success:false  -> a real reason (invalid / unreachable / rate-limited)
 */
export type LoginResult =
  | { success: true }
  | { success: false; reason: 'invalid' | 'unreachable' | 'rate-limited' | 'unknown'; message: string };

interface AuthContextType {
  user: StudentUser | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  isPersistent: boolean;
  hasPIN: boolean;
  portalMode: 'live' | 'demo';
  /** Opaque gateway session token (the real Sakai cookie stays server-side). */
  sessionToken: string | null;
  /** Student-controlled persistent login (item 9): disabled -> browser forgets. */
  setStaySignedIn: (enabled: boolean) => void;
  login: (
    studentId: string,
    password?: string,
    isDemo?: boolean,
    staySignedIn?: boolean
  ) => Promise<LoginResult>;
  logout: () => void;
  lockApp: () => void;
  unlockWithPIN: (pin: string) => boolean;
  setQuickPIN: (pin: string | null) => void;
  setPortalMode: (mode: 'live' | 'demo') => void;
}

const AUTH_USER_KEY = 'thuto_persistent_user_v1';
const AUTH_PIN_KEY = 'thuto_security_pin_v1';
const AUTH_SETTINGS_KEY = 'thuto_auth_settings_v1';
// Opaque gateway token (NOT the Sakai cookie — that stays server-side). It
// proves "this browser == that authenticated session" to the gateway when the
// student triggers course syncs.
const AUTH_SESSION_TOKEN_KEY = 'thuto_session_token_v1';

// The persistent-login SETTING is the single source of truth for whether this
// browser restores the signed-in student after a full reload/close. Kept as a
// storage accessor (not React state) because both the RESTORE decision at
// provider mount and the in-app toggle need it before/without a render.
function getStaySignedIn(): boolean {
  try {
    const settings = localStorage.getItem(AUTH_SETTINGS_KEY);
    return settings ? JSON.parse(settings).staySignedIn !== false : true;
  } catch {
    return true;
  }
}

const DEMO_STUDENT: StudentUser = {
  id: 'student-202304918',
  studentNumber: '202304918',
  fullName: 'Khotso Mokhele',
  program: 'B.Sc. in Computer Science & Applied Mathematics',
  year: 3,
  faculty: 'Faculty of Science & Technology',
  email: '202304918@nul.ls',
  isDemo: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StudentUser | null>(() => {
    // Persistent login is a SETTING, not a side effect: when the student has
    // disabled it, this browser must NOT restore the saved user after a
    // reload — they get the honest login screen back.
    if (!getStaySignedIn()) return null;
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [hasPIN, setHasPIN] = useState<boolean>(() => {
    return !!localStorage.getItem(AUTH_PIN_KEY);
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const pin = localStorage.getItem(AUTH_PIN_KEY);
    const userStored = localStorage.getItem(AUTH_USER_KEY);
    // If user is saved and PIN is configured, start locked for privacy
    return !!(pin && userStored);
  });

  const [isPersistent, setIsPersistent] = useState<boolean>(() => getStaySignedIn());

  const [portalMode, setPortalMode] = useState<'live' | 'demo'>('demo');
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    // Same rule as the user restore: no persistent login, no restored gateway
    // session. The token only re-enters storage through an explicit login.
    if (!getStaySignedIn()) return null;
    return localStorage.getItem(AUTH_SESSION_TOKEN_KEY);
  });

  useEffect(() => {
    if (sessionToken) {
      localStorage.setItem(AUTH_SESSION_TOKEN_KEY, sessionToken);
    } else {
      localStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (user && isPersistent) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else if (!user) {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [user, isPersistent]);

  // Item-9 caveat: the student owns the persistence decision. Disabling
  // applies IMMEDIATELY (this session remains signed in, but the browser
  // forgets everything on close/reload); enabling persists what is live
  // right now. Called from the Profile settings toggle.
  const setStaySignedIn = (enabled: boolean) => {
    setIsPersistent(enabled);
    try {
      localStorage.setItem(AUTH_SETTINGS_KEY, JSON.stringify({ staySignedIn: enabled }));
      if (enabled) {
        if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        if (sessionToken) localStorage.setItem(AUTH_SESSION_TOKEN_KEY, sessionToken);
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
      }
    } catch {
      // storage unavailable — the React state still governs this session
    }
  };

  const login = async (
    studentId: string,
    password?: string,
    isDemo = false,
    staySignedIn = true
  ): Promise<LoginResult> => {
    // Demo is an EXPLICIT, client-only path. It never touches the network and
    // never fabricates a "live" session — it is clearly labelled demo mode.
    if (isDemo) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const demoUser: StudentUser = { ...DEMO_STUDENT };
      setPortalMode('demo');
      setSessionToken(null);
      setIsPersistent(staySignedIn);
      localStorage.setItem(AUTH_SETTINGS_KEY, JSON.stringify({ staySignedIn }));
      if (staySignedIn) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(demoUser));
      }
      setUser(demoUser);
      setIsLocked(false);
      // Demo never touches the gateway — clear any stale live token NOW (same
      // synchronous-write race discipline as the live path below).
      try {
        localStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
      } catch {
        // storage unavailable
      }
      window.dispatchEvent(new CustomEvent('thuto-auth-settled', { detail: { sessionToken: null } }));
      return { success: true };
    }

    // Live portal login. There is NO fallback that invents a user — if the
    // gateway says no, we surface the reason and stay logged out (fail-closed).
    try {
      const response = await fetch('/api/sakai/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eid: studentId.trim(), pw: password }),
      });
      const data = await response.json();

      if (data.authenticated && data.user) {
        const liveUser: StudentUser = { ...data.user, isDemo: false };
        setPortalMode('live');
        setSessionToken(data.sessionToken || null);
        setIsPersistent(staySignedIn);
        localStorage.setItem(AUTH_SETTINGS_KEY, JSON.stringify({ staySignedIn }));
        if (staySignedIn) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(liveUser));
        }
        setUser(liveUser);
        setIsLocked(false);
        // Concept: the sweep must see the token NOW. The sessionToken state
        // change above is persisted to localStorage by a useEffect, which
        // React runs only AFTER paint — but the 'thuto-auth-settled' event is
        // dispatched synchronously on the line below, and CourseProvider's
        // sweep reads localStorage. Writing the fresh token (and user) there
        // first removes a race that let a STALE portal token win the sweep
        // (visible after every server redeploy / free-tier spin-down, when
        // the gateway's in-memory session store is empty: the sweep 401s and
        // quietly skips — "login works, auto-load doesn't").
        try {
          localStorage.setItem(AUTH_SESSION_TOKEN_KEY, data.sessionToken || '');
          if (staySignedIn) {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(liveUser));
          }
          localStorage.setItem(AUTH_SETTINGS_KEY, JSON.stringify({ staySignedIn }));
        } catch {
          // storage unavailable — the useEffect remains the fallback path
        }
        // Concept: cross-provider signaling. CourseProvider mounts BEFORE this
        // provider, so its mount-time course sweep ran with no session and
        // skipped — that is why students had to sync materials manually after
        // every login. Rather than coupling the providers together, login
        // completion is announced; CourseProvider listens and re-runs its
        // sweep. The fresh token rides IN the event (belt to the suspenders
        // above): the listener has the exact token of THIS login, matched
        // against the server store, so no racing reader can misconstrue it.
        window.dispatchEvent(
          new CustomEvent('thuto-auth-settled', { detail: { sessionToken: data.sessionToken || null } })
        );
        // Caveat item 5: ONE default-moment permission ask, immediately after
        // the first successful login — the classic good moment (intent clear,
        // reward visible). The browser itself never re-prompts after a denial,
        // so this cannot become nagging; the in-app Enable button remains for
        // anyone who dismissed or blocked it.
        try {
          void notificationService.requestPermission();
        } catch {
          // Notification API unavailable in this environment
        }
        return { success: true };
      }

      // The gateway told us the login failed — respect it verbatim.
      if (data.rateLimited) {
        return { success: false, reason: 'rate-limited', message: data.message || 'Too many attempts. Try again later.' };
      }
      if (data.unreachable) {
        return { success: false, reason: 'unreachable', message: data.message || 'Could not reach the university portal.' };
      }
      return {
        success: false,
        reason: 'invalid',
        message: data.message || 'Invalid student ID or password.',
      };
    } catch {
      // Network error reaching OUR OWN gateway (not the portal). Report honestly.
      return {
        success: false,
        reason: 'unreachable',
        message: 'Could not reach the login service. Check your connection and try again.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setIsLocked(false);
    setSessionToken(null);
    setPortalMode('demo');
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const lockApp = () => {
    if (hasPIN) {
      setIsLocked(true);
    }
  };

  const unlockWithPIN = (pin: string): boolean => {
    const savedPin = localStorage.getItem(AUTH_PIN_KEY);
    if (savedPin && savedPin === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setQuickPIN = (pin: string | null) => {
    if (pin && pin.length === 4) {
      localStorage.setItem(AUTH_PIN_KEY, pin);
      setHasPIN(true);
    } else {
      localStorage.removeItem(AUTH_PIN_KEY);
      setHasPIN(false);
      setIsLocked(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLocked,
        isPersistent,
        hasPIN,
        portalMode,
        sessionToken,
        setStaySignedIn,
        login,
        logout,
        lockApp,
        unlockWithPIN,
        setQuickPIN,
        setPortalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
