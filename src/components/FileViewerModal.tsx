import React from 'react';
import { X, FileText, CheckCircle2, Copy, DownloadCloud, BookOpen } from 'lucide-react';
import { CachedFileRecord } from '../types';

interface FileViewerModalProps {
  file: CachedFileRecord | null;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ file, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!file) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-sm text-white truncate">
                {file.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-amber-400/90 font-medium">{file.courseCode}</span>
                <span>·</span>
                <span>{formatSize(file.fileSize)}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Offline Cached
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-4 py-2.5 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Secure Offline Sandbox Reader
          </span>
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
        </div>

        {/* Document Content Body */}
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};
