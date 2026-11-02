// Shared MIME resolution. One truth, used everywhere portal bytes become a
// Blob or data-URI (preview + offline-cache copy), and relied on by the
// FileViewerModal's renderer classification.
//
// Concept: a Blob's `type` is what decides whether the phone RENDERS a
// document or OFFERS A DOWNLOAD. The portal frequently serves lecturer
// uploads as generic `application/octet-stream`, so a PDF previewed verbatim
// was classified "can't render" and the viewer pushed "Save / Open
// Externally" — the honest escape hatch, but for a file the phone could
// have rendered. Resolution order (most trustworthy first):
//   1. a SPECIFIC Content-Type actually served (it describes the real bytes)
//   2. the resource's own filename extension (portal labels octet-stream all
//      the time; the extension is what the phone can render from)
//   3. the known fileType category (pdf/pptx/docx/zip/code)
//   4. application/octet-stream — the honest "renderability unknown"

const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  csv: 'text/csv',
  zip: 'application/zip',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
};

const FILETYPE_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  zip: 'application/zip',
  code: 'text/plain',
};

// Cover every case where the portal's Content-Type neither names a real
// renderable format nor disagrees with the resource's own metadata.
const GENERIC_TYPES = new Set(['', 'application/octet-stream', 'application/binary', 'binary/octet-stream', 'application/unknown']);

export function guessMimeFromName(fileName: string): string | null {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return EXT_MIME[ext] || null;
}

export function resolveResourceMime(
  fileName: string,
  fileType: 'pdf' | 'pptx' | 'docx' | 'code' | 'zip',
  servedType: string | null | undefined
): string {
  const served = (servedType || '').split(';')[0].trim().toLowerCase();
  if (!GENERIC_TYPES.has(served)) return served;

  const fromName = guessMimeFromName(fileName);
  if (fromName) return fromName;

  return FILETYPE_MIME[fileType] || 'application/octet-stream';
}
