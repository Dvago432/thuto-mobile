import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      <div className="mx-4 my-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#10233D] border border-amber-500/30 text-white shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-display font-semibold text-xs text-white">
              Install Thuto Mobile on Android
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              Reliable offline study cache & instant deadline push notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 font-medium text-xs hover:bg-slate-700 transition flex items-center gap-1.5"
            >
              Install Guide
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-base text-white">
                Install on iPhone & iPad
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              To install Thuto Mobile for offline access and home screen notifications:
            </p>
            <ol className="space-y-3 text-xs text-slate-300 mb-5">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <span>
                  Tap the Safari <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1" /> at the bottom of the screen.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <span>Launch Thuto directly from your home screen for full offline caching!</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
