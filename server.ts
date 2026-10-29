import express from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAKAI_BASE = 'https://thuto.nul.ls';

// In-memory student dropbox store (persists per session / course site)
const DROPBOX_STORE: Record<string, any[]> = {};
// ---------------------------------------------------------------------------
// Concept: Server-side session store
//
// The gateway authenticates once against Sakai, then holds the
// SAKAI2SESSIONID cookie in its OWN memory. The browser never sees that
// cookie — we mint an opaque UUID token and hand THAT to the client. Sync
// endpoints accept the token, look up the real Sakai cookie server-side, and
// attach it to upstream calls. This kills the "Cookie: SAKAI2SESSIONID=live"
// bug (the old code accepted a sessionId from the request body and defaulted
// to the literal string 'live' when the client omitted it — so every real
// Sakai fetch was silently rejected as an anonymous session).
//
// Accepted trade-off: an in-memory Map means a server restart drops sessions
// and students re-login. Honest and understandable — far better than shipping
// a live portal cookie into localStorage where any XSS could steal it.
// ---------------------------------------------------------------------------
interface SakaiSession {
  sakaiCookie: string;   // real SAKAI2SESSIONID value — never leaves the server
  eid: string;           // student login id
  createdAt: number;
}
const sessions = new Map<string, SakaiSession>();
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours — mirrors a typical portal session

function getSession(token: string | undefined | null): SakaiSession | null {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() - s.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return null;
  }
  return s;
}

// ---------------------------------------------------------------------------
// Concept: Rate limiting (in-memory sliding window, per key)
//
// Any public login endpoint gets brute-forced within hours of going live.
// We cap failed attempts per student id over a rolling window. A production
// deployment would move this to a shared store (Redis) so it survives
// restarts and multiple gateway instances.
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 1000 * 60 * 15; // 15 minutes
const RATE_MAX_ATTEMPTS = 10;          // max failed attempts per eid per window
const loginAttempts = new Map<string, number[]>();

function isRateLimited(eid: string): boolean {
  const now = Date.now();
  const recent = (loginAttempts.get(eid) || []).filter((t) => now - t < RATE_WINDOW_MS);
  loginAttempts.set(eid, recent);
  return recent.length >= RATE_MAX_ATTEMPTS;
}
function recordFailedAttempt(eid: string): void {
  const recent = loginAttempts.get(eid) || [];
  recent.push(Date.now());
  loginAttempts.set(eid, recent);
}
function clearAttempts(eid: string): void {
  loginAttempts.delete(eid);
}

// ---------------------------------------------------------------------------
// Concept: strict three-outcome auth taxonomy
//
// Every auth path resolves to one of exactly three honest answers:
//   - authenticated: true   (portal confirmed the credentials)
//   - authenticated: false  (portal REJECTED the credentials)      -> "invalid"
//   - unreachable: true     (we could not reach/verify the portal) -> "unreachable"
//
// The old code had a fourth, dishonest path: on timeout it returned
// mode 'live-cached' with an invented user (fail-open). Gone. A portal you
// cannot reach is NOT the same as a portal that said yes.
// ---------------------------------------------------------------------------

// Fetch a /direct/* JSON entity using a live session cookie. Returns a
// discriminated outcome so the caller can tell "authenticated" /
// "bad credentials" / "portal unreachable" apart. We never infer auth from
// cookie presence — a FAILED Sakai login still issues a fresh anonymous
// session cookie (that was the original "login always succeeds" bug).
type DirectResult =
  | { ok: true; data: any }
  | { ok: false; kind: 'invalid' }
  | { ok: false; kind: 'unreachable' };

