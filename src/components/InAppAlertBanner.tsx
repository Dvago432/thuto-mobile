import React, { useState, useEffect } from 'react';
import { BellRing, X, ArrowRight } from 'lucide-react';

interface AlertDetail {
  title: string;
  body: string;
  timestamp: string;
}

export const InAppAlertBanner: React.FC<{ onViewDeadlines: () => void }> = ({ onViewDeadlines }) => {
  const [currentAlert, setCurrentAlert] = useState<AlertDetail | null>(null);

  useEffect(() => {
    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent<AlertDetail>;
      if (customEvent.detail) {
        setCurrentAlert(customEvent.detail);
      }
    };

    window.addEventListener('thuto-inapp-alert', handleAlert);
    return () => window.removeEventListener('thuto-inapp-alert', handleAlert);
  }, []);

  if (!currentAlert) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/40 text-white shadow-xl shadow-slate-950/50 flex items-start gap-3 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <BellRing className="w-4 h-4 animate-bounce" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-amber-300 truncate">
              {currentAlert.title}
            </h4>
            <button
              onClick={() => setCurrentAlert(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
            {currentAlert.body}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentAlert(null);
                onViewDeadlines();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition"
            >
              Open Assignment <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
