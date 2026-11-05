import React, { useState, useEffect } from 'react';
import { Lock, Bell, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notifications';
import nulCrest from '../assets/images/crest';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, onOpenProfile }) => {
  const { user, hasPIN, lockApp } = useAuth();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateUnread = () => {
      const history = notificationService.getTriggeredHistory();
      setUnreadCount(history.filter((n) => !n.read).length);
    };

    updateUnread();
    window.addEventListener('thuto-notification-update', updateUnread);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('thuto-notification-update', updateUnread);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Zone — crest, name, honest connectivity line. The portal-mode
            dev badge was removed: the profile page is the honest place for
            mode info, and the header bar needs the room (cramped-reported). */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#10233D] to-[#020617] p-1 ring-2 ring-amber-500/70 shadow-sm shadow-amber-500/25 flex items-center justify-center overflow-hidden border border-amber-400/40 shrink-0">
            <img
              src={nulCrest}
              alt="NUL Crest"
              className="w-full h-full object-contain scale-[1.35]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <span className="font-display font-bold text-base tracking-tight text-white block leading-tight">
              Thuto Mobile
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                  <WifiOff className="w-3 h-3" /> Offline Cache Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls — uniform 40px targets, consistent rounding */}
        <div className="flex items-center gap-2">
          {hasPIN && (
            <button
              onClick={lockApp}
              title="Lock with PIN"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenNotifications}
            title="Notification Center"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {user && (
            <button
              onClick={onOpenProfile}
              title="Your profile"
              className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-semibold text-amber-300 select-none hover:bg-slate-700 hover:border-amber-500/40 transition active:scale-95"
            >
              {user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
