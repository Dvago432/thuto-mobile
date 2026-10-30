import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentUser } from '../types';

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

  const [isPersistent, setIsPersistent] = useState<boolean>(() => {
    try {
      const settings = localStorage.getItem(AUTH_SETTINGS_KEY);
      return settings ? JSON.parse(settings).staySignedIn !== false : true;
    } catch {
      return true;
    }
  });

  const [portalMode, setPortalMode] = useState<'live' | 'demo'>('demo');
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
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
      window.dispatchEvent(new Event('thuto-auth-settled'));
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
        // Concept: cross-provider signaling. CourseProvider mounts BEFORE this
        // provider, so its mount-time course sweep ran with no session and
        // skipped — that is why students had to sync materials manually after
        // every login. Rather than coupling the providers together, login
        // completion is announced; CourseProvider listens and re-runs its sweep.
        window.dispatchEvent(new Event('thuto-auth-settled'));
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
