import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Shield, 
  Server, 
  DownloadCloud, 
  LogOut, 
  Smartphone, 
  CheckCircle2, 
  GraduationCap,
  Sparkles,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { formatBytes } from '../utils/format';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { SakaiSyncModal } from '../components/SakaiSyncModal';

export const ProfileSettingsView: React.FC = () => {
  const { 
    user, 
    logout, 
    isPersistent, 
    hasPIN, 
    setQuickPIN, 
    portalMode, 
    setPortalMode 
  } = useAuth();
  const { storageUsage, clearAllOfflineStorage } = useCourses();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSavedSuccess, setPinSavedSuccess] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [pingData, setPingData] = useState<any>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length === 4) {
      setQuickPIN(pinInput);
      setPinSavedSuccess(true);
      setTimeout(() => {
        setPinSavedSuccess(false);
        setShowPinSetup(false);
        setPinInput('');
      }, 1200);
    }
  };

  const handleRemovePin = () => {
    setQuickPIN(null);
  };

  const formatSize = formatBytes;

  return (
    <div className="pb-24 pt-3 max-w-4xl mx-auto px-4 space-y-5 animate-in fade-in duration-200">
      {/* Student Profile Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#10233D] to-[#1E3E62] border border-amber-500/20 text-white shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-display font-extrabold text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              {user?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'ST'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-white">
                  {user?.fullName || 'Student User'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {user?.isDemo ? 'DEMO ACCOUNT' : 'ENROLLED'}
                </span>
              </div>
              <p className="text-xs text-amber-300/90 font-mono mt-0.5">
                Student No: {user?.studentNumber}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {/* Sakai does not expose program of study — say so honestly instead of blank. */}
                {user?.program || (
                  <span className="text-slate-500 italic">Program not provided by portal</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block text-[11px]">Faculty</span>
            <span className="font-medium">
              {user?.faculty || (
                <span className="text-slate-500 italic font-normal">Not provided by portal</span>
              )}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Campus Email</span>
            <span className="font-medium truncate block">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Persistent Authentication & Security */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-200">Security & Persistent Session</span>
          <span>Device Credentials</span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h4 className="font-display font-semibold text-xs text-white">
                  Persistent Login Enabled
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                You will stay signed in across browser sessions without recurring Sakai timeouts.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 font-mono">
              ACTIVE
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h4 className="font-display font-semibold text-xs text-white">
                  4-Digit Quick PIN Lock
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                {hasPIN
                  ? 'PIN lock is configured for instant biometric or numeric access.'
                  : 'Add a 4-digit PIN to secure your portal session when leaving your phone.'}
              </p>
            </div>

            <div>
              {hasPIN ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPinSetup(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-amber-300 font-medium hover:bg-slate-700 transition"
                  >
                    Change PIN
                  </button>
                  <button
                    onClick={handleRemovePin}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-xs text-rose-400 font-medium hover:bg-rose-500/10 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPinSetup(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                >
                  Set PIN
                </button>
              )}
            </div>
          </div>

          {/* Quick PIN Setup Drawer */}
          {showPinSetup && (
            <form onSubmit={handleSavePin} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h5 className="font-display font-semibold text-xs text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Configure 4-Digit Security PIN
              </h5>
              <div className="flex items-center gap-3">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-base tracking-widest font-mono text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={pinInput.length !== 4}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition disabled:opacity-50"
                >
                  {pinSavedSuccess ? 'Saved!' : 'Save PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinSetup(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Sakai Gateway & Network Routing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-200">University Portal Gateway</span>
          <span>Sakai REST API</span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Institutional Server</span>
            <span className="font-mono text-amber-400 font-medium">https://thuto.nul.ls/portal</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Gateway Mode</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPortalMode('live')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  portalMode === 'live'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Live Sakai
              </button>
              <button
                onClick={() => setPortalMode('demo')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  portalMode === 'demo'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Demo Gateway
              </button>
            </div>
          </div>

          {/* Live Ping & Network Diagnostics */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-400" /> Live Campus Connection Test
              </span>
              <button
                onClick={async () => {
                  setPinging(true);
                  try {
                    const res = await fetch('/api/sakai/status');
                    const data = await res.json();
                    setPingData(data);
                  } catch (e: any) {
                    setPingData({ success: false, error: e.message });
                  } finally {
                    setPinging(false);
                  }
                }}
                disabled={pinging}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium transition text-[11px] disabled:opacity-50"
              >
                {pinging ? 'Probing...' : 'Ping Thuto Server'}
              </button>
            </div>

            {pingData && (
              <div className="space-y-1 pt-1.5 border-t border-slate-800/60 font-mono text-[11px]">
                {pingData.success ? (
                  <>
                    <div className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected to NUL Server (HTTP {pingData.httpStatus})
                    </div>
                    <div className="text-slate-400">
                      IP: <span className="text-slate-200">{pingData.resolvedIp}</span> · Latency: <span className="text-amber-300">{pingData.latencyMs}ms</span>
                    </div>
                    <div className="text-slate-400 truncate">
                      Location: {pingData.campus}
                    </div>
                    {pingData.sessionId && (
                      <div className="text-slate-400">
                        Sakai Session: <span className="text-emerald-300">{pingData.sessionId}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-amber-400">
                    Host: thuto.nul.ls (IP 197.220.158.29). Note: Campus gateway is on a remote low-bandwidth link; offline cache is actively serving all study materials.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Offline Cache Volume</span>
            <span className="font-mono text-slate-200">
              {formatSize(storageUsage.totalBytes)} ({storageUsage.fileCount} items)
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Enrolled Courses</span>
            <button
              onClick={() => setShowSyncModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync My Courses
            </button>
          </div>
        </div>
      </div>

      {/* PWA & System Actions */}
      <div className="space-y-2.5">
        {isInstallable && (
          <button
            onClick={install}
            className="w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition"
          >
            <Smartphone className="w-5 h-5" /> Install Thuto Mobile on Android
          </button>
        )}

        <button
          onClick={logout}
          className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
        >
          <LogOut className="w-4 h-4" /> Sign Out of Thuto Session
        </button>
      </div>

      <SakaiSyncModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </div>
  );
};
