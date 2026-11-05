import React, { useState, useEffect, useMemo } from 'react';
import { 
  BellRing, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Play, 
  Trash2,
  Check,
  Megaphone,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { notificationService } from '../services/notifications';
import { NotificationRule, TriggeredNotification, CourseAnnouncement, Course } from '../types';
import { useCourses } from '../context/CourseContext';
import { alertKind, alertKindPriority, ALERT_KIND_META, isOlderThanMonths } from '../utils/alerts';

// Concept (caveat items 1, 2, 12): the first glance gives CONTEXT — kind,
// course, and age — never a wall of text. The full body is a tap away.
const CourseFilterChips: React.FC<{
  courses: Course[];
  value: string;
  onChange: (v: string) => void;
}> = ({ courses, value, onChange }) => {
  const codes = Array.from(new Set(courses.map((c) => c.code)));
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
      <button
        onClick={() => onChange('all')}
        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition shrink-0 ${
          value === 'all'
            ? 'bg-amber-500 text-slate-950 border-amber-500'
            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
        }`}
      >
        All courses
      </button>
      {codes.map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border transition shrink-0 ${
            value === code
              ? 'bg-amber-500 text-slate-950 border-amber-500'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
};

export const NotificationsView: React.FC<{ onViewAssignment: (assignmentId: string) => void }> = ({
  onViewAssignment,
}) => {
  const { courses, setActiveCourseId } = useCourses();

  const [activeTab, setActiveTab] = useState<'announcements' | 'alerts'>('announcements');
  const [rules, setRules] = useState<NotificationRule[]>(() => notificationService.getRules());
  const [history, setHistory] = useState<TriggeredNotification[]>(() =>
    notificationService.getTriggeredHistory()
  );
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });
  const [testSelectedRule, setTestSelectedRule] = useState<'3d' | '24h' | '6h' | '3h' | '1h'>('1h');
  const [testingSuccess, setTestingSuccess] = useState(false);
  // Caveat item 2: alerts render COLLAPSED (context only); one tap expands.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Caveat item 1: per-course filtering, one chip row per tab.
  const [annCourseFilter, setAnnCourseFilter] = useState<string>('all');
  const [alarmCourseFilter, setAlarmCourseFilter] = useState<string>('all');

  useEffect(() => {
    const handleUpdate = () => {
      setHistory(notificationService.getTriggeredHistory());
    };

    window.addEventListener('thuto-notification-update', handleUpdate);
    return () => window.removeEventListener('thuto-notification-update', handleUpdate);
  }, []);

  // Aggregate real announcements across all enrolled courses, then apply the
  // caveat-1/4 rules: 6-month retention, course filter, TEST > LAB > rest
  // priority, recency inside each priority class.
  const visibleAnnouncements = React.useMemo(() => {
    const list: CourseAnnouncement[] = [];
    courses.forEach((c) => {
      if (Array.isArray(c.announcements)) {
        c.announcements.forEach((a) => {
          list.push({ ...a, courseCode: c.code, courseId: c.id });
        });
      }
    });
    return list
      .filter((a) => !isOlderThanMonths(a.date, 6))
      .filter((a) => annCourseFilter === 'all' || a.courseCode === annCourseFilter)
      .sort(
        (a, b) =>
          alertKindPriority(a.title) - alertKindPriority(b.title) ||
          Date.parse(b.date) - Date.parse(a.date)
      );
  }, [courses, annCourseFilter]);

  // Same rules for the deadline-alarm history (classification runs on the
  // assignment title, so 'TEST 1' alarm outranks a project submission one).
  const visibleHistory = React.useMemo(() => {
    return notificationService
      .sortPriority(history.filter((h) => !isOlderThanMonths(h.triggeredAt, 6)))
      .filter((h) => alarmCourseFilter === 'all' || h.courseCode === alarmCourseFilter);
  }, [history, alarmCourseFilter]);

  const handleToggleRule = (key: NotificationRule['key']) => {
    const nextRules = rules.map((r) => (r.key === key ? { ...r, enabled: !r.enabled } : r));
    setRules(nextRules);
    notificationService.saveRules(nextRules);
  };

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
  };

  const handleFireTest = () => {
    notificationService.testNotification(testSelectedRule);
    setTestingSuccess(true);
    setTimeout(() => setTestingSuccess(false), 2000);
  };

  const handleClearHistory = () => {
    notificationService.clearHistory();
    setHistory([]);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  return (
    <div className="pb-24 pt-3 max-w-4xl mx-auto px-4 space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
          <BellRing className="w-5 h-5 text-amber-400" />
          Notifications &amp; Announcements
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real Thuto course broadcasts from lecturers and multi-interval submission alarms
        </p>
      </div>

      {/* Segmented Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`py-2 px-3 text-center rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'announcements'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          Lecturer Notices ({visibleAnnouncements.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-2 px-3 text-center rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'alerts'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Deadline Alarms ({visibleHistory.length})
        </button>
      </div>

      {/* Tab 1: Real Lecturer Course Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-200">Priority order: Tests first, then labs</span>
            <span className="hidden sm:inline">Tap an alert to read it</span>
          </div>

          <CourseFilterChips courses={courses} value={annCourseFilter} onChange={setAnnCourseFilter} />

          {visibleAnnouncements.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
              <Megaphone className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No course announcements yet</p>
              <p className="text-[11px] text-slate-500">
                When lecturers publish announcements on Thuto for your enrolled courses, they will appear here.
              </p>
            </div>
          ) : (
            visibleAnnouncements.map((ann) => {
              const kind = alertKind(ann.title);
              const meta = ALERT_KIND_META[kind];
              const expanded = expandedId === ann.id;
              return (
                <div
                  key={ann.id}
                  className={`rounded-3xl bg-slate-900 border transition ${
                    expanded
                      ? 'p-4 border-amber-500/30 space-y-2 shadow-lg cursor-pointer'
                      : 'p-3 border-slate-800 hover:border-slate-700 cursor-pointer shadow-sm'
                  }`}
                  // Chevron contract: tap toggles BOTH ways — an open card
                  // collapses on tap (the previous 'do nothing when expanded'
                  // froze the chevron down, which the student reported).
                  onClick={() => setExpandedId(expanded ? null : ann.id)}
                >
                  {/* Collapsed = context only: kind, course, age, title (item 2) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {ann.courseCode}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(ann.date).toLocaleDateString()}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  <h3
                    className={`font-display font-semibold text-sm text-white ${expanded ? 'font-bold' : 'truncate pt-0.5'}`}
                  >
                    {ann.title}
                  </h3>

                  {expanded && (
                    <div className="pt-2.5 border-t border-slate-800/70 space-y-2">
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {ann.content}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          by {ann.author} · {ann.date}
                        </span>
                        {ann.courseId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCourseId(ann.courseId);
                            }}
                            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                          >
                            <BookOpen className="w-3 h-3" /> Course
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Deadline Alarms & Threshold Config */}
      {activeTab === 'alerts' && (
        <div className="space-y-5">
          {/* Permission Card */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-xs text-white">
                    Push Notification Permission
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      permission === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : permission === 'denied'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {permission.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enables multi-interval submission alarms even when the app is minimized.
                </p>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0 active:scale-95"
              >
                Enable
              </button>
            )}
          </div>

          {/* Sound & Chime Demo Player */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-semibold text-xs text-white">
                  Collegiate Alert Chime
                </h3>
              </div>
              <button
                onClick={handleFireTest}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Play className="w-3 h-3 fill-amber-300" /> Test Chime
              </button>
            </div>
          </div>

          {/* Alert Thresholds */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-200 block px-1">
              Active Countdown Thresholds
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rules.map((rule) => (
                <div
                  key={rule.key}
                  onClick={() => handleToggleRule(rule.key)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                    rule.enabled
                      ? 'bg-slate-900 border-amber-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-400 font-mono block">
                      {rule.label}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {rule.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                      rule.enabled
                        ? 'bg-amber-500 border-amber-400 text-slate-950'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {rule.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Triggered Alarms History — priority-ordered, filterable, 6-month
              retention (caveat items 1, 4) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-semibold text-slate-200">
                Triggered Alarms ({visibleHistory.length})
              </span>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] transition"
                >
                  <Trash2 className="w-3 h-3" /> Clear Log
                </button>
              )}
            </div>

            <CourseFilterChips courses={courses} value={alarmCourseFilter} onChange={setAlarmCourseFilter} />

            {visibleHistory.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                No deadline countdown alarms have fired yet.
              </div>
            ) : (
              <div className="space-y-2">
                {visibleHistory.map((item) => {
                  const meta = ALERT_KIND_META[alertKind(item.assignmentTitle)];
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${meta.badge}`}>
                            {meta.label}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            {item.courseCode} · {item.thresholdLabel}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(item.triggeredAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-white truncate mt-1">
                          {item.assignmentTitle}
                        </p>
                      </div>

                      <button
                        onClick={() => onViewAssignment(item.assignmentId)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold shrink-0"
                      >
                        View Task
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
