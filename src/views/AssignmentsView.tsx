import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  Send, 
  Upload, 
  X, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { Assignment } from '../types';

export const AssignmentsView: React.FC<{ selectedAssignmentId?: string | null }> = ({
  selectedAssignmentId,
}) => {
  const { allAssignments, submitAssignment } = useCourses();
  const [filter, setFilter] = useState<'all' | 'due-soon' | 'submitted'>('all');
  const [activeModalAssignment, setActiveModalAssignment] = useState<Assignment | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Live timer tick for real-time countdown display
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedAssignmentId) {
      const found = allAssignments.find((a) => a.id === selectedAssignmentId);
      if (found) setActiveModalAssignment(found);
    }
  }, [selectedAssignmentId, allAssignments]);

  const getCountdownParts = (dueDateStr: string) => {
    const total = new Date(dueDateStr).getTime() - Date.now();
    if (total <= 0) return { expired: true, text: 'Overdue' };

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return {
        expired: false,
        text: `${days}d ${hours}h ${minutes}m`,
        isUrgent: days === 0,
      };
    }
    return {
      expired: false,
      text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      isUrgent: true,
    };
  };

  const filteredAssignments = allAssignments.filter((assignment) => {
    if (filter === 'submitted') return assignment.status === 'submitted';
    if (filter === 'due-soon') {
      if (assignment.status === 'submitted') return false;
      const diff = (new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
      return diff > 0 && diff <= 24;
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalAssignment) return;

    setIsSubmitting(true);
    await submitAssignment(
      activeModalAssignment.id,
      submissionNotes,
      uploadedFileName || 'Assignment_Submission_Final.pdf'
    );
    setIsSubmitting(false);
    setSuccessMsg(true);

    setTimeout(() => {
      setSuccessMsg(false);
      setActiveModalAssignment(null);
      setSubmissionNotes('');
      setUploadedFileName('');
    }, 1200);
  };

  return (
    <div className="pb-24 pt-3 max-w-4xl mx-auto px-4 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-400" />
            Assignment Deadlines & Submissions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized with university course calendars with automated countdown notifications
          </p>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs self-start">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition font-medium ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({allAssignments.length})
          </button>
          <button
            onClick={() => setFilter('due-soon')}
            className={`px-3 py-1.5 rounded-xl transition font-medium ${
              filter === 'due-soon'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Due Soon (&lt;24h)
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1.5 rounded-xl transition font-medium ${
              filter === 'submitted'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Submitted
          </button>
        </div>
      </div>

      {/* Deadlines List */}
      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400/80 mb-2" />
            <p className="text-sm font-medium text-slate-200">No matching deadlines found</p>
            <p className="text-xs text-slate-500 mt-1">All coursework in this category is up to date.</p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const countdown = getCountdownParts(assignment.dueDate);
            const isSubmitted = assignment.status === 'submitted';

            return (
              <div
                key={assignment.id}
                className={`p-4 rounded-3xl border transition-all shadow-md ${
                  isSubmitted
                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                    : countdown.isUrgent
                    ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-[#1F1912] border-amber-500/40 text-white'
                    : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                        {assignment.courseCode}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-400">
                        {assignment.points} Maximum Points
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-sm text-white">
                      {assignment.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {assignment.description}
                    </p>
                  </div>

                  {/* Countdown Badge / Submission Action */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    {!isSubmitted ? (
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                          Time Remaining
                        </span>
                        <div
                          className={`font-mono text-sm font-bold tabular-nums px-2.5 py-1 rounded-xl border ${
                            countdown.isUrgent
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10'
                              : 'bg-slate-800/90 border-slate-700 text-slate-200'
                          }`}
                        >
                          {countdown.text}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                      </span>
                    )}

                    {!isSubmitted && (
                      <button
                        onClick={() => setActiveModalAssignment(assignment)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Work
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Due Date: {new Date(assignment.dueDate).toLocaleString()}</span>
                  {assignment.feedback && (
                    <span className="text-amber-400/90 italic truncate max-w-xs">
                      {assignment.feedback}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submission Modal */}
      {activeModalAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white relative">
            <button
              onClick={() => setActiveModalAssignment(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {successMsg ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">
                  Submission Successfully Recorded!
                </h3>
                <p className="text-xs text-slate-300">
                  Transmitted to Thuto Sakai gateway. A confirmation receipt has been logged.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
                    {activeModalAssignment.courseCode} · Portal Submission
                  </div>
                  <h2 className="font-display font-bold text-base text-white mt-1">
                    {activeModalAssignment.title}
                  </h2>
                </div>

                {/* File Attachment Box */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Attach Document / Archive (PDF, ZIP, DOCX)
                  </label>
                  <div
                    onClick={() => {
                      // Simulate native file picker
                      const mockFiles = [
                        `${activeModalAssignment.courseCode}_Final_Assignment.pdf`,
                        'Lab_Report_Complete.zip',
                        'Term_Paper_Draft.docx',
                      ];
                      const selected = mockFiles[Math.floor(Math.random() * mockFiles.length)];
                      setUploadedFileName(selected);
                    }}
                    className="p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-950/60 flex flex-col items-center justify-center text-center cursor-pointer transition"
                  >
                    <Upload className="w-6 h-6 text-amber-400 mb-1.5" />
                    <span className="text-xs text-slate-200 font-medium">
                      {uploadedFileName ? (
                        <span className="text-emerald-400 font-mono">{uploadedFileName}</span>
                      ) : (
                        'Tap to select submission file'
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Max file size: 50MB (Accepted by Thuto Sakai)
                    </span>
                  </div>
                </div>

                {/* Comments / Notes */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Submission Comments or Online Text
                  </label>
                  <textarea
                    rows={3}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Add student remarks or paste solution link..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModalAssignment(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Transmitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Confirm Submission
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
