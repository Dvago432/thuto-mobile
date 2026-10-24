import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentUser } from '../types';

interface AuthContextType {
  user: StudentUser | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  isPersistent: boolean;
  hasPIN: boolean;
  portalMode: 'live' | 'demo';
  login: (studentId: string, password?: string, isDemo?: boolean, staySignedIn?: boolean) => Promise<boolean>;
  logout: () => void;
  lockApp: () => void;
  unlockWithPIN: (pin: string) => boolean;
  setQuickPIN: (pin: string | null) => void;
  setPortalMode: (mode: 'live' | 'demo') => void;
}

const AUTH_USER_KEY = 'thuto_persistent_user_v1';
const AUTH_PIN_KEY = 'thuto_security_pin_v1';
const AUTH_SETTINGS_KEY = 'thuto_auth_settings_v1';

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
  ): Promise<boolean> => {
    let authenticatedUser: StudentUser;

    if (isDemo || studentId.toLowerCase().includes('demo') || (studentId === '202304918' && !password)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      authenticatedUser = { ...DEMO_STUDENT };
      setPortalMode('demo');
    } else {
      try {
        const response = await fetch('/api/sakai/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eid: studentId.trim(), pw: password, isDemo: false }),
        });
        const data = await response.json();
        if (data.user) {
          authenticatedUser = data.user;
          setPortalMode('live');
        } else {
          authenticatedUser = {
            id: `student-${studentId.trim()}`,
            studentNumber: studentId.trim(),
            fullName: `Student ${studentId.trim()}`,
            program: 'Enrolled Degree Program',
            year: 3,
            faculty: 'Faculty of Science & Technology',
            email: `${studentId.trim()}@nul.ls`,
            isDemo: false,
          };
          setPortalMode('live');
        }

        if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
          window.dispatchEvent(new CustomEvent('thuto-courses-updated', { detail: data.courses }));
        }
      } catch {
        authenticatedUser = {
          id: `student-${studentId.trim()}`,
          studentNumber: studentId.trim(),
          fullName: `Student ${studentId.trim()}`,
          program: 'Enrolled Degree Program',
          year: 2,
          faculty: 'Faculty of Science & Technology',
          email: `${studentId.trim()}@nul.ls`,
          isDemo: false,
        };
        setPortalMode('live');
      }
    }

    setIsPersistent(staySignedIn);
    localStorage.setItem(AUTH_SETTINGS_KEY, JSON.stringify({ staySignedIn }));
    if (staySignedIn) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authenticatedUser));
    }
    setUser(authenticatedUser);
    setIsLocked(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsLocked(false);
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
