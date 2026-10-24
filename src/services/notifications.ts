import { Assignment, NotificationRule, TriggeredNotification } from '../types';

export const DEFAULT_RULES: NotificationRule[] = [
  {
    key: '3d',
    label: '3 Days Ahead',
    secondsBefore: 3 * 24 * 60 * 60, // 259200 seconds
    enabled: true,
    description: 'Initial heads-up to prepare submission draft and materials.',
  },
  {
    key: '24h',
    label: '24 Hours Ahead',
    secondsBefore: 24 * 60 * 60, // 86400 seconds
    enabled: true,
    description: 'Final day alert to review checklist and finalize document.',
  },
  {
    key: '6h',
    label: '6 Hours Ahead',
    secondsBefore: 6 * 60 * 60, // 21600 seconds
    enabled: true,
    description: 'Midday urgency reminder before evening cutoff.',
  },
  {
    key: '3h',
    label: '3 Hours Ahead',
    secondsBefore: 3 * 60 * 60, // 10800 seconds
    enabled: true,
    description: 'Urgent reminder to begin portal submission upload.',
  },
  {
    key: '1h',
    label: '1 Hour Ahead',
    secondsBefore: 1 * 60 * 60, // 3600 seconds
    enabled: true,
    description: 'Critical final hour alert to avoid portal network congestion.',
  },
];

const NOTIFICATIONS_STORAGE_KEY = 'thuto_triggered_notifications_v1';
const RULES_STORAGE_KEY = 'thuto_notification_rules_v1';

class NotificationService {
  private audioCtx: AudioContext | null = null;

  getRules(): NotificationRule[] {
    try {
      const raw = localStorage.getItem(RULES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse notification rules:', e);
    }
    return DEFAULT_RULES;
  }

  saveRules(rules: NotificationRule[]): void {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
  }

  getTriggeredHistory(): TriggeredNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse notification history:', e);
    }
    return [];
  }

  saveTriggeredHistory(history: TriggeredNotification[]): void {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(history.slice(-50)));
  }

  markAllAsRead(): void {
    const history = this.getTriggeredHistory().map((n) => ({ ...n, read: true }));
    this.saveTriggeredHistory(history);
    window.dispatchEvent(new CustomEvent('thuto-notification-update'));
  }

  clearHistory(): void {
    this.saveTriggeredHistory([]);
    window.dispatchEvent(new CustomEvent('thuto-notification-update'));
  }

  // Synthesize clean dual-tone academic chime via Web Audio API
  playChime(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Pleasant ascending collegiate chime: D5 (587Hz) to A5 (880Hz)
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      osc2.frequency.setValueAtTime(880, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now + 0.15);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.75);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  sendNotification(title: string, body: string, tag: string): void {
    this.playChime();

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          tag,
          icon: '/icon.svg',
          badge: '/icon.svg',
        });
      } catch {
        // Fallback in environments where Notification constructor is restricted
      }
    }

    // Always dispatch in-app event for immediate UI banner toast
    window.dispatchEvent(
      new CustomEvent('thuto-inapp-alert', {
        detail: { title, body, timestamp: new Date().toISOString() },
      })
    );
  }

  testNotification(ruleKey: '3d' | '24h' | '6h' | '3h' | '1h', sampleTitle = 'Term Project Final Submission'): void {
    const rules = this.getRules();
    const rule = rules.find((r) => r.key === ruleKey) || DEFAULT_RULES[0];

    const title = `Deadline Alert: ${sampleTitle}`;
    const body = `Urgent: Due in ${rule.label} on Thuto Sakai Portal. Review rubric and submit before deadline!`;

    const newRecord: TriggeredNotification = {
      id: `test-${Date.now()}`,
      assignmentId: 'test-assign-id',
      courseCode: 'CS3541',
      assignmentTitle: sampleTitle,
      thresholdLabel: rule.label,
      triggeredAt: new Date().toISOString(),
      read: false,
    };

    const history = this.getTriggeredHistory();
    this.saveTriggeredHistory([newRecord, ...history]);
    window.dispatchEvent(new CustomEvent('thuto-notification-update'));

    this.sendNotification(title, body, `test-${ruleKey}`);
  }

  checkAndTriggerDeadlines(assignments: Assignment[]): void {
    const rules = this.getRules().filter((r) => r.enabled);
    const history = this.getTriggeredHistory();
    const now = Date.now();

    assignments.forEach((assignment) => {
      if (assignment.status === 'submitted' || assignment.status === 'graded') return;

      const dueTime = new Date(assignment.dueDate).getTime();
      const secondsLeft = Math.floor((dueTime - now) / 1000);

      if (secondsLeft <= 0) return; // already overdue

      for (const rule of rules) {
        // If within rule window (e.g. within secondsBefore and not older than 15 mins past threshold)
        const diff = secondsLeft - rule.secondsBefore;
        if (diff <= 0 && diff >= -1800) {
          const notificationTag = `${assignment.id}-${rule.key}`;
          const alreadySent = history.some(
            (h) => h.assignmentId === assignment.id && h.thresholdLabel === rule.label
          );

          if (!alreadySent) {
            const title = `⚠️ Due in ${rule.label}: [${assignment.courseCode}]`;
            const body = `"${assignment.title}" is due soon. Open Thuto Mobile to complete submission.`;

            const record: TriggeredNotification = {
              id: notificationTag,
              assignmentId: assignment.id,
              courseCode: assignment.courseCode,
              assignmentTitle: assignment.title,
              thresholdLabel: rule.label,
              triggeredAt: new Date().toISOString(),
              read: false,
            };

            this.saveTriggeredHistory([record, ...history]);
            this.sendNotification(title, body, notificationTag);
            window.dispatchEvent(new CustomEvent('thuto-notification-update'));
          }
        }
      }
    });
  }
}

export const notificationService = new NotificationService();
