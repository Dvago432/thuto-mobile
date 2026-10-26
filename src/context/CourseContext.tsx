import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Course, Assignment, CourseResource, CachedFileRecord } from '../types';
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
  selectedFaculty: string;
  setActiveCourseId: (courseId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFaculty: (faculty: string) => void;
  downloadResourceForOffline: (resource: CourseResource, courseCode: string) => Promise<boolean>;
  deleteOfflineResource: (resourceId: string) => Promise<void>;
  submitAssignment: (assignmentId: string, submissionNotes: string, fileName?: string) => Promise<boolean>;
  markAnnouncementAsRead: (courseId: string, announcementId: string) => void;
  clearAllOfflineStorage: () => Promise<void>;
  refreshCacheState: () => Promise<void>;
  importCoursesFromPortal: (coursesList: Course[]) => void;
  updateCourse: (updatedCourse: Course) => void;
  syncWithThutoExtractor: (payload: { html?: string; siteCodes?: string[] }) => Promise<number>;
  registerNewCourse: (code: string, name?: string, faculty?: string) => Promise<boolean>;
  resetToDefaultCourses: () => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const stored = localStorage.getItem('thuto_courses_state_v1');
      return stored ? JSON.parse(stored) : MOCK_COURSES;
    } catch {
      return MOCK_COURSES;
    }
  });

  const [activeCourseId, setActiveCourseIdState] = useState<string | null>(null);
  const [cachedFiles, setCachedFiles] = useState<CachedFileRecord[]>([]);
  const [storageUsage, setStorageUsage] = useState<{ totalBytes: number; fileCount: number }>({
    totalBytes: 0,
    fileCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('All');

  // Load and refresh offline cached files from IndexedDB
  const refreshCacheState = useCallback(async () => {
    try {
      const files = await offlineStorage.getAllFiles();
      setCachedFiles(files);
      const usage = await offlineStorage.getStorageUsage();
      setStorageUsage(usage);
    } catch (e) {
      console.warn('Failed to refresh cached storage files:', e);
    }
  }, []);

  useEffect(() => {
    refreshCacheState();

    const handleCacheUpdated = () => {
      refreshCacheState();
    };

    const handleCoursesUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Course[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail) && customEvent.detail.length > 0) {
        setCourses(customEvent.detail);
        localStorage.setItem('thuto_courses_state_v1', JSON.stringify(customEvent.detail));
      }
    };

    window.addEventListener('thuto-cache-updated', handleCacheUpdated);
    window.addEventListener('thuto-courses-updated', handleCoursesUpdated);

    return () => {
      window.removeEventListener('thuto-cache-updated', handleCacheUpdated);
      window.removeEventListener('thuto-courses-updated', handleCoursesUpdated);
    };
  }, [refreshCacheState]);

  // Aggregate all assignments from all courses
  const allAssignments = useMemo(() => {
    const list: Assignment[] = [];
    courses.forEach((c) => {
      c.assignments.forEach((a) => {
        list.push(a);
      });
    });
    // Sort by due date ascending
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [courses]);

  // Periodic deadline countdown check loop (runs every 30s)
  useEffect(() => {
    notificationService.checkAndTriggerDeadlines(allAssignments);

    const interval = setInterval(() => {
      notificationService.checkAndTriggerDeadlines(allAssignments);
    }, 30000);

    return () => clearInterval(interval);
  }, [allAssignments]);

  // Save courses state changes
  useEffect(() => {
    localStorage.setItem('thuto_courses_state_v1', JSON.stringify(courses));
  }, [courses]);

  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === activeCourseId) || null;
  }, [courses, activeCourseId]);

  const setActiveCourseId = (id: string | null) => {
    setActiveCourseIdState(id);
  };

  const importCoursesFromPortal = (coursesList: Course[]) => {
    if (Array.isArray(coursesList) && coursesList.length > 0) {
      setCourses(coursesList);
    }
  };

  const updateCourse = (updatedCourse: Course) => {
    setCourses((prev) =>
      prev.map((c) => (c.code === updatedCourse.code ? updatedCourse : c))
    );
  };

  const resetToDefaultCourses = () => {
    setCourses(MOCK_COURSES);
    localStorage.removeItem('thuto_courses_state_v1');
  };

  const syncWithThutoExtractor = async (payload: { html?: string; siteCodes?: string[] }): Promise<number> => {
    try {
      const res = await fetch('/api/sakai/extract-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.courses && data.courses.length > 0) {
        setCourses(data.courses);
        return data.courses.length;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const registerNewCourse = async (code: string, name?: string, faculty?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/sakai/register-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, faculty }),
      });
      const data = await res.json();
      if (data.course) {
        setCourses((prev) => {
          const filtered = prev.filter((c) => c.code !== data.course.code);
          return [data.course, ...filtered];
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const downloadResourceForOffline = async (
    resource: CourseResource,
    courseCode: string
  ): Promise<boolean> => {
    try {
      const record: CachedFileRecord = {
        id: resource.id,
        courseId: resource.courseId,
        courseCode,
        title: resource.title,
        fileName: resource.fileName,
        fileSize: resource.fileSize,
        fileType: resource.fileType,
        cachedAt: new Date().toISOString(),
        content: resource.contentSnippet || 'Course material cached for offline access on Thuto Mobile.',
      };

      await offlineStorage.saveFile(record);
      await refreshCacheState();
      return true;
    } catch (e) {
      console.error('Failed to save file for offline:', e);
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

  const submitAssignment = async (
    assignmentId: string,
    submissionNotes: string,
    fileName?: string
  ): Promise<boolean> => {
    // Simulate upload latency to university portal
    await new Promise((r) => setTimeout(r, 800));

    setCourses((prev) =>
      prev.map((course) => {
        const hasAssignment = course.assignments.some((a) => a.id === assignmentId);
        if (!hasAssignment) return course;

        return {
          ...course,
          assignments: course.assignments.map((a) => {
            if (a.id === assignmentId) {
              return {
                ...a,
                status: 'submitted',
                submittedAt: new Date().toISOString(),
                feedback: fileName
                  ? `Uploaded file: ${fileName}. Notes: ${submissionNotes || 'No additional student comments.'}`
                  : `Online text submission recorded. Notes: ${submissionNotes}`,
              };
            }
            return a;
          }),
        };
      })
    );

    return true;
  };

  const markAnnouncementAsRead = (courseId: string, announcementId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          announcements: c.announcements.map((ann) => {
            if (ann.id === announcementId) return { ...ann, isRead: true };
            return ann;
          }),
        };
      })
    );
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
        selectedFaculty,
        setActiveCourseId,
        setSearchQuery,
        setSelectedFaculty,
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
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
};
