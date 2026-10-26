import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Link, 
  Plus, 
  BookOpen, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useCourses } from '../context/CourseContext';

interface SakaiSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SakaiSyncModal: React.FC<SakaiSyncModalProps> = ({ isOpen, onClose }) => {
  const { syncWithThutoExtractor, registerNewCourse, resetToDefaultCourses } = useCourses();

  const [courseCodesInput, setCourseCodesInput] = useState('CS3541, CS3511');
  const [courseUrlInput, setCourseUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSyncCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCodesInput.trim()) return;

    setLoading(true);
    setStatusMessage({ text: 'Contacting Thuto Sakai & parsing course sites...' });

    const rawList = courseCodesInput
      .split(/[\n,;]+/)
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    const count = await syncWithThutoExtractor({ siteCodes: rawList });
    setLoading(false);

    if (count > 0) {
      setStatusMessage({ text: `Successfully loaded ${count} enrolled courses from Thuto!` });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1400);
    } else {
      setStatusMessage({ text: 'Failed to extract courses. Please check codes.', isError: true });
    }
  };

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseUrlInput.trim()) return;

    setLoading(true);
    setStatusMessage({ text: 'Analyzing Thuto portal URL...' });

    const siteMatch = courseUrlInput.match(/\/site\/([A-Za-z0-9_\-]+)/);
    const extractedCode = siteMatch ? siteMatch[1] : courseUrlInput.trim();

    const count = await syncWithThutoExtractor({ siteCodes: [extractedCode] });
    setLoading(false);

    if (count > 0) {
      setStatusMessage({ text: `Successfully imported ${extractedCode}!` });
      setCourseUrlInput('');
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1400);
    } else {
      setStatusMessage({ text: 'Could not extract site. Enter course code directly.', isError: true });
    }
  };

  const handleAddSingle = async (code: string, name: string) => {
    setLoading(true);
    await registerNewCourse(code, name);
    setLoading(false);
    setStatusMessage({ text: `Added ${code}: ${name} to your semester!` });
    setTimeout(() => {
      setStatusMessage(null);
    }, 1500);
  };

  const handleReset = () => {
    resetToDefaultCourses();
    setStatusMessage({ text: 'Restored campus demo courses.' });
    setTimeout(() => {
      onClose();
      setStatusMessage(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            NUL THUTO SAKAI GATEWAY SYNC
          </div>
          <h2 className="font-display font-bold text-lg text-white">
            Sync Your Enrolled Courses
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically discover and populate the exact modules, resources, and deadline notifications for your registered classes.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 font-medium ${
              statusMessage.isError
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Option 1: Course Codes Batch Ingester */}
        <form onSubmit={handleSyncCodes} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Enter Your Registered Course Codes
            </label>
            <span className="text-[10px] text-slate-500">Comma separated</span>
          </div>

          <input
            type="text"
            value={courseCodesInput}
            onChange={(e) => setCourseCodesInput(e.target.value)}
            placeholder="e.g. CS3541, CS3511, CS3522, MA3501"
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Sync &amp; Mount Courses
          </button>
        </form>

        {/* Option 2: Paste Direct Thuto Course URL */}
        <form onSubmit={handleImportUrl} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5 text-amber-400" /> Paste Thuto Portal Course URL
          </label>

          <input
            type="text"
            value={courseUrlInput}
            onChange={(e) => setCourseUrlInput(e.target.value)}
            placeholder="https://thuto.nul.ls/portal/site/CS3541_2026_27/..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-[11px]"
          />

          <button
            type="submit"
            disabled={loading || !courseUrlInput.trim()}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Extract Course from URL
          </button>
        </form>

        {/* Quick Common University Courses */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 block px-1">
            Quick 1-Tap Course Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { code: 'CS3541', name: 'Advanced Web & Mobile' },
              { code: 'CS3522', name: 'Operating Systems' },
              { code: 'CS3511', name: 'Database Systems' },
              { code: 'CS3531', name: 'Software Engineering' },
              { code: 'LAW1102', name: 'Lesotho Legal System' },
              { code: 'ECON2201', name: 'Macroeconomics' },
            ].map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => handleAddSingle(p.code, p.name)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-amber-400/60 text-slate-300 hover:text-white text-[11px] font-mono transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-amber-400" /> {p.code}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition"
          >
            <RotateCcw className="w-3 h-3" /> Reset to Demo Set
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