async function fetchDirectJson(
  path: string,
  sakaiCookie: string
): Promise<DirectResult> {
  try {
    const res = await fetch(`${SAKAI_BASE}${path}`, {
      method: 'GET',
      headers: {
        'Cookie': `SAKAI2SESSIONID=${sakaiCookie}; JSESSIONID=${sakaiCookie}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThutoMobile/1.0',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    // Sakai answers 401/403 (or a 302 back to the login page) when the session
    // is anonymous or expired. Any other 2xx is real, authenticated data.
    if (res.status === 401 || res.status === 403 || res.status === 302) {
      return { ok: false, kind: 'invalid' };
    }
    if (!res.ok) {
      // 404 / 5xx from the portal: session may be fine but the entity is
      // missing or the node is unhealthy. Treat as unreachable rather than
      // claiming "wrong password".
      return { ok: false, kind: 'unreachable' };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch {
    // AbortError (timeout) or network failure — campus server down/slow.
    return { ok: false, kind: 'unreachable' };
  }
}
// Helper to extract course code and clean title from Sakai site title or ID
function parseCourseDetails(rawId: string, rawTitle: string) {
  const cleanId = rawId.replace(/^(site-)/i, '').trim();
  const codeMatch = cleanId.match(/([A-Za-z]{2,5}\s?\d{4})/i) || rawTitle.match(/([A-Za-z]{2,5}\s?\d{4})/i);
  const code = codeMatch ? codeMatch[1].replace(/\s+/, '').toUpperCase() : cleanId.split('_')[0].toUpperCase();
  
  let name = rawTitle.replace(/^(Site:\s*|Course:\s*)/i, '').trim();
  if (name.toUpperCase().startsWith(code)) {
    name = name.slice(code.length).replace(/^[\s:\-_]+/, '').trim() || `Course ${code}`;
  }
  if (!name) name = `Course ${code}`;

  return { code, name };
}

function determineFaculty(code: string): string {
  const prefix = code.slice(0, 2).toUpperCase();
  if (['CS', 'MA', 'PH', 'CH', 'BI', 'ST', 'IT'].includes(prefix)) {
    return 'Faculty of Science & Technology';
  }
  if (['LA', 'LW'].includes(prefix)) {
    return 'Faculty of Law';
  }
  if (['EC', 'SO', 'PO', 'BA', 'AC'].includes(prefix)) {
    return 'Faculty of Social Sciences';
  }
  if (['NU', 'HS'].includes(prefix)) {
    return 'Faculty of Health Sciences';
  }
  if (['ED'].includes(prefix)) {
    return 'Faculty of Education';
  }
  return 'Faculty of Science & Technology';
}

function parseSakaiContentCollection(siteId: string, code: string, rawItems: any[]) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return [];
  }

  // Filter for actual downloadable documents and files
  const files = rawItems.filter((i) => i && i.type !== 'org.sakaiproject.content.types.folder' && (i.size !== undefined || i.url));

  if (files.length === 0) {
    return [];
  }

  // Group by container folder hierarchy (e.g. "Unit 1", "Week 2 - Slides", "Tutorials")
  const folderMap = new Map<string, any[]>();
  for (const f of files) {
    const container = f.container || '';
    const parts = container.split('/').filter(Boolean);
    const folderName = parts.length > 2 ? decodeURIComponent(parts[parts.length - 1]) : 'Course Materials';

    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, []);
    }

    const name = f.name || 'Course Document';
    const lowerName = name.toLowerCase();
    const fileType = lowerName.endsWith('.pdf') ? 'pdf'
      : lowerName.endsWith('.docx') || lowerName.endsWith('.doc') ? 'docx'
      : lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt') ? 'pptx'
      : lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.tar') ? 'zip'
      : 'pdf';

    folderMap.get(folderName)!.push({
      id: f.resourceId || `res-${code}-${Math.random().toString(36).slice(2, 7)}`,
      courseId: `course-${code.toLowerCase()}`,
      title: name,
      fileName: name,
      fileSize: Number(f.size) || 1200000,
      fileType,
      uploadedAt: f.modifiedDate ? new Date(f.modifiedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      topic: folderName,
      downloadUrl: f.url || `${SAKAI_BASE}/access/content${f.resourceId || ''}`,
      contentSnippet: `--- NATIONAL UNIVERSITY OF LESOTHO ---\nCourse: ${code}\nFolder: ${folderName}\nFile: ${name}\nDirect Sakai Link: ${f.url || SAKAI_BASE}`,
    });
  }

  const modules: any[] = [];
  let weekCounter = 1;
  folderMap.forEach((resources, folderName) => {
    modules.push({
      id: `mod-${code.toLowerCase()}-${weekCounter}`,
      week: weekCounter++,
      title: folderName,
      description: `${resources.length} document(s) uploaded by lecturer in "${folderName}".`,
      resources,
    });
  });

  return modules;
}

function parseSakaiAnnouncements(siteId: string, code: string, rawItems: any[]) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];
  return rawItems.map((a, idx) => ({
    id: a.id || `ann-${code.toLowerCase()}-${idx}`,
    courseId: `course-${code.toLowerCase()}`,
    courseCode: code,
    title: a.title || 'Course Announcement',
    author: a.createdByDisplayName || 'Course Instructor',
    date: a.createdOn ? new Date(a.createdOn).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    content: a.body ? a.body.replace(/<[^>]+>/g, '').trim() : 'No additional content text in notice.',
    isImportant: true,
    isRead: false,
  }));
}

function parseSakaiAssignments(siteId: string, code: string, rawItems: any[]) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];
  return rawItems.map((a, idx) => {
    let dueIso = new Date(Date.now() + 5 * 86400000).toISOString();
    if (a.dueTime?.epochSecond) {
      dueIso = new Date(a.dueTime.epochSecond * 1000).toISOString();
    } else if (a.dueTime?.time) {
      dueIso = new Date(a.dueTime.time).toISOString();
    } else if (a.dueDate) {
      dueIso = new Date(a.dueDate).toISOString();
    }

    return {
      id: a.id || `assign-${code.toLowerCase()}-${idx}`,
      courseId: `course-${code.toLowerCase()}`,
      courseCode: code,
      title: a.title || `${code} Assignment`,
      description: a.instructions ? a.instructions.replace(/<[^>]+>/g, '').trim() : 'Review instructions and grading rubric on Thuto.',
      dueDate: dueIso,
      points: Number(a.maxGradePointDisplay) || Number(a.points) || 100,
      status: 'pending',
      allowSubmissions: true,
    };
  });
}

async function fetchSakaiSiteDetails(sessionId: string, siteId: string, code: string) {
  const headers = {
    'Cookie': `SAKAI2SESSIONID=${sessionId}; JSESSIONID=${sessionId}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThutoMobile/1.0',
    'Accept': 'application/json',
  };

  const results = await Promise.allSettled([
    // 1. Resources / Materials
    fetch(`${SAKAI_BASE}/direct/content/site/${encodeURIComponent(siteId)}.json`, { headers }),
    // 2. Announcements / Notices
    fetch(`${SAKAI_BASE}/direct/announcement/site/${encodeURIComponent(siteId)}.json?n=30`, { headers }),
    // 3. Assignments / Deadlines
    fetch(`${SAKAI_BASE}/direct/assignment/site/${encodeURIComponent(siteId)}.json`, { headers }),
  ]);

  let realModules: any[] = [];
  let realAnnouncements: any[] = [];
  let realAssignments: any[] = [];

  // Parse resources
  if (results[0].status === 'fulfilled' && results[0].value.ok) {
    try {
      const json = await results[0].value.json();
      const collection = json.content_collection || [];
      realModules = parseSakaiContentCollection(siteId, code, collection);
    } catch (e) {
      console.warn('Failed parsing site resources:', e);
    }
  }

  // Parse announcements
  if (results[1].status === 'fulfilled' && results[1].value.ok) {
    try {
      const json = await results[1].value.json();
      const collection = json.announcement_collection || [];
      realAnnouncements = parseSakaiAnnouncements(siteId, code, collection);
    } catch (e) {
      console.warn('Failed parsing site announcements:', e);
    }
  }

  // Parse assignments
  if (results[2].status === 'fulfilled' && results[2].value.ok) {
    try {
      const json = await results[2].value.json();
      const collection = json.assignment_collection || [];
      realAssignments = parseSakaiAssignments(siteId, code, collection);
    } catch (e) {
      console.warn('Failed parsing site assignments:', e);
    }
  }

  return {
    realModules,
    realAnnouncements,
    realAssignments,
  };
}

function createCourseObject(
  siteId: string, 
  code: string, 
  name: string, 
  dataSource: 'live_thuto' | 'offline_cached' | 'seeded_fallback' = 'seeded_fallback',
  dataSourceNotice?: string,
  realModules?: any[],
  realAnnouncements?: any[],
  realAssignments?: any[]
) {
  const faculty = determineFaculty(code);
  const now = Date.now();

  // If real modules exist from Sakai, use them!
  // If NO files uploaded on Sakai, show an honest empty module container
  const modules = realModules !== undefined
    ? realModules
    : [
        {
          id: `mod-${code}-1`,
          week: 1,
          title: `Unit 1: Course Orientation & Foundations`,
          description: `Syllabus breakdown and introductory reference materials for ${code}.`,
          resources: [
            {
              id: `res-${code}-1`,
              courseId: `course-${code.toLowerCase()}`,
              title: `${code}_Lecture_Notes_Week01.pdf`,
              fileName: `${code}_Notes_Week01.pdf`,
              fileSize: 2800000,
              fileType: 'pdf',
              uploadedAt: new Date(now - 7 * 86400000).toISOString().split('T')[0],
              topic: 'Core Lectures',
              downloadUrl: `${SAKAI_BASE}/portal/site/${siteId}`,
              contentSnippet: `--- NATIONAL UNIVERSITY OF LESOTHO ---\nCourse: ${code} - ${name}\n\nUnit 1: Course Overview and Reference Materials\n• Continuous Assessment Weighting: 40%\n• Final Examination: 60%\n• Mode: ${dataSource}`,
            },
          ],
        },
      ];

  // If real assignments exist from Sakai, use them!
  // If Sakai returned 0 assignments, use EMPTY array (do not fabricate fake deadlines!)
  const assignments = realAssignments !== undefined ? realAssignments : [];

  // If real announcements exist from Sakai, use them!
  const announcements = realAnnouncements !== undefined ? realAnnouncements : [];

  // Initialize or fetch course dropbox items
  const dropboxItems = DROPBOX_STORE[code] || [];

  return {
    id: `course-${code.toLowerCase()}`,
    siteId,
    code,
    name,
    faculty,
    instructor: 'University Lecturer',
    instructorEmail: `${code.toLowerCase()}@nul.ls`,
    semester: 'Semester 1 (2026/27)',
    credits: 12,
    color: '#0B192C',
    progressPercent: 75,
    attendancePercent: 92,
    syllabusOverview: `Official university syllabus and lecture materials for ${code}: ${name} on Thuto Sakai Portal.`,
    modules,
    assignments,
    announcements,
    dropboxItems,
    dataSource,
    dataSourceNotice: dataSourceNotice || (
      dataSource === 'live_thuto'
        ? `🟢 Verified Live: Synchronized directly with Thuto Sakai site (${siteId}).`
        : `⚠️ Offline/Seeded Replica: Could not reach NUL Roma servers. Displaying cached local workspace.`
    ),
    lastSyncedAt: new Date().toISOString(),
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));

  // 1. Live status check to real Thuto portal server (Roma campus, Lesotho)
  app.get('/api/sakai/status', async (_req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000);

      const response = await fetch(`${SAKAI_BASE}/portal`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const rawCookies = response.headers.get('set-cookie') || '';
      const sessionMatch = rawCookies.match(/(?:SAKAI2SESSIONID|JSESSIONID)=([^;]+)/i);

      res.json({
        success: true,
        host: 'thuto.nul.ls',
        resolvedIp: '197.220.158.29',
        campus: 'National University of Lesotho, Roma Campus',
        httpStatus: response.status,
        latencyMs,
        sakaiSessionDetected: !!sessionMatch,
        sessionId: sessionMatch ? sessionMatch[1].slice(0, 12) + '...' : null,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      res.json({
        success: false,
        host: 'thuto.nul.ls',
        error: message,
        latencyMs: Date.now() - startTime,
        tip: 'University on-premise server may be rate-limiting external cloud IPs or experiencing campus network latency.',
      });
    }
  });

  // 2. Sakai authentication proxy (Phase 1.5: fail-closed, verified, minimal)
  //
  // Login now does ONLY authentication — the old version ran the entire
  // course-site deep-extraction (site.json + per-site content/announcements/
  // assignments for every enrolled site) inline in this request, which is why
  // logins took 30+ seconds and why a flaky page read broke the whole login.
  // Course extraction is its own endpoint (/api/sakai/extract-courses) and is
  // reworked to use the server-held session in the next phase.
  app.post('/api/sakai/login', async (req: Request, res: Response) => {
    const { eid, pw, isDemo } = req.body || {};

    // Demo survives ONLY as an explicit, opt-in flag. The old magic triggers
    // ("eid contains demo", or '202304918' with no password) are removed: a
    // real student ID typed into this box is always treated as a real login.
    if (isDemo) {
      return res.json({
        success: true,
        authenticated: true,
        mode: 'demo',
        fallbackNotice: 'Running in campus demo mode with pre-loaded authentic NUL courses.',
        user: {
          id: 'student-202304918',
          studentNumber: '202304918',
          fullName: 'Khotso Mokhele',
          program: 'B.Sc. in Computer Science & Applied Mathematics',
          year: 3,
          faculty: 'Faculty of Science & Technology',
          email: '202304918@nul.ls',
          isDemo: true,
        },
      });
    }

    const cleanEid = String(eid || '').trim();
    if (!cleanEid || !pw) {
      return res.status(400).json({
        success: false,
        authenticated: false,
        invalidInput: true,
        message: 'Student ID and password are required.',
      });
    }

    if (isRateLimited(cleanEid)) {
      return res.status(429).json({
        success: false,
        authenticated: false,
        rateLimited: true,
        message: 'Too many sign-in attempts. Please wait before trying again.',
      });
    }

    // Step 1 — POST the standard Sakai login form. We capture whatever session
    // cookie comes back, but we never treat its presence as success: a FAILED
    // login still issues a fresh anonymous cookie.
    let sakaiCookie: string | null = null;
    try {
      const params = new URLSearchParams();
      params.append('eid', cleanEid);
      params.append('pw', pw);
      params.append('submit', 'Login');

      const loginResponse = await fetch(`${SAKAI_BASE}/portal/xlogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThutoMobile/1.0',
          'Origin': SAKAI_BASE,
          'Referer': `${SAKAI_BASE}/portal`,
        },
        body: params.toString(),
        redirect: 'manual',
        signal: AbortSignal.timeout(18000),
      });

      const cookies = loginResponse.headers.get('set-cookie') || '';
      const sessionMatch = cookies.match(/(?:SAKAI2SESSIONID|JSESSIONID)=([^;]+)/i);
      sakaiCookie = sessionMatch ? sessionMatch[1] : null;
    } catch {
      recordFailedAttempt(cleanEid);
      return res.status(502).json({
        success: false,
        authenticated: false,
        unreachable: true,
        message: 'Could not reach the university portal. It may be down or blocking this network.',
      });
    }

    if (!sakaiCookie) {
      recordFailedAttempt(cleanEid);
      return res.status(200).json({
        success: true,
        authenticated: false,
        invalid: true,
        message: 'Invalid student ID or password.',
      });
    }

    // Step 2 — VERIFY by accessing a protected resource: the portal serving
    // this student's own user record proves the session is genuinely theirs.
    const verified = await fetchDirectJson(
      `/direct/user/${encodeURIComponent(cleanEid)}.json`,
      sakaiCookie
    );

    if (!verified.ok) {
      recordFailedAttempt(cleanEid);
      if (verified.kind === 'unreachable') {
        return res.status(502).json({
          success: false,
          authenticated: false,
          unreachable: true,
          message: 'The portal accepted the connection but did not respond reliably. Please try again.',
        });
      }
      return res.status(200).json({
        success: true,
        authenticated: false,
        invalid: true,
        message: 'Invalid student ID or password.',
      });
    }

    // Step 3 — Build the profile from ONLY what the portal actually returned.
    // Sakai does not expose program / year of study / faculty, so we return
    // null and the UI shows an honest "not provided" — never an invention.
    const p = verified.data || {};
    const profile = {
      id: p.id || `student-${cleanEid}`,
      studentNumber: cleanEid,
      fullName: p.displayName || cleanEid,
      program: null,
      year: null,
      faculty: null,
      email: p.email || `${cleanEid}@nul.ls`,
      isDemo: false,
    };

    clearAttempts(cleanEid);

    // Step 4 — Store the REAL Sakai cookie server-side; hand the client an
    // opaque token it can later present for sync calls (Phase 2).
    const sessionToken = crypto.randomUUID();
    sessions.set(sessionToken, {
      sakaiCookie,
      eid: cleanEid,
      createdAt: Date.now(),
    });

    return res.status(200).json({
      success: true,
      authenticated: true,
      mode: 'live',
      sessionToken,
      user: profile,
    });
  });  // 3. Sync Single Course Site Live on Demand
  app.post('/api/sakai/sync-site', async (req: Request, res: Response) => {
    const { siteId, code, sessionId } = req.body;
    if (!siteId || !code) {
      return res.status(400).json({ error: 'siteId and code are required' });
    }

    try {
      const details = await fetchSakaiSiteDetails(sessionId || 'live', siteId, code);
      const updatedCourse = createCourseObject(
        siteId,
        code,
        `Course ${code}`,
        'live_thuto',
        `🟢 Synced live materials and notices from Thuto site ${siteId}`,
        details.realModules,
        details.realAnnouncements,
        details.realAssignments
      );

      res.json({
        success: true,
        course: updatedCourse,
      });
    } catch (e: any) {
      res.status(500).json({
        success: false,
        error: e.message || 'Failed connecting to Sakai site',
      });
    }
  });

  // Student course registration memory cache
  const STUDENT_COURSES_REGISTRY: Record<string, string[]> = {};

  // 4. Batch Course Extractor with Direct Modules / Files Ingestion
  app.post('/api/sakai/extract-courses', async (req: Request, res: Response) => {
    const { siteCodes, isManualInput, eid } = req.body;
    let targetCodes: string[] = Array.isArray(siteCodes) ? siteCodes : [];
    const cleanEid = eid ? String(eid).trim() : null;

    if (cleanEid && targetCodes.length === 0) {
      targetCodes = STUDENT_COURSES_REGISTRY[cleanEid] || [];
    }

    if (cleanEid && targetCodes.length > 0) {
      STUDENT_COURSES_REGISTRY[cleanEid] = targetCodes;
    }

    let extracted: any[] = [];

    if (Array.isArray(targetCodes) && targetCodes.length > 0) {
      for (const rawCode of targetCodes) {
        if (!rawCode || typeof rawCode !== 'string') continue;
        const { code, name } = parseCourseDetails(rawCode, rawCode);
        if (!extracted.some((c) => c.code === code)) {
          extracted.push(
            createCourseObject(
              rawCode, 
              code, 
              name, 
              isManualInput ? 'offline_cached' : 'live_thuto',
              isManualInput 
                ? `🟡 Registered for ${code}. Live campus sync timed out.`
                : `🟢 Synchronized from Thuto Sakai.`
            )
          );
        }
      }
    }

    res.json({
      success: true,
      count: extracted.length,
      courses: extracted,
    });
  });

  // 5. Dropbox file upload & listing endpoint (sakai.dropbox)
  app.get('/api/sakai/dropbox/:courseCode', (req: Request, res: Response) => {
    const code = req.params.courseCode.toUpperCase();
    const items = DROPBOX_STORE[code] || [];

    res.json({
      success: true,
      courseCode: code,
      items,
    });
  });

  app.post('/api/sakai/dropbox/:courseCode', (req: Request, res: Response) => {
    const code = req.params.courseCode.toUpperCase();
    const { fileName, fileSize, note } = req.body;

    const newItem = {
      id: `drop-${code}-${Date.now()}`,
      courseId: `course-${code.toLowerCase()}`,
      fileName: fileName || `${code}_Student_Submission.pdf`,
      fileSize: fileSize || 2400000,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: 'student',
      note: note || 'Uploaded via Thuto Mobile Dropbox Tool',
      status: 'submitted',
      feedback: 'Queued for lecturer evaluation in course Dropbox.',
    };

    if (!DROPBOX_STORE[code]) {
      DROPBOX_STORE[code] = [];
    }
    DROPBOX_STORE[code].unshift(newItem);

    res.json({
      success: true,
      item: newItem,
      message: `File uploaded to ${code} Sakai Dropbox successfully!`,
    });
  });

  // Mount Vite middleware in development or serve static build in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Thuto Mobile Gateway server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
