import React, { useState, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';
import { notificationService } from '../services/notifications';
import { NotificationRule, TriggeredNotification, CourseAnnouncement } from '../types';
import { useCourses } from '../context/CourseContext';

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

  useEffect(() => {
    const handleUpdate = () => {
      setHistory(notificationService.getTriggeredHistory());
    };

    window.addEventListener('thuto-notification-update', handleUpdate);
    return () => window.removeEventListener('thuto-notification-update', handleUpdate);
  }, []);

  // Aggregate real announcements across all enrolled courses
  const allAnnouncements = React.useMemo(() => {
    const list: CourseAnnouncement[] = [];
    courses.forEach((c) => {
      if (Array.isArray(c.announcements)) {
        c.announcements.forEach((a) => {
          list.push({ ...a, courseCode: c.code, courseId: c.id });
        });
      }
    });
    // Sort newest first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [courses]);

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
          Lecturer Notices ({allAnnouncements.length})
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
          Deadline Alarms ({history.length})
        </button>
      </div>

      {/* Tab 1: Real Lecturer Course Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-200">Enrolled Course Broadcasts</span>
            <span>Synchronized from Thuto Sakai</span>
          </div>

          {allAnnouncements.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
              <Megaphone className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No course announcements yet</p>
              <p className="text-[11px] text-slate-500">
                When lecturers publish announcements on Thuto for your enrolled courses, they will appear here.
              </p>
            </div>
          ) : (
            allAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      {ann.courseCode}
                    </span>
                    <span className="text-xs text-slate-400">
                      by {ann.author} · {ann.date}
                    </span>
                  </div>
                  {ann.courseId && (
                    <button
                      onClick={() => setActiveCourseId(ann.courseId)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                    >
                      <BookOpen className="w-3 h-3" /> Course
                    </button>
                  )}
                </div>

                <h3 className="font-display font-semibold text-sm text-white pt-0.5">
                  {ann.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {ann.content}
                </p>
              </div>
            ))
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

          {/* Triggered Alarms History */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-semibold text-slate-200">
                Triggered Alarms History ({history.length})
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

            {history.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                No deadline countdown alarms have fired yet.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
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
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
