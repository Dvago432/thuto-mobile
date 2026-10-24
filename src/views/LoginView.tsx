import React, { useState } from 'react';
import { LogIn, Sparkles, ShieldCheck, ExternalLink, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [studentId, setStudentId] = useState('202304918');
  const [password, setPassword] = useState('••••••••••••');
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;
    setLoading(true);
    await login(studentId, password, false, staySignedIn);
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    await login('202304918', '', true, true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 md:p-8 text-white">
      <div className="w-full max-w-md mx-auto my-auto space-y-6 animate-in fade-in duration-300">
        {/* Brand Lockup */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/40 via-amber-400/30 to-amber-600/40 rounded-full blur-lg" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-b from-[#10233D] via-[#0B192C] to-[#020617] p-2 ring-2 ring-amber-500/70 shadow-2xl shadow-amber-500/25 flex items-center justify-center overflow-hidden border border-amber-400/40">
              <img
                src="/src/assets/images/nul_crest_original_themed.png"
                alt="National University of Lesotho Crest"
                className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase flex items-center justify-center gap-1">
              <GraduationCap className="w-4 h-4" /> National University of Lesotho
            </span>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight mt-1">
              Thuto Mobile Gateway
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Touch-optimized student mobile portal with offline materials caching &amp; deadline push alerts
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Student ID / Username
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 202304918"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Portal Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>

            {/* Stay signed in toggle */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={(e) => setStaySignedIn(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Stay signed in on this device</span>
              </label>
              <span className="text-[11px] text-amber-400/80 font-medium">
                No relogging
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Authenticating with Sakai...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In with University Credentials
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-medium">
              or instant demo
            </span>
          </div>

          {/* Quick Demo Access Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-amber-300 font-display font-bold text-xs transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Explore as Demo Student (Pre-Loaded Courses)
          </button>
        </div>

        {/* Footer Links & Institutional Info */}
        <div className="text-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted local session · Offline caching enabled</span>
          </div>
          <div>
            <a
              href="https://thuto.nul.ls/portal"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-amber-400 transition inline-flex items-center gap-1 text-[11px]"
            >
              Visit Official NUL Thuto Web Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
