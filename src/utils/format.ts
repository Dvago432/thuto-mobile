// Shared byte formatting. One truth, used everywhere a file size renders.
//
// Concept: honesty in presentation matters as much as honesty in data.
// The portal's directory listing omits `size` for many resources — those
// arrive as 0. Rendering "0.0 MB" asserted a size where NONE was known,
// which is fabrication-by-formatting. Zero therefore renders as an explicit
// "Size unknown", and the real disclosure replaces it the moment the file
// is actually downloaded (cached records store true byte counts).
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return 'Size unknown';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
