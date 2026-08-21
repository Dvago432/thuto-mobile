import { useState, useEffect, useCallback } from 'react';
import { login as authLogin, logout as authLogout, hasSession } from '../api/auth';
import type { LoginResult } from '../api/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface UseAuthReturn {
  status: AuthStatus;
  login: (eid: string, pw: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

/**
 * Manages authentication state for the root navigator.
 *
 * On mount, checks SecureStore for an existing session and sets
 * status accordingly. Exposes login/logout actions that update state.
 */
export function useAuth(): UseAuthReturn {
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Check for an existing session on app launch
  useEffect(() => {
    hasSession().then((has) => {
      setStatus(has ? 'authenticated' : 'unauthenticated');
    });
  }, []);

  const login = useCallback(async (eid: string, pw: string): Promise<LoginResult> => {
    const result = await authLogin(eid, pw);
    if (result.success) {
      setStatus('authenticated');
    }
    return result;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authLogout();
    setStatus('unauthenticated');
  }, []);

  return { status, login, logout };
}
