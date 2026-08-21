/**
 * Deterministic course accent colors.
 * Derived from the course code so they're consistent across sessions.
 */

const PALETTE = [
  '#7C3AED', // purple
  '#0369A1', // blue
  '#C62828', // red
  '#B45309', // amber
  '#065F46', // emerald
  '#9D174D', // rose
  '#1D4ED8', // indigo
  '#6B21A8', // violet
];

/**
 * Returns a hex color for a given course ID.
 * The same ID always returns the same color.
 *
 * @param courseId - e.g. "CS3541_2026_27" or "CS3541"
 */
export function courseColor(courseId: string): string {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32-bit int
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

/**
 * Extracts the short course code from a full site ID.
 * "CS3541_2026_27" → "CS3541"
 * "COMMUNICATIONS AND MARKETING" → "COMM"
 */
export function extractCourseCode(siteId: string): string {
  // Match patterns like CS3541, MATH2010, etc.
  const match = siteId.match(/^([A-Z]{2,4}\d{3,4})/);
  if (match) return match[1];

  // Fallback: first 4 chars of first word
  return siteId.split(/[\s_]/)[0].slice(0, 4).toUpperCase();
}

/**
 * Returns a semi-transparent version of a hex color.
 * Used for card backgrounds and chip backgrounds.
 *
 * @param hex   - Hex color string (e.g. "#7C3AED")
 * @param alpha - Opacity 0–1
 */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
