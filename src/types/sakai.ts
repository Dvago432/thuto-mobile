/**
 * TypeScript types for the Thuto (Sakai) REST API.
 * Based on /direct/ endpoint responses from thuto.nul.ls.
 */

// ── Auth ──────────────────────────────────────────────────────────

export interface SessionState {
  jsessionid: string | null;
  userId: string | null;
}

// ── User ──────────────────────────────────────────────────────────

export interface SakaiUser {
  id: string;
  eid: string;         // student ID / username
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
}

// ── Site (Course) ─────────────────────────────────────────────────

export interface SakaiSitePage {
  id: string;
  title: string;
  url: string;
  homePage: boolean;
  position: number;
}

export interface SakaiSite {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  type: 'course' | 'project';
  published: boolean;
  sitePages: SakaiSitePage[];
  props: Record<string, string>;
  userRoles: string[];
}

export interface SakaiSiteCollection {
  entityPrefix: string;
  site_collection: SakaiSite[];
}

// ── Announcement ──────────────────────────────────────────────────

export interface SakaiAnnouncement {
  id: string;
  title: string;
  body: string;
  siteId: string;
  siteTitle: string;
  createdByDisplayName: string;
  createdOn: number;        // Unix ms timestamp
  modifiedOn: number;
  attachments: SakaiAttachment[];
}

export interface SakaiAnnouncementCollection {
  announcement_collection: SakaiAnnouncement[];
}

// ── Assignment ────────────────────────────────────────────────────

export type AssignmentStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'GRADED';

export interface SakaiAssignment {
  id: string;
  title: string;
  instructions: string;
  context: string;          // siteId
  dueTime: {
    time: number;           // Unix ms timestamp
    display: string;
  };
  openTime: {
    time: number;
    display: string;
  };
  status: AssignmentStatus;
  maxGradePoint: number;
  gradeScale: string;
  attachments: SakaiAttachment[];
  submissions?: SakaiSubmission[];
}

export interface SakaiAssignmentCollection {
  assignment_collection: SakaiAssignment[];
}

export interface SakaiSubmission {
  id: string;
  submitted: boolean;
  submittedTime?: {
    time: number;
    display: string;
  };
  gradeReleased: boolean;
  grade?: string;
}

// ── Gradebook ─────────────────────────────────────────────────────

export interface GradebookItem {
  itemName: string;
  score: number | null;
  points: number;
  dueDate: number | null;
  counted: boolean;
}

export interface GradebookEntry {
  courseGrade: string | null;
  courseGradeFormatted: string | null;
  items: GradebookItem[];
}

// ── Resource ──────────────────────────────────────────────────────

export interface SakaiResource {
  id: string;
  title: string;
  url: string;
  size: number;
  type: string;             // MIME type
  container: boolean;       // true = folder
  children?: SakaiResource[];
}

export interface SakaiResourceCollection {
  content_collection: SakaiResource[];
}

// ── Attachment ────────────────────────────────────────────────────

export interface SakaiAttachment {
  name: string;
  url: string;
  type: string;
}

// ── App-level types ───────────────────────────────────────────────

/** Normalised course shape used throughout the app. */
export interface Course {
  id: string;
  code: string;             // e.g. "CS3541"
  name: string;
  type: 'course' | 'project';
  unreadAnnouncements: number;
}

/** Normalised announcement shape. */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  author: string;
  createdAt: Date;
  read: boolean;
}

/** Normalised assignment shape. */
export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  courseId: string;
  courseCode: string;
  dueAt: Date | null;
  status: AssignmentStatus;
  maxPoints: number;
  submitted: boolean;
  grade?: string;
}
