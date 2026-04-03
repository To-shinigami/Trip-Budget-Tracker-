import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase.js';
import { LogoIcon } from './Logo.jsx';

/* ═══════════════════════════════════════════════
   SIGN-IN PAGE
   ═══════════════════════════════════════════════ */
export function SignInPage({ onSkip, onSignedIn }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onSignedIn(result.user);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError('Sign-in failed. Try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up w-full px-5 flex flex-col justify-center items-center min-h-screen relative">
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Logo */}
      <div className="relative z-10 text-center mb-12">
        <LogoIcon className="w-24 h-24 mx-auto mb-5 animate-float drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]" />
        <h1 className="text-[32px] font-bold bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
          Budget Saver
        </h1>
        <p className="text-[15px] text-white/35 mt-3 max-w-[260px] mx-auto leading-relaxed">
          Sign in to back up your savings across all your devices
        </p>
      </div>

      {/* Glass card */}
      <div className="glass-liquid w-full max-w-[360px] relative z-10 p-6 space-y-4">
        {/* Cloud backup visual */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-2xl">☁️</span>
            <div className="text-left">
              <div className="text-[13px] font-semibold text-white/70">Cloud Backup</div>
              <div className="text-[11px] text-white/30">Sync data across devices</div>
            </div>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white text-gray-800 font-semibold text-[16px] hover:bg-gray-100 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 shadow-lg shadow-white/10"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {/* Error */}
        {error && (
          <p className="text-center text-[13px] text-red-400/80 animate-fade-in">{error}</p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[11px] text-white/20 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="w-full py-3.5 rounded-2xl text-[15px] font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200 active:scale-[0.97]"
        >
          Continue without backup →
        </button>
      </div>

      {/* Footer note */}
      <p className="relative z-10 text-[11px] text-white/15 mt-8 text-center max-w-[280px]">
        Your data stays on your device unless you sign in. We only store your savings data.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROFILE BADGE (header)
   ═══════════════════════════════════════════════ */
export function ProfileBadge({ user, lastSynced, onSignOut }) {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const timeAgo = lastSynced ? getTimeAgo(lastSynced) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/[0.06] transition-colors"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full ring-2 ring-violet-500/30" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-[12px] font-bold text-white">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 glass-liquid rounded-xl p-3 z-50 animate-fade-in shadow-2xl">
            <div className="px-2 pb-3 border-b border-white/[0.06] mb-2">
              <p className="text-[13px] font-medium text-white/80 truncate">{user.displayName || 'User'}</p>
              <p className="text-[11px] text-white/30 truncate">{user.email}</p>
              {timeAgo && (
                <p className="text-[10px] text-emerald-400/60 mt-1 flex items-center gap-1">
                  <span>☁️</span> Synced {timeAgo}
                </p>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="w-full text-left px-2 py-2 rounded-lg text-[13px] text-red-400/70 hover:bg-red-400/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
