import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  Clock, 
  FileText, 
  GraduationCap, 
  Sparkles,
  RefreshCw,
  ChevronRight,
  DownloadCloud
} from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { PWAInstallBanner } from '../components/PWAInstallBanner';
import { SakaiSyncModal } from '../components/SakaiSyncModal';

interface DashboardViewProps {
  onSelectCourse: (courseId: string) => void;
  onOpenDeadlines: () => void;
  onOpenDownloads: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectCourse,
  onOpenDeadlines,
  onOpenDownloads,
}) => {
  const { user } = useAuth();
  const { 
    courses, 
    allAssignments, 
    cachedFiles, 
    searchQuery, 
    setSearchQuery,
    isLoadingCourses,
    reloadEnrolledCourses
  } = useCourses();

  const [refreshing, setRefreshing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Compute stats
  const pendingAssignments = allAssignments.filter((a) => a.status === 'pending');
  const urgentAssignments = pendingAssignments.filter((a) => {
    const diff = (new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
    return diff > 0 && diff <= 24;
  });

  // Calculate average course progress
  const avgProgress = Math.round(
    courses.reduce((acc, c) => acc + c.progressPercent, 0) / (courses.length || 1)
  );

  // Search-only filtering: the faculty chip row was removed in favor of the
  // search bar, which already matches code, title, or lecturer.
  const filteredCourses = courses.filter((course) => 
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleManualSync = () => {
    setShowSyncModal(true);
  };

  return (
    <div className="pb-24 pt-2 max-w-4xl mx-auto px-4 space-y-5 animate-in fade-in duration-300">
      {/* Centered School Logo & Institutional Header at Top of Home Page */}
      <div className="flex flex-col items-center justify-center text-center pt-2 pb-1 space-y-2.5">
        <div className="relative group flex items-center justify-center">
          {/* Subtle golden ambient back-glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/40 via-amber-400/30 to-amber-600/40 rounded-full blur-lg opacity-85 group-hover:opacity-100 transition duration-500" />
          
          {/* Amber Circular Medallion Frame */}
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-b from-[#10233D] via-[#0B192C] to-[#020617] p-2 ring-2 ring-amber-500/70 shadow-2xl shadow-amber-500/25 flex items-center justify-center overflow-hidden border border-amber-400/40">
            <img
              src="/src/assets/images/nul_crest_original_themed.png"
              alt="National University of Lesotho Official Crest"
              className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[11px] md:text-xs font-bold tracking-widest uppercase text-amber-400 font-display">
            National University of Lesotho
          </span>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">
            Thuto Learning Portal · <span className="italic text-amber-300/90 font-serif">"Nete ke Thebe"</span>
          </p>
        </div>
      </div>

      <PWAInstallBanner />

      {/* Hero Welcome & Circular Dial Progress Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#10233D] to-[#1E3E62] border border-amber-500/20 p-5 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                {user?.program || 'Undergraduate Portal'}
              </span>
              {/* Only render a year if the portal actually supplied one — never fabricate it. */}
              {user?.year != null && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="text-xs text-slate-300">Year {user.year}</span>
                </>
              )}
            </div>
            
            <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
              Lumela, {user?.fullName?.split(' ')[0] || 'Student'}!
            </h1>
            
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              You have <strong className="text-amber-400">{pendingAssignments.length} pending submissions</strong> across your registered courses. Materials are securely synced for offline study.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenDeadlines}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-amber-500/10"
              >
                <Clock className="w-3.5 h-3.5" /> View Deadlines
              </button>
              <button
                onClick={handleManualSync}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700/60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
                {refreshing ? 'Syncing...' : 'Sync Portal'}
              </button>
            </div>
          </div>

          {/* Tactile Progress Dial (Inspired by Smart Home & Learn Up gauges) */}
          <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 shrink-0 backdrop-blur-md">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="text-slate-800"
                  strokeWidth="7"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="text-amber-400 transition-all duration-1000 ease-out"
                  strokeWidth="7"
                  strokeDasharray={201}
                  strokeDashoffset={201 - (201 * avgProgress) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display font-extrabold text-lg text-white tabular-nums leading-none">
                  {avgProgress}%
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">Term Goal</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-slate-300 font-medium">Academic Standing</div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <FileText className="w-3 h-3 text-amber-400" />
                <span>{cachedFiles.length} cached offline</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>91% attendance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Deadlines Alert Banner if any <= 24h */}
      {urgentAssignments.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-amber-300 truncate">
                {urgentAssignments.length} Assignment{urgentAssignments.length > 1 ? 's' : ''} Due in &lt; 24h
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {urgentAssignments[0].courseCode}: {urgentAssignments[0].title}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDeadlines}
            className="text-xs text-amber-400 font-semibold flex items-center gap-1 hover:text-amber-300 shrink-0"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by code, title, or lecturer..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-200">
            Enrolled Courses ({filteredCourses.length})
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => reloadEnrolledCourses()}
              disabled={isLoadingCourses}
              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
              title="Auto-load enrolled courses from Thuto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCourses ? 'animate-spin' : ''}`} />
              <span>{isLoadingCourses ? 'Auto-loading...' : 'Auto-Load'}</span>
            </button>
            <span className="text-[11px] text-slate-500">Semester 1</span>
          </div>
        </div>

        {isLoadingCourses && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
            <span>Auto-loading enrolled course workspaces from Thuto Sakai server...</span>
          </div>
        )}

        {filteredCourses.length === 0 && !isLoadingCourses ? (
          <div className="p-10 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 space-y-3 shadow-md">
            <GraduationCap className="w-10 h-10 text-amber-500/60 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-sm text-white">No Enrolled Courses Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No active courses are currently loaded for your student account. Tap below to automatically sync or enter your registered module codes.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setShowSyncModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync Course Modules
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCourses.map((course) => {
              const nextPending = course.assignments.find((a) => a.status === 'pending');
              const cachedCount = cachedFiles.filter((f) => f.courseCode === course.code).length;

              return (
                <div
                  key={course.id}
                  onClick={() => onSelectCourse(course.id)}
                  className="group p-4 rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-amber-500/40 transition-all cursor-pointer shadow-lg active:scale-[0.99] flex flex-col justify-between"
                >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                      {course.code}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {course.credits} Credits
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-sm text-white mt-1 group-hover:text-amber-300 transition-colors line-clamp-1">
                    {course.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {course.syllabusOverview}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/70 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{course.instructor}</span>
                    <span className="font-mono font-medium text-slate-300">
                      {course.progressPercent}% syllabus
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    {nextPending ? (
                      <span className="text-amber-400/90 flex items-center gap-1 truncate max-w-[190px]">
                        <Clock className="w-3 h-3 shrink-0" />
                        Next: {nextPending.title}
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        All assignments submitted
                      </span>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                      {cachedCount > 0 && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title="Offline files cached">
                          <DownloadCloud className="w-3 h-3 text-amber-400" /> {cachedCount}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Sakai Course Sync Modal */}
      <SakaiSyncModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </div>
  );
};
