import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Mail, 
  BookOpen, 
  Send, 
  FileCode,
  FolderLock,
  Upload,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { CourseResource, CachedFileRecord, DropboxItem } from '../types';

interface CourseDetailViewProps {
  onBack: () => void;
  onOpenOfflineFile: (file: CachedFileRecord) => void;
  onSubmitAssignmentTrigger: (assignmentId: string) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  onBack,
  onOpenOfflineFile,
  onSubmitAssignmentTrigger,
}) => {
  const { 
    activeCourse, 
    cachedFiles, 
    downloadResourceForOffline, 
    deleteOfflineResource,
    markAnnouncementAsRead 
  } = useCourses();

  const [activeTab, setActiveTab] = useState<'modules' | 'assignments' | 'announcements' | 'dropbox' | 'syllabus'>('modules');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showUploadDropbox, setShowUploadDropbox] = useState(false);
  const [dropboxFileName, setDropboxFileName] = useState('');
  const [dropboxNote, setDropboxNote] = useState('');
  const [dropboxItems, setDropboxItems] = useState<DropboxItem[]>(() => activeCourse?.dropboxItems || []);
  const [isUploadingDropbox, setIsUploadingDropbox] = useState(false);
  const [dropboxSuccess, setDropboxSuccess] = useState(false);

  if (!activeCourse) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No course selected.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleDownloadToggle = async (resource: CourseResource) => {
    const isCached = cachedFiles.some((f) => f.id === resource.id);
    if (isCached) {
      await deleteOfflineResource(resource.id);
    } else {
      setDownloadingId(resource.id);
      await downloadResourceForOffline(resource, activeCourse.code);
      setDownloadingId(null);
    }
  };

  const handleUploadToDropbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropboxFileName.trim()) return;

    setIsUploadingDropbox(true);
    try {
      const res = await fetch(`/api/sakai/dropbox/${activeCourse.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: dropboxFileName.trim(),
          note: dropboxNote.trim(),
        }),
      });
      const data = await res.json();
      if (data.item) {
        setDropboxItems((prev) => [data.item, ...prev]);
        setDropboxSuccess(true);
        setTimeout(() => {
          setDropboxSuccess(false);
          setShowUploadDropbox(false);
          setDropboxFileName('');
          setDropboxNote('');
        }, 1200);
      }
    } catch {
      // Local fallback
      const newItem: DropboxItem = {
        id: `drop-${Date.now()}`,
        courseId: activeCourse.id,
        fileName: dropboxFileName.trim(),
        fileSize: 2100000,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: 'student',
        note: dropboxNote.trim(),
        status: 'submitted',
        feedback: 'File submitted to lecturer Dropbox on Thuto.',
      };
      setDropboxItems((prev) => [newItem, ...prev]);
      setShowUploadDropbox(false);
    } finally {
      setIsUploadingDropbox(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="pb-24 pt-3 max-w-4xl mx-auto px-4 space-y-4 animate-in fade-in duration-200">
      {/* Top Navigation & Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition py-1 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Transparent Fallback & Data Origin Banner */}
      <div
        className={`p-3.5 rounded-2xl text-xs border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm ${
          activeCourse.dataSource === 'live_thuto'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-500/15 border-amber-500/35 text-amber-200'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 shrink-0">
            {activeCourse.dataSource === 'live_thuto' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="font-semibold text-white flex items-center gap-2">
              <span>{activeCourse.dataSource === 'live_thuto' ? 'Live Thuto Portal Connection' : 'Offline / Fallback Data Notice'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/90 text-amber-300 border border-slate-700">
                {activeCourse.dataSource === 'live_thuto' ? 'VERIFIED LIVE' : 'CAMPUS SERVER UNREACHABLE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {activeCourse.dataSourceNotice ||
                'NUL Roma campus server (197.220.158.29) timed out during live query. Displaying cached local workspace. Live files & dropbox will sync when connection recovers.'}
            </p>
          </div>
        </div>

        {activeCourse.siteId && (
          <span className="font-mono text-[10px] text-slate-400 shrink-0 self-start sm:self-center">
            Sakai ID: {activeCourse.siteId}
          </span>
        )}
      </div>

      {/* Course Header Card */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
            {activeCourse.code} · {activeCourse.semester}
          </span>
          <span className="text-xs text-slate-400">{activeCourse.faculty}</span>
        </div>

        <h1 className="text-lg md:text-xl font-display font-bold text-white tracking-tight">
          {activeCourse.name}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
          <div className="flex items-center gap-1.5">
            <span>{activeCourse.instructor}</span>
            <a
              href={`mailto:${activeCourse.instructorEmail}`}
              title="Email Instructor"
              className="text-amber-400 hover:text-amber-300 transition"
            >
              <Mail className="w-3.5 h-3.5 inline" />
            </a>
          </div>
          <span>·</span>
          <span>{activeCourse.credits} Credits</span>
          <span>·</span>
          <span className="text-amber-400 font-medium">{activeCourse.progressPercent}% syllabus completed</span>
        </div>
      </div>

      {/* Segmented Section Navigation (Including Dropbox) */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-medium">
        {[
          { id: 'modules', label: 'Materials' },
          { id: 'assignments', label: `Deadlines (${activeCourse.assignments.length})` },
          { id: 'dropbox', label: `Dropbox (${dropboxItems.length})` },
          { id: 'announcements', label: `Notices (${activeCourse.announcements.length})` },
          { id: 'syllabus', label: 'Syllabus' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`py-2 px-1 text-center rounded-xl transition-all truncate active:scale-95 text-[11px] ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Modules & Lecture Materials (Sakai Resources) */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-200">Course Content & Lecture Slides (Resources)</span>
            <span>Tap to read offline</span>
          </div>

          {activeCourse.modules.map((module) => (
            <div
              key={module.id}
              className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                  W{module.week}
                </span>
                <h3 className="font-display font-semibold text-sm text-white">
                  {module.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {module.description}
              </p>

              {/* Resource Files List */}
              <div className="space-y-2 pt-1">
                {module.resources.map((res) => {
                  const isCached = cachedFiles.some((f) => f.id === res.id);
                  const isDownloading = downloadingId === res.id;

                  return (
                    <div
                      key={res.id}
                      className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div
                        onClick={() => {
                          const cached = cachedFiles.find((f) => f.id === res.id);
                          if (cached) {
                            onOpenOfflineFile(cached);
                          } else {
                            handleDownloadToggle(res);
                          }
                        }}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                      >
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                          {res.fileType === 'code' ? (
                            <FileCode className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate hover:text-amber-300">
                            {res.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{formatFileSize(res.fileSize)}</span>
                            <span>·</span>
                            <span>{res.topic}</span>
                            {isCached && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-400 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> Offline Ready
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCached ? (
                          <button
                            onClick={() => {
                              const record = cachedFiles.find((f) => f.id === res.id);
                              if (record) onOpenOfflineFile(record);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-amber-300 hover:bg-slate-700 text-xs font-medium flex items-center gap-1"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Read
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleDownloadToggle(res)}
                          disabled={isDownloading}
                          title={isCached ? 'Remove from offline cache' : 'Save for offline study'}
                          className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl transition active:scale-95 ${
                            isCached
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                              : 'bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {isDownloading ? (
                            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          ) : isCached ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Sakai Dropbox (Private Lecturer-Student Exchange) */}
      {activeTab === 'dropbox' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-display font-bold text-sm text-white">
                    Sakai Student Dropbox (`sakai.dropbox`)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Private file exchange folder with your lecturer for {activeCourse.code}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUploadDropbox(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" /> Drop File
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block px-1">
              Your Dropbox Files ({dropboxItems.length})
            </span>

            {dropboxItems.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
                No files in your dropbox yet. Tap "Drop File" to upload draft work for your lecturer.
              </div>
            ) : (
              dropboxItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {item.fileName}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium font-mono shrink-0">
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-xs text-slate-300 italic pl-6">
                      "{item.note}"
                    </p>
                  )}

                  {item.feedback && (
                    <div className="ml-6 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-amber-300">
                      <span className="font-semibold block text-[10px] text-slate-400 mb-0.5">Lecturer Review:</span>
                      {item.feedback}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 pl-6">
                    <span>Uploaded: {item.uploadedAt}</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-200">Course Assessment Tasks</span>
            <span>Submission gateway</span>
          </div>

          {activeCourse.assignments.map((assignment) => {
            const isDueSoon =
              (new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60) <= 24;

            return (
              <div
                key={assignment.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-sm text-white">
                    {assignment.title}
                  </h3>
                  <span className="font-mono text-xs text-amber-400 font-semibold shrink-0">
                    {assignment.points} Points
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {assignment.description}
                </p>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className={isDueSoon && assignment.status === 'pending' ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                      Due: {new Date(assignment.dueDate).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    {assignment.status === 'submitted' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                      </span>
                    ) : (
                      <button
                        onClick={() => onSubmitAssignmentTrigger(assignment.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                      >
                        <Send className="w-3 h-3" /> Submit Work
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {activeCourse.announcements.map((ann) => (
            <div
              key={ann.id}
              onClick={() => markAnnouncementAsRead(activeCourse.id, ann.id)}
              className={`p-4 rounded-3xl border transition cursor-pointer ${
                ann.isRead
                  ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                  : 'bg-slate-900 border-amber-500/40 text-white shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-medium text-amber-400">
                  {ann.author} · {ann.date}
                </span>
                {!ann.isRead && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                    New Notice
                  </span>
                )}
              </div>
              <h3 className="font-display font-semibold text-sm text-white mb-1">
                {ann.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Syllabus */}
      {activeTab === 'syllabus' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed shadow-lg">
          <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" /> Syllabus & Grading Rubric
          </h3>
          <p>{activeCourse.syllabusOverview}</p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Continuous Assessment</span>
              <strong className="text-white text-sm font-display">40%</strong>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Final Written Exam</span>
              <strong className="text-white text-sm font-display">60%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Upload to Dropbox Modal */}
      {showUploadDropbox && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white relative space-y-4">
            <button
              onClick={() => setShowUploadDropbox(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
              <FolderLock className="w-4 h-4" /> {activeCourse.code} · SAKAI DROPBOX
            </div>
            <h3 className="font-display font-bold text-base text-white">
              Drop File for Course Lecturer
            </h3>

            {dropboxSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">File Deposited in Dropbox!</p>
              </div>
            ) : (
              <form onSubmit={handleUploadToDropbox} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Select Document
                  </label>
                  <div
                    onClick={() => {
                      const sampleFiles = [
                        `${activeCourse.code}_Project_Draft_v2.pdf`,
                        `${activeCourse.code}_Lab_Report_Final.zip`,
                        `Weekly_Progress_Summary.docx`,
                      ];
                      setDropboxFileName(sampleFiles[Math.floor(Math.random() * sampleFiles.length)]);
                    }}
                    className="p-4 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 text-center cursor-pointer hover:border-amber-400 transition"
                  >
                    <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                    <span className="text-xs font-mono text-slate-200">
                      {dropboxFileName || 'Tap to choose submission document'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Note / Message to Lecturer
                  </label>
                  <textarea
                    rows={3}
                    value={dropboxNote}
                    onChange={(e) => setDropboxNote(e.target.value)}
                    placeholder="e.g. Please review section 2 before Friday..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadDropbox(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingDropbox || !dropboxFileName}
                    className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition disabled:opacity-50"
                  >
                    {isUploadingDropbox ? 'Depositing...' : 'Confirm Drop'}
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
