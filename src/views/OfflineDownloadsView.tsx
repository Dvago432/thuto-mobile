import React, { useState } from 'react';
import { 
  DownloadCloud, 
  Trash2, 
  BookOpen, 
  HardDrive, 
  ShieldCheck, 
  FileText, 
  FileCode,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { CachedFileRecord } from '../types';
import { formatBytes } from '../utils/format';

interface OfflineDownloadsViewProps {
  onOpenOfflineFile: (file: CachedFileRecord) => void;
}

export const OfflineDownloadsView: React.FC<OfflineDownloadsViewProps> = ({
  onOpenOfflineFile,
}) => {
  const { cachedFiles, storageUsage, deleteOfflineResource, clearAllOfflineStorage } = useCourses();
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');
  const [confirmClear, setConfirmClear] = useState(false);

  const formatSize = formatBytes;

  const coursesWithCache = ['All', ...Array.from(new Set(cachedFiles.map((f) => f.courseCode)))];

  const filteredFiles = cachedFiles.filter((file) => {
    if (selectedCourseFilter === 'All') return true;
    return file.courseCode === selectedCourseFilter;
  });

  return (
    <div className="pb-24 pt-3 max-w-4xl mx-auto px-4 space-y-4 animate-in fade-in duration-200">
      {/* Storage Overview Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-[#10233D] border border-amber-500/20 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure IndexedDB Offline Storage</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            {formatSize(storageUsage.totalBytes)} Cached
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {storageUsage.fileCount} study materials downloaded and ready for offline reading when disconnected from the university network.
          </p>
        </div>

        {cachedFiles.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/40 text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-center"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Cache
          </button>
        )}
      </div>

      {/* Course Filter */}
      {coursesWithCache.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {coursesWithCache.map((code) => (
            <button
              key={code}
              onClick={() => setSelectedCourseFilter(code)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition font-medium ${
                selectedCourseFilter === code
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      )}

      {/* Files List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-200">
            Downloaded Course Materials ({filteredFiles.length})
          </span>
          <span className="text-[11px]">Instant Sandbox Reader</span>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
            <DownloadCloud className="w-10 h-10 mx-auto text-amber-400/60" />
            <h3 className="font-display font-bold text-sm text-slate-200">
              No Offline Materials Downloaded Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Go to any course workspace and tap the download icon next to lecture slides or lab notes to make them available offline.
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              className="p-4 rounded-3xl bg-slate-900 border border-slate-800/90 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition"
            >
              <div
                onClick={() => onOpenOfflineFile(file)}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
                  {file.fileType === 'code' ? (
                    <FileCode className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate hover:text-amber-300">
                    {file.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono text-amber-400 font-semibold">{file.courseCode}</span>
                    <span>·</span>
                    <span>{formatSize(file.fileSize)}</span>
                    <span>·</span>
                    <span className="text-emerald-400 inline-flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenOfflineFile(file)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Read
                </button>
                <button
                  onClick={() => deleteOfflineResource(file.id)}
                  title="Remove from offline cache"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear Cache Confirmation Dialog */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-white">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-white">
              Clear All Downloaded Cache?
            </h3>
            <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
              This will remove all {storageUsage.fileCount} downloaded course slides and documents from this device. You will need internet access to re-download them.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearAllOfflineStorage();
                  setConfirmClear(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
