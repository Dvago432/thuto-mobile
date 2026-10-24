import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Play, 
  Trash2,
  Check
} from 'lucide-react';
import { notificationService } from '../services/notifications';
import { NotificationRule, TriggeredNotification } from '../types';

export const NotificationsView: React.FC<{ onViewAssignment: (assignmentId: string) => void }> = ({
  onViewAssignment,
}) => {
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
          Smart Countdown Alerts
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Automated multi-interval notification alerts for assignment submission deadlines
        </p>
      </div>

      {/* Permission Card */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-xs text-white">
                Browser Notification Permission
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
              {permission === 'granted'
                ? 'System push notifications are active on this device'
                : 'Enable system notifications so you receive countdown alerts in the background'}
            </p>
          </div>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={handleRequestPermission}
            className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shrink-0 active:scale-95"
          >
            Enable Alerts
          </button>
        )}
      </div>

      {/* Countdown Schedule Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-200">Configured Countdown Intervals</span>
          <span>Based on user selection</span>
        </div>

        <div className="space-y-2.5">
          {rules.map((rule) => (
            <div
              key={rule.key}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800/90 flex items-center justify-between gap-3 transition"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <h4 className="font-display font-semibold text-xs text-white">
                    {rule.label}
                  </h4>
                  <span className="font-mono text-[10px] text-slate-500">
                    ({Math.round(rule.secondsBefore / 3600)}h before cutoff)
                  </span>
                </div>
                <p className="text-xs text-slate-400 pl-5.5">{rule.description}</p>
              </div>

              {/* Tactile Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggleRule(rule.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  rule.enabled ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                    rule.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notification Test Lab */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-amber-500/30 space-y-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <h3 className="font-display font-bold text-xs text-white">
            Instant Push Notification & Audio Chime Simulator
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Verify your device audio and notification delivery immediately without waiting for actual deadlines.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400">Trigger Interval:</span>
          {(['3d', '24h', '6h', '3h', '1h'] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setTestSelectedRule(interval)}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono transition font-medium ${
                testSelectedRule === interval
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {interval}
            </button>
          ))}

          <button
            onClick={handleFireTest}
            className="ml-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
          >
            {testingSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" /> Dispatched!
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Test Alert Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert History / Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-200">
            Triggered Notification History ({history.length})
          </span>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleMarkAllRead}
                  className="text-amber-400 hover:text-amber-300 transition text-[11px]"
                >
                  Mark all read
                </button>
                <button
                  onClick={handleClearHistory}
                  className="text-slate-500 hover:text-rose-400 transition text-[11px]"
                >
                  Clear history
                </button>
              </>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
            No notification logs yet. Use the simulator above to test.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => onViewAssignment(item.assignmentId)}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                  item.read
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                    : 'bg-slate-900 border-amber-500/30 text-white shadow-sm'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-amber-400">
                      [{item.courseCode}]
                    </span>
                    <span className="text-xs font-semibold text-white truncate">
                      {item.assignmentTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="text-amber-300 font-medium">Alert: {item.thresholdLabel}</span>
                    <span>·</span>
                    <span>{new Date(item.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="text-xs text-amber-400 font-semibold shrink-0">
                  View &gt;
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
