import React from 'react';
import { X, FileText, CheckCircle2, Copy, DownloadCloud, BookOpen, Eye, Download } from 'lucide-react';
import { CachedFileRecord, PreviewFileRecord } from '../types';
import { formatBytes } from '../utils/format';

interface FileViewerModalProps {
  file: CachedFileRecord | PreviewFileRecord | null;
  onClose: () => void;
  // Ephemeral previews offer an opt-in one-tap journey into the offline cache.
  onSaveOffline?: () => void;
  savingOffline?: boolean;
}

// Concept: the viewer renders whatever was REALLY fetched, and says where
// it came from. Two content sources, one renderer:
//   - cached records: base64 data-URI of the actual portal file in IndexedDB
//   - ephemeral previews: a blob: object URL of an in-memory Blob — nothing
//     was stored, and the URL MUST be revoked on close.
// PDFs embed (iframe), images render inline, everything else (pptx/docx/zip,
// which a browser sandbox cannot render) uses the Save / Open Externally
// escape hatch. Records cached before Phase 3 keep the plain text reader.
function isRealBinary(file: CachedFileRecord | PreviewFileRecord): boolean {
  if (!file.mimeType) return false;
  return file.content.startsWith('data:') || ('ephemeral' in file && file.content.startsWith('blob:'));
}

function mimeCategory(mime: string): 'pdf' | 'image' | 'other' {
  if (mime.includes('pdf')) return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  return 'other';
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  onClose,
  onSaveOffline,
  savingOffline = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!file) return null;

  const ephemeral = 'ephemeral' in file && !!file.ephemeral;
  const binary = isRealBinary(file);
  const category = binary ? mimeCategory(file.mimeType!) : 'other';

  // Concept: in-memory lifecycles must be cleaned up. A blob URL survives
  // long after the viewer closes unless explicitly revoked — leaking PDF
  // blobs is how a phone's browser tab slowly dies. Every close path routes
  // through here.
  const handleClose = () => {
    if (ephemeral && file.content.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(file.content);
      } catch {
        // already revoked — harmless
      }
    }
    onClose();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              {ephemeral ? <Eye className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-sm text-white truncate">
                {file.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-amber-400/90 font-medium">{file.courseCode}</span>
                <span>·</span>
                <span>{formatBytes(file.fileSize)}</span>
                <span>·</span>
                {ephemeral ? (
                  <span className="inline-flex items-center gap-1 text-amber-300 text-[11px]">
                    <Eye className="w-3 h-3" /> Temporary preview
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Offline Cached
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-4 py-2.5 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 min-w-0">
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {ephemeral
                ? 'Streaming preview — not stored'
                : binary
                  ? `Real file from Thuto (${file.mimeType})`
                  : 'Offline Text Reader'}
            </span>
          </span>
          <div className="flex items-center gap-3 shrink-0">
            {ephemeral && onSaveOffline && (
              <button
                onClick={onSaveOffline}
                disabled={savingOffline}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition font-medium disabled:opacity-50"
              >
                {savingOffline ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {savingOffline ? 'Saving…' : 'Save offline'}
              </button>
            )}
            {binary ? (
              // Concept: an honest escape hatch — pptx/docx/zip (or a PDF the
              // embedded viewer cannot render on some Android WebViews) can be
              // handed straight to the OS from the fetched/cached bytes.
              <a
                href={file.content}
                download={file.fileName}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition font-medium"
              >
                <DownloadCloud className="w-3.5 h-3.5" /> Save / Open Externally
              </a>
            ) : (
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition font-medium"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied Text
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Study Notes
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Document Content Body */}
        {binary ? (
          <div className="flex-1 overflow-y-auto bg-slate-950/40">
            {category === 'pdf' && (
              <iframe
                src={file.content}
                title={file.title}
                className="w-full h-full min-h-[420px] bg-white"
              />
            )}
            {category === 'image' && (
              <div className="p-5 flex items-center justify-center">
                <img
                  src={file.content}
                  alt={file.title}
                  className="max-w-full max-h-[60vh] rounded-xl border border-slate-800"
                />
              </div>
            )}
            {category === 'other' && (
              <div className="p-6 space-y-4 text-center">
                <DownloadCloud className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                  {file.fileName} was fetched from the portal{ephemeral ? ' for preview' : ' and is stored offline on this device'}.
                  This format ({file.mimeType}) cannot be previewed inside the app — use “Save /
                  Open Externally” above to open it{!ephemeral ? ' or the offline copy' : ''}.
                </p>
                {ephemeral && !onSaveOffline && (
                  <p className="text-[11px] text-slate-500">Tap “Save offline” from the Materials list to keep it.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs text-slate-200 leading-relaxed bg-slate-950/40">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 shadow-inner">
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed">
                {file.content}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DownloadCloud className="w-4 h-4 text-slate-500" />
                <span>Cached locally at {new Date(file.cachedAt).toLocaleDateString()}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">{file.fileName}</span>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            {ephemeral
              ? 'Preview only — nothing was stored on this device.'
              : `Stored in IndexedDB · ${formatBytes(file.fileSize)}`}
          </span>
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};
