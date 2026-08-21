import { apiGet } from './client';
import type {
  SakaiUser,
  SakaiSiteCollection,
  SakaiSite,
  SakaiAnnouncementCollection,
  SakaiAnnouncement,
  SakaiAssignmentCollection,
  SakaiAssignment,
  GradebookEntry,
  SakaiResourceCollection,
} from '../types/sakai';

// ── User ──────────────────────────────────────────────────────────

/**
 * Returns the currently authenticated user's profile.
 */
export function getCurrentUser(): Promise<SakaiUser> {
  return apiGet<SakaiUser>('/direct/user/current.json');
}

// ── Sites ─────────────────────────────────────────────────────────

/**
 * Returns all sites (courses + projects) the user is enrolled in.
 */
export async function getMySites(): Promise<SakaiSite[]> {
  const data = await apiGet<SakaiSiteCollection>('/direct/site.json');
  return data.site_collection;
}

/**
 * Returns a single site by ID.
 */
export function getSite(siteId: string): Promise<SakaiSite> {
  return apiGet<SakaiSite>(`/direct/site/${encodeURIComponent(siteId)}.json`);
}

// ── Announcements ─────────────────────────────────────────────────

/**
 * Returns all announcements across all the user's sites.
 * Sorted newest-first by the API.
 */
export async function getAllAnnouncements(): Promise<SakaiAnnouncement[]> {
  const data = await apiGet<SakaiAnnouncementCollection>(
    '/direct/announcement/user.json?n=50&d=30',
  );
  return data.announcement_collection;
}

/**
 * Returns announcements for a single site.
 *
 * @param siteId - The site/course ID (e.g. "CS3541_2026_27")
 * @param limit  - Max announcements to return (default 20)
 */
export async function getSiteAnnouncements(
  siteId: string,
  limit = 20,
): Promise<SakaiAnnouncement[]> {
  const data = await apiGet<SakaiAnnouncementCollection>(
    `/direct/announcement/site/${encodeURIComponent(siteId)}.json?n=${limit}`,
  );
  return data.announcement_collection;
}

// ── Assignments ───────────────────────────────────────────────────

/**
 * Returns all assignments for a site.
 *
 * @param siteId - The site/course ID
 */
export async function getSiteAssignments(
  siteId: string,
): Promise<SakaiAssignment[]> {
  const data = await apiGet<SakaiAssignmentCollection>(
    `/direct/assignment/site/${encodeURIComponent(siteId)}.json`,
  );
  return data.assignment_collection;
}

/**
 * Returns a single assignment by ID.
 */
export function getAssignment(assignmentId: string): Promise<SakaiAssignment> {
  return apiGet<SakaiAssignment>(`/direct/assignment/${assignmentId}.json`);
}

// ── Gradebook ─────────────────────────────────────────────────────

/**
 * Returns the gradebook for the current user in a given site.
 *
 * @param siteId - The site/course ID
 */
export function getSiteGradebook(siteId: string): Promise<GradebookEntry> {
  return apiGet<GradebookEntry>(
    `/direct/gradebook/user/${encodeURIComponent(siteId)}.json`,
  );
}

// ── Resources ─────────────────────────────────────────────────────

/**
 * Returns the resource tree for a site.
 *
 * @param siteId - The site/course ID
 */
export async function getSiteResources(
  siteId: string,
): Promise<SakaiResourceCollection> {
  return apiGet<SakaiResourceCollection>(
    `/direct/content/site/${encodeURIComponent(siteId)}.json`,
  );
}
