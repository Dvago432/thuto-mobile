// Alert classification + retention. One truth for how alerts sort, badge,
// and expire — used by the notifications view and the re-alert service.
//
// Concept (caveat items 1, 2, 4): students judge alerts in seconds, and the
// portal gives no structured "event kind" field — announcements are free
// text. We classify by title keywords (TEST > LAB > assignment > notice),
// which is a heuristic by necessity, and label it as one: the kind badge on
// every alert IS the classification, so a misread can be seen and compensated
// by the student rather than hidden by the system.

export type AlertKind = 'test' | 'lab' | 'assignment' | 'notice';

// Lower number = higher priority. Tests first, labs second — per the
// student's explicit ranking (caveat item 1).
export const ALERT_KIND_PRIORITY: Record<AlertKind, number> = {
  test: 0,
  lab: 1,
  assignment: 2,
  notice: 3,
};

// Badge classes used wherever a kind renders.
export const ALERT_KIND_META: Record<AlertKind, { label: string; badge: string }> = {
  test: { label: 'TEST', badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/40' },
  lab: { label: 'LAB', badge: 'bg-sky-500/15 text-sky-300 border border-sky-500/40' },
  assignment: { label: 'ASSIGNMENT', badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/40' },
  notice: { label: 'NOTICE', badge: 'bg-slate-600/25 text-slate-300 border border-slate-600/50' },
};

const TEST_RE = /(test|exam|examination|quiz|\bcat\b|continuous\s+assessment|\bmid[- ]?semester)/i;
const LAB_RE = /\b(lab|laboratory|practical)\b/i;
const ASSIGNMENT_RE = /\b(assignment|homework|submission|deadline|due)\b/i;

export function alertKind(title: string): AlertKind {
  if (TEST_RE.test(title)) return 'test';
  if (LAB_RE.test(title)) return 'lab';
  if (ASSIGNMENT_RE.test(title)) return 'assignment';
  return 'notice';
}

export function alertKindPriority(title: string): number {
  return ALERT_KIND_PRIORITY[alertKind(title)];
}

// Caveat item 4: alerts older than six months are dropped (read-side filter —
// undated entries are KEPT, because silently discarding what we cannot judge
// would be the same fabrication-by-omission we removed from the dashboards).
export function isOlderThanMonths(iso: string, months: number): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t > months * 30.44 * 24 * 60 * 60 * 1000;
}
