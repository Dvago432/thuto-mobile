export type Faculty = 
  | 'Faculty of Science & Technology'
  | 'Faculty of Law'
  | 'Faculty of Social Sciences'
  | 'Faculty of Health Sciences'
  | 'Faculty of Education'
  | 'Faculty of Humanities';

export type CourseDataSource = 'live_thuto' | 'offline_cached' | 'seeded_fallback';

export interface CourseResource {
  id: string;
  courseId: string;
  title: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: 'pdf' | 'pptx' | 'docx' | 'code' | 'zip';
  uploadedAt: string;
  topic: string;
  downloadUrl: string;
  contentSnippet?: string; // used for in-app offline preview
  isDownloaded?: boolean;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  description: string;
  dueDate: string; // ISO string
  points: number;
  status: 'pending' | 'submitted' | 'graded';
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  attachments?: CourseResource[];
  allowSubmissions: boolean;
}

export interface CourseAnnouncement {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  author: string;
  date: string;
  content: string;
  isImportant?: boolean;
  isRead?: boolean;
}

export interface DropboxItem {
  id: string;
  courseId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: 'student' | 'instructor';
  note?: string;
  status: 'submitted' | 'reviewed';
  feedback?: string;
}

export interface CourseModule {
  id: string;
  week: number;
  title: string;
  description: string;
  resources: CourseResource[];
}

export interface Course {
  id: string;
  siteId?: string;
  code: string;
  name: string;
  faculty: Faculty;
  instructor: string;
  instructorEmail: string;
  semester: string;
  credits: number;
  color: string;
  progressPercent: number;
  attendancePercent: number;
  modules: CourseModule[];
  assignments: Assignment[];
  announcements: CourseAnnouncement[];
  dropboxItems?: DropboxItem[];
  syllabusOverview: string;
  dataSource?: CourseDataSource;
  dataSourceNotice?: string;
  lastSyncedAt?: string;
}

export interface StudentUser {
  id: string;
  studentNumber: string;
  fullName: string;
  /**
   * program / year / faculty are NOT part of the Sakai user profile. The portal
   * only reliably returns eid, displayName and email. We mark these as nullable
   * so we never fabricate academic details we cannot verify against a real source.
   * Demo mode (mock data) supplies real values; live mode shows an honest "—".
   */
  program: string | null;
  year: number | null;
  faculty: Faculty | null;
  email: string;
  avatarUrl?: string;
  isDemo: boolean;
}

export interface NotificationRule {
  key: '3d' | '24h' | '6h' | '3h' | '1h';
  label: string;
  secondsBefore: number;
  enabled: boolean;
  description: string;
}

export interface TriggeredNotification {
  id: string;
  assignmentId: string;
  courseCode: string;
  assignmentTitle: string;
  thresholdLabel: string;
  triggeredAt: string;
  read: boolean;
}

export interface CachedFileRecord {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'pptx' | 'docx' | 'code' | 'zip';
  cachedAt: string;
  content: string; // Text / base64 preview content
}
