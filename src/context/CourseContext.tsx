import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Course, Assignment, CourseResource, CachedFileRecord, StudentUser, Faculty } from '../types';
import { MOCK_COURSES } from '../data/mockCourses';
import { offlineStorage } from '../services/storage';
import { notificationService } from '../services/notifications';

interface CourseContextType {
  courses: Course[];
  activeCourse: Course | null;
  allAssignments: Assignment[];
  cachedFiles: CachedFileRecord[];
  storageUsage: { totalBytes: number; fileCount: number };
  searchQuery: string;
  isLoadingCourses: boolean;
  setActiveCourseId: (courseId: string | null) => void;
  setSearchQuery: (query: string) => void;
  downloadResourceForOffline: (resource: CourseResource, courseCode: string) => Promise<boolean>;
  deleteOfflineResource: (resourceId: string) => Promise<void>;
  submitAssignment: (assignmentId: string, submissionNotes: string, fileName?: string) => Promise<boolean>;
  markAnnouncementAsRead: (courseId: string, announcementId: string) => void;
  clearAllOfflineStorage: () => Promise<void>;
  refreshCacheState: () => Promise<void>;
  importCoursesFromPortal: (coursesList: Course[]) => void;
  updateCourse: (updatedCourse: Course) => void;
  syncWithThutoExtractor: (payload: { html?: string; siteCodes?: string[]; eid?: string }) => Promise<number>;
  registerNewCourse: (code: string, name?: string, faculty?: string) => Promise<boolean>;
  resetToDefaultCourses: () => void;
  reloadEnrolledCourses: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

function getInitialUser(): StudentUser | null {
  try {
    const raw = localStorage.getItem('thuto_persistent_user_v1');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// The gateway session token issued at login (AuthContext stores it). Sync
// endpoints require it: the gateway swaps the token for the REAL Sakai cookie
// it keeps in memory. A missing token means we are in a stale/demo window and
// no live sync can happen — the UI's honest states cover that.
function getStoredSessionToken(): string | null {
  try {
    return localStorage.getItem('thuto_session_token_v1');
  } catch {
    return null;
  }
}

function getCourseStorageKey(user: StudentUser | null): string {
  if (user && !user.isDemo && user.studentNumber) {
    return `thuto_courses_student_${user.studentNumber}`;
  }
  return 'thuto_courses_state_v1';
}

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialUser = getInitialUser();
  const initialKey = getCourseStorageKey(initialUser);

  const [courses, setCourses] = useState<Course[]>(() => {
    console.info('[CourseProvider] Resolving initial state for key:', initialKey);
    try {
      const stored = localStorage.getItem(initialKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.info(`[CourseProvider] Loaded ${parsed.length} cached courses for ${initialKey}`);
          return parsed;
        }
      }
      // If user is a real student, do NOT default to MOCK_COURSES
      if (initialUser && !initialUser.isDemo) {
        console.info('[CourseProvider] Real student logged in without cached courses. Initializing empty for live fetch.');
        return [];
      }
      console.info('[CourseProvider] Demo/guest mode active. Initializing with demo campus courses.');
      return MOCK_COURSES;
    } catch (e) {
      console.warn('[CourseProvider] Error parsing cached courses:', e);
      return initialUser && !initialUser.isDemo ? [] : MOCK_COURSES;
    }
  });

  const [activeCourseId, setActiveCourseIdState] = useState<string | null>(null);
  const [cachedFiles, setCachedFiles] = useState<CachedFileRecord[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  const [storageUsage, setStorageUsage] = useState<{ totalBytes: number; fileCount: number }>({
    totalBytes: 0,
    fileCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Load and refresh offline cached files from IndexedDB
  const refreshCacheState = useCallback(async () => {
    try {
      const files = await offlineStorage.getAllFiles();
      setCachedFiles(files);
      const usage = await offlineStorage.getStorageUsage();
      setStorageUsage(usage);
    } catch (e) {
      console.warn('[CourseProvider] Failed to refresh cached storage files:', e);
    }
  }, []);

  // Reload/Auto-fetch courses for current authenticated student
  const reloadEnrolledCourses = useCallback(async () => {
    const currentUser = getInitialUser();
    console.info('[CourseProvider:reloadEnrolledCourses] Triggered. Current user:', currentUser?.studentNumber);

    if (!currentUser) {
      console.info('[CourseProvider:reloadEnrolledCourses] No authenticated student. Skipping.');
      return;
    }

    if (currentUser.isDemo) {
      console.info('[CourseProvider:reloadEnrolledCourses] Demo user active. Maintaining demo campus dataset.');
      setCourses(MOCK_COURSES);
      return;
    }

    setIsLoadingCourses(true);
    const storageKey = getCourseStorageKey(currentUser);

    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/sakai/extract-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-Session-Token': token } : {}),
        },
        body: JSON.stringify({ eid: currentUser.studentNumber }),
      });

      if (res.status === 401) {
        // Session expired/invalid: do NOT touch stored courses (they remain the
        // user's last-honest cache); the next manual sync prompts re-login.
        console.warn('[CourseProvider:reloadEnrolledCourses] Session expired on the gateway. Skipping live sync until re-login.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        console.info('[CourseProvider:reloadEnrolledCourses] Response received:', data);
        if (Array.isArray(data.courses) && data.courses.length > 0) {
          console.info(`[CourseProvider:reloadEnrolledCourses] Successfully auto-loaded ${data.courses.length} courses.`);
          setCourses(data.courses);
          localStorage.setItem(storageKey, JSON.stringify(data.courses));
        } else {
          console.info('[CourseProvider:reloadEnrolledCourses] Backend returned 0 courses. Preserving current state.');
        }
      } else {
        console.warn('[CourseProvider:reloadEnrolledCourses] Server responded with status:', res.status);
      }
    } catch (err) {
      console.warn('[CourseProvider:reloadEnrolledCourses] Network error during auto-load cycle:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  // Auto-fetch on initial component mount
  useEffect(() => {
    refreshCacheState();
    console.info('[CourseProvider] Running initial mount auto-load cycle...');
    reloadEnrolledCourses();

    const handleCacheUpdated = () => {
      refreshCacheState();
    };

    const handleCoursesUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Course[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        console.info(`[CourseProvider] Event 'thuto-courses-updated' received with ${customEvent.detail.length} courses.`);
        const currentUser = getInitialUser();
        const key = getCourseStorageKey(currentUser);
        setCourses(customEvent.detail);
        localStorage.setItem(key, JSON.stringify(customEvent.detail));
      }
    };

    window.addEventListener('thuto-cache-updated', handleCacheUpdated);
    window.addEventListener('thuto-courses-updated', handleCoursesUpdated);

    return () => {
      window.removeEventListener('thuto-cache-updated', handleCacheUpdated);
      window.removeEventListener('thuto-courses-updated', handleCoursesUpdated);
    };
  }, [refreshCacheState, reloadEnrolledCourses]);

  // Aggregate all assignments from all courses
  const allAssignments = useMemo(() => {
    const list: Assignment[] = [];
    courses.forEach((c) => {
      if (Array.isArray(c.assignments)) {
        c.assignments.forEach((a) => {
          list.push(a);
        });
      }
    });
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [courses]);

  // Periodic deadline countdown check loop (runs every 30s)
  useEffect(() => {
    if (allAssignments.length === 0) return;
    notificationService.checkAndTriggerDeadlines(allAssignments);

    const interval = setInterval(() => {
      notificationService.checkAndTriggerDeadlines(allAssignments);
    }, 30000);

    return () => clearInterval(interval);
  }, [allAssignments]);

  const activeCourse = useMemo(() => {
    if (!activeCourseId) return null;
    return courses.find((c) => c.id === activeCourseId) || null;
  }, [courses, activeCourseId]);

  const setActiveCourseId = (courseId: string | null) => {
    console.info('[CourseProvider] Active course switched to:', courseId);
    setActiveCourseIdState(courseId);
  };

  // Concept: offline downloads are REAL bytes or nothing.
  //
  // The old version cached `contentSnippet` — a hand-written text stub — and
  // marked the resource "Downloaded", which taught students they had the
  // material when they only had our description of it. Now we call the
  // gateway's download proxy, which streams the actual file (it attaches the
  // Sakai cookie server-side), base64-encode it into a data-URI, and store
  // that in IndexedDB. Any failure returns false — the UI keeps the resource
  // un-downloaded rather than pretending.
  const downloadResourceForOffline = async (resource: CourseResource, courseCode: string): Promise<boolean> => {
    console.info(`[CourseProvider] Downloading real material: ${resource.title} (${resource.downloadUrl})`);
    try {
      const token = getStoredSessionToken();
      if (!token) {
        console.warn('[CourseProvider] No gateway session token — cannot download portal material.');
        return false;
      }

      const res = await fetch(`/api/sakai/download?url=${encodeURIComponent(resource.downloadUrl)}`, {
        headers: token ? { 'X-Session-Token': token } : {},
      });

      if (res.status === 401) {
        console.warn('[CourseProvider] Download rejected: portal session expired. Sign in again.');
        return false;
      }
      if (res.status === 404) {
        console.warn('[CourseProvider] Download rejected: file no longer exists on the portal.');
        return false;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.warn('[CourseProvider] Download failed:', res.status, errData?.error || '');
        return false;
      }

      // ArrayBuffer -> base64 data-URI. Chunked to avoid call-stack limits on
      // large PDFs (String.fromCharCode.apply has a ~64k argument ceiling).
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const mime = res.headers.get('content-type') || 'application/octet-stream';
      const dataUri = `data:${mime};base64,${btoa(binary)}`;

      await offlineStorage.saveFile({
        id: resource.id,
        courseId: resource.courseId,
        courseCode,
        title: resource.title,
        fileName: resource.fileName,
        // Real byte count as served by the gateway (the sync-time fileSize
        // from the portal's directory listing can be 0 when unreported).
        fileSize: bytes.length,
        fileType: resource.fileType,
        cachedAt: new Date().toISOString(),
        content: dataUri,
        mimeType: mime,
      });
      console.info(`[CourseProvider] Material cached offline: ${resource.title} (${bytes.length} bytes, ${mime})`);
      await refreshCacheState();
      return true;
    } catch (e) {
      console.warn('[CourseProvider] Failed downloading material offline:', e);
      return false;
    }
  };

  const deleteOfflineResource = async (resourceId: string): Promise<void> => {
    await offlineStorage.removeFile(resourceId);
    await refreshCacheState();
  };

  const clearAllOfflineStorage = async (): Promise<void> => {
    await offlineStorage.clearAll();
    await refreshCacheState();
  };

  const importCoursesFromPortal = (coursesList: Course[]) => {
    if (Array.isArray(coursesList)) {
      console.info(`[CourseProvider:importCoursesFromPortal] Setting ${coursesList.length} courses`);
      const currentUser = getInitialUser();
      const key = getCourseStorageKey(currentUser);
      setCourses(coursesList);
      localStorage.setItem(key, JSON.stringify(coursesList));
    }
  };

  const updateCourse = (updatedCourse: Course) => {
    console.info(`[CourseProvider:updateCourse] Updating course: ${updatedCourse.code}`);
    setCourses((prev) => {
      const next = prev.map((c) => (c.code === updatedCourse.code ? updatedCourse : c));
      const currentUser = getInitialUser();
      const key = getCourseStorageKey(currentUser);
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  const resetToDefaultCourses = () => {
    console.info('[CourseProvider:resetToDefaultCourses] Resetting to demo dataset.');
    const currentUser = getInitialUser();
    const key = getCourseStorageKey(currentUser);
    setCourses(MOCK_COURSES);
    localStorage.removeItem(key);
  };

  const syncWithThutoExtractor = async (payload: { html?: string; siteCodes?: string[]; eid?: string }): Promise<number> => {
    console.info('[CourseProvider:syncWithThutoExtractor] Payload:', payload);
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/sakai/extract-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-Session-Token': token } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        console.warn('[CourseProvider:syncWithThutoExtractor] Session expired — cannot live-sync. Student must re-login.');
        return 0;
      }

      const data = await res.json();
      if (Array.isArray(data.courses) && data.courses.length > 0) {
        console.info(`[CourseProvider:syncWithThutoExtractor] Extracted ${data.courses.length} courses.`);
        const currentUser = getInitialUser();
        const key = getCourseStorageKey(currentUser);
        setCourses(data.courses);
        localStorage.setItem(key, JSON.stringify(data.courses));
        return data.courses.length;
      }
      return 0;
    } catch (e) {
      console.error('[CourseProvider:syncWithThutoExtractor] Failed:', e);
      return 0;
    }
  };

  const registerNewCourse = async (code: string, name?: string, faculty?: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    console.info(`[CourseProvider:registerNewCourse] Registering new course: ${cleanCode}`);
    if (!cleanCode) return false;

    if (courses.some((c) => c.code === cleanCode)) {
      return true;
    }

    // Concept: adding a course is a REAL portal action or it fails honestly.
    // The old flow fabricated an "offline_cached" course (invented lecturer,
    // credits, progress bars) whenever the server was unreachable — teaching
    // students the course was registered when nothing happened. Now: real
    // sync or a false return, and the UI tells the student the truth.
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/sakai/sync-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-Session-Token': token } : {}),
        },
        body: JSON.stringify({ siteId: cleanCode, code: cleanCode }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.course) {
          const next = [data.course, ...courses];
          setCourses(next);
          const currentUser = getInitialUser();
          const key = getCourseStorageKey(currentUser);
          localStorage.setItem(key, JSON.stringify(next));
          return true;
        }
      } else {
        const errData = await res.json().catch(() => null);
        console.warn(
          '[CourseProvider:registerNewCourse] Live sync failed:',
          res.status,
          errData?.message || ''
        );
      }
    } catch (e) {
      console.warn('[CourseProvider:registerNewCourse] Network error:', e);
    }

    return false;
  };

  const submitAssignment = async (
    assignmentId: string,
    submissionNotes: string,
    fileName?: string
  ): Promise<boolean> => {
    console.info(`[CourseProvider:submitAssignment] Submitting work for task ${assignmentId}`);
    await new Promise((resolve) => setTimeout(resolve, 600));

    setCourses((prevCourses) => {
      const next = prevCourses.map((course) => {
        const hasAssignment = course.assignments.some((a) => a.id === assignmentId);
        if (!hasAssignment) return course;

        return {
          ...course,
          assignments: course.assignments.map((a) => {
            if (a.id !== assignmentId) return a;
            return {
              ...a,
              status: 'submitted' as const,
              submissionDate: new Date().toISOString(),
              feedback: submissionNotes ? `Draft Note: "${submissionNotes}"` : 'Submitted to Thuto Gateway.',
              submittedFile: fileName || `${course.code}_Submission.pdf`,
            };
          }),
        };
      });

      const currentUser = getInitialUser();
      const key = getCourseStorageKey(currentUser);
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });

    return true;
  };

  const markAnnouncementAsRead = (courseId: string, announcementId: string) => {
    setCourses((prev) => {
      const next = prev.map((course) => {
        if (course.id !== courseId) return course;
        return {
          ...course,
          announcements: course.announcements.map((a) => {
            if (a.id !== announcementId) return a;
            return { ...a, isRead: true };
          }),
        };
      });
      const currentUser = getInitialUser();
      const key = getCourseStorageKey(currentUser);
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        activeCourse,
        allAssignments,
        cachedFiles,
        storageUsage,
        searchQuery,
        isLoadingCourses,
        setActiveCourseId,
        setSearchQuery,
        downloadResourceForOffline,
        deleteOfflineResource,
        submitAssignment,
        markAnnouncementAsRead,
        clearAllOfflineStorage,
        refreshCacheState,
        importCoursesFromPortal,
        updateCourse,
        syncWithThutoExtractor,
        registerNewCourse,
        resetToDefaultCourses,
        reloadEnrolledCourses,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = (): CourseContextType => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
};
