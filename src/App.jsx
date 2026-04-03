import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { backupToCloud, restoreFromCloud, mergeStates } from './backup.js';
import { SignInPage, ProfileBadge } from './auth.jsx';
import {
  loadState, saveState, getTodayDateStr,
  getTodayTarget, getTotalSaved, getInitialState
} from './state.js';
import { requestNotificationPermission, showLocalNotification } from './notifications.js';

/* ═══════════════════════════════════════════════
   ICONS (inline SVGs for zero dependencies)
   ═══════════════════════════════════════════════ */
const GearIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 hover:opacity-100 transition-opacity">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CheckCircle = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#checkGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

/* ═══════════════════════════════════════════════
   AURORA BACKGROUND
   ═══════════════════════════════════════════════ */
function AuroraBackground() {
  return (
    <div className="aurora-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ONBOARDING SCREEN
   ═══════════════════════════════════════════════ */
function Onboarding({ state, onStart }) {
  const [budget, setBudget] = useState(state.budget);
  const [startDate, setStartDate] = useState(state.startDate || getTodayDateStr());
  const [endDate, setEndDate] = useState(state.endDate || '');
  const [dailyLimit, setDailyLimit] = useState(state.manualDailyTarget || 0);

  const handleStart = () => {
    if (!endDate) { alert('Please select an end date.'); return; }
    onStart({ budget, startDate, endDate, manualDailyTarget: dailyLimit });
  };

  let previewDays = null;
  if (startDate && endDate) {
    const diff = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000);
    if (diff > 0) previewDays = diff;
  }

  return (
    <div className="animate-slide-up w-full px-5 py-10 flex flex-col justify-center min-h-screen relative z-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4 animate-float">💰</div>
        <h1 className="text-[28px] font-bold bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
          Budget Saver
        </h1>
        <p className="text-[15px] text-white/35 mt-2">
          Set your savings target below
        </p>
      </div>

      {/* Glass Form Card */}
      <div className="glass-liquid space-y-5">
        <Field label="Total Budget" suffix="BDT">
          <input type="number" value={budget} onChange={e => setBudget(parseInt(e.target.value) || 0)} className="input-ios text-right" />
        </Field>

        <Field label="Start Date">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-ios" />
        </Field>

        <Field label="End Date">
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-ios" />
        </Field>

        <Field label="Daily Limit" suffix="0 = Auto">
          <input type="number" value={dailyLimit} onChange={e => setDailyLimit(parseInt(e.target.value) || 0)} className="input-ios text-right" placeholder="0" />
        </Field>
      </div>

      {/* Preview Pill */}
      {previewDays && (
        <div className="flex justify-center mt-5 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
            <span className="text-violet-300 text-[13px] font-medium">
              ৳{Math.ceil(budget / previewDays)}/day × {previewDays} days
            </span>
          </div>
        </div>
      )}

      {/* Start Button */}
      <button onClick={handleStart} className="btn-primary mt-8">
        Begin Journey
      </button>
    </div>
  );
}

/* ── Form Field Wrapper ── */
function Field({ label, suffix, children }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-[13px] font-medium text-white/50 uppercase tracking-wider">{label}</label>
        {suffix && <span className="text-[11px] text-white/25 uppercase tracking-wider">{suffix}</span>}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROGRESS RING
   ═══════════════════════════════════════════════ */
function ProgressRing({ percentage }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const offset = c - (percentage / 100) * c;

  return (
    <div className="relative flex justify-center items-center py-4">
      {/* Multi-color glow behind ring */}
      <div className="absolute w-36 h-36 rounded-full animate-glow-pulse"
           style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(6,182,212,0.1) 40%, transparent 70%)' }} />

      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="none" cx="70" cy="70" r={r} />
        <circle
          stroke="url(#ringGradientAurora)" strokeWidth="6" fill="none"
          cx="70" cy="70" r={r}
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.4))' }}
        />
        <defs>
          <linearGradient id="ringGradientAurora" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute text-center">
        <div className="text-[34px] font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent tracking-tight">{Math.round(percentage)}%</div>
        <div className="text-[11px] text-white/30 uppercase tracking-widest mt-0.5">saved</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STATS GRID
   ═══════════════════════════════════════════════ */
function StatsGrid({ totalSaved, daysLeft, todayTarget, budget }) {
  const stats = [
    { label: 'Saved',     value: `৳${totalSaved}`,  color: 'text-emerald-400', glow: 'stat-glow-emerald' },
    { label: 'Days Left', value: daysLeft,           color: 'text-cyan-400',    glow: 'stat-glow-cyan' },
    { label: 'Today',     value: `৳${todayTarget}`,  color: 'text-amber-400',   glow: 'stat-glow-amber' },
    { label: 'Goal',      value: `৳${budget}`,       color: 'text-violet-300',  glow: 'stat-glow-violet' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <div key={s.label} className={`glass-liquid glass-sm text-center ${s.glow}`}
             style={{ animationDelay: `${i * 80}ms` }}>
          <div className="text-[11px] font-medium text-white/30 uppercase tracking-widest mb-1.5">{s.label}</div>
          <div className={`text-[22px] font-bold tracking-tight ${s.color}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HISTORY LEDGER
   ═══════════════════════════════════════════════ */
function HistoryLedger({ history }) {
  const entries = Object.entries(history).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);

  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-2xl mb-2 opacity-30">📒</div>
        <p className="text-[13px] text-white/20">No entries yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map(([date, amount]) => {
        const missed = amount === 0;
        const d = new Date(date);
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return (
          <div key={date} className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-b-0">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${missed ? 'bg-rose-500/60' : 'bg-emerald-400/60'}`} />
              <span className="text-[15px] text-white/40">{formatted}</span>
            </div>
            <span className={`text-[15px] font-semibold ${missed ? 'text-rose-400/70' : 'text-emerald-400'}`}>
              {missed ? 'Deferred' : `৳${amount}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════ */
function Dashboard({ state, user, lastSynced, onSave, onMiss, onSettings, onSignOut }) {
  const [customAmount, setCustomAmount] = useState('');
  const todayStr = getTodayDateStr();
  const todayTarget = getTodayTarget(state);
  const totalSaved = getTotalSaved(state);
  const hasSavedToday = typeof state.savingsHistory[todayStr] !== 'undefined';

  let progress = Math.min(100, (totalSaved / state.budget) * 100);

  const end = new Date(state.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.ceil((end - today) / 86400000));

  const handleSave = () => {
    const amt = customAmount ? parseInt(customAmount) : todayTarget;
    if (amt < 1) { alert('Enter a valid amount.'); return; }
    onSave(amt, todayTarget, progress);
  };

  const handleMiss = () => {
    if (confirm(`This adds ৳${todayTarget} penalty to tomorrow. Continue?`)) {
      onMiss(todayTarget);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col min-h-screen relative z-10">
      {/* ── Header Bar ── */}
      <header className="flex justify-between items-center px-5 py-4 sticky top-0 z-30"
              style={{ background: 'rgba(5,5,16,0.7)', backdropFilter: 'blur(30px) saturate(180%)', WebkitBackdropFilter: 'blur(30px) saturate(180%)' }}>
        <h2 className="text-[20px] font-bold tracking-tight flex items-center gap-2">
          <span>💰</span>
          <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            Budget Saver
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <ProfileBadge user={user} lastSynced={lastSynced} onSignOut={onSignOut} />
          <button onClick={onSettings} className="text-white p-1">
            <GearIcon />
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto pb-10">
        {/* Sync status */}
        {user && lastSynced && (
          <div className="flex justify-center">
            <div className="sync-pill">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Backed up
            </div>
          </div>
        )}

        {/* Progress Ring */}
        <ProgressRing percentage={progress} />

        {/* Stats */}
        <StatsGrid totalSaved={totalSaved} daysLeft={daysLeft} todayTarget={todayTarget} budget={state.budget} />

        {/* ── Action Card ── */}
        <div className="glass-liquid">
          {hasSavedToday ? (
            <div className="text-center py-4">
              <CheckCircle />
              <h3 className="text-[20px] font-bold text-emerald-400 mt-4 mb-1">All Done Today</h3>
              <p className="text-[14px] text-white/35">You've hit your target. Rest easy.</p>
            </div>
          ) : (
            <>
              <h3 className="text-[17px] font-bold text-white mb-1">Log Savings</h3>
              {state.penaltyAmount > 0 ? (
                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-rose-500/8 border border-rose-500/15">
                  <span className="text-rose-400 text-[13px] font-medium">
                    ⚠️ ৳{state.penaltyAmount} penalty included
                  </span>
                </div>
              ) : (
                <p className="text-[14px] text-white/25 mb-4">How much did you save today?</p>
              )}

              <input
                type="number" value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder={`৳ ${todayTarget}`}
                className="input-ios text-center text-[22px] font-bold mb-4"
              />

              <div className="flex gap-3">
                <button onClick={handleSave} className="btn-primary flex-1">
                  Save
                </button>
                <button onClick={handleMiss} className="btn-secondary flex-[0.45]">
                  Skip
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── History ── */}
        <div className="glass-liquid">
          <h3 className="text-[17px] font-bold text-white mb-3 flex items-center gap-2">
            <span className="opacity-40">📒</span> History
          </h3>
          <HistoryLedger history={state.savingsHistory} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SETTINGS SCREEN
   ═══════════════════════════════════════════════ */
function Settings({ state, onSave, onBack, onReset }) {
  const [budget, setBudget] = useState(state.budget);
  const [endDate, setEndDate] = useState(state.endDate);
  const [dailyLimit, setDailyLimit] = useState(state.manualDailyTarget || 0);

  const handleSave = () => {
    onSave({ budget, endDate, manualDailyTarget: dailyLimit });
  };

  return (
    <div className="animate-slide-up w-full px-5 py-6 flex flex-col min-h-screen relative z-10 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <button onClick={onBack} className="p-2.5 -ml-2 text-white/70 hover:text-white rounded-full bg-white/5 backdrop-blur-md shadow-sm transition-all hover:bg-white/10 active:scale-95">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h2 className="text-[24px] font-bold text-white tracking-tight">Preferences</h2>
      </div>

      <div className="space-y-8 flex-1">
        {/* Journey Configuration */}
        <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <h3 className="text-[12px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3 ml-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50"></span> Journey Configuration
          </h3>
          <div className="glass-liquid space-y-5 p-5">
            <Field label="Total Goal" suffix="BDT">
              <input type="number" value={budget} onChange={e => setBudget(parseInt(e.target.value) || 0)} className="input-ios text-right text-white font-semibold" />
            </Field>

            <div className="h-[1px] bg-white/5 -mx-5" />

            <Field label="Target End Date">
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-ios text-white text-right" />
            </Field>

            <div className="h-[1px] bg-white/5 -mx-5" />

            <Field label="Daily Limit" suffix="0 = Dynamic">
              <input type="number" value={dailyLimit} onChange={e => setDailyLimit(parseInt(e.target.value) || 0)} className="input-ios text-right text-white font-semibold" placeholder="0" />
            </Field>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h3 className="text-[12px] font-bold text-rose-400/50 uppercase tracking-[0.15em] mb-3 ml-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50"></span> Danger Zone
          </h3>
          <div className="glass-liquid p-2" style={{ borderColor: 'rgba(244, 63, 94, 0.2)', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05), rgba(0,0,0,0))' }}>
            <button onClick={() => { if(confirm('Are you absolutely sure? This will wipe all current progress!')) onReset() }} className="w-full py-3.5 text-rose-400 font-bold tracking-wide rounded-xl hover:bg-rose-500/10 transition-colors">
              Reset Entire Tracker
            </button>
          </div>
        </div>
      </div>

      <div className="pt-8 w-full pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <button onClick={handleSave} className="btn-primary w-full shadow-[0_0_20px_rgba(139,92,246,0.2)] !py-3.5 text-[16px]">
          Save Preferences
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
export default function App() {
  const [state, setState] = useState(() => loadState());
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [showSettingsView, setShowSettingsView] = useState(false);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);

      if (firebaseUser) {
        // Restore from cloud on sign-in
        try {
          const cloudState = await restoreFromCloud(firebaseUser.uid);
          if (cloudState) {
            const currentLocal = loadState();
            const merged = mergeStates(currentLocal, cloudState);
            saveState(merged);
            setState({ ...merged });
            setLastSynced(Date.now());
          }
        } catch (err) {
          console.warn('Cloud restore error:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Morning notification
  useEffect(() => {
    if (state.isConfigured && state.startDate) {
      const lastCheck = sessionStorage.getItem('morningChecked');
      const todayStr = getTodayDateStr();
      if (!lastCheck && typeof state.savingsHistory[todayStr] === 'undefined') {
        const target = getTodayTarget(state);
        showLocalNotification('Good Morning ☀️', `Save ৳${target} today to stay on track.`);
        sessionStorage.setItem('morningChecked', 'true');
      }
    }
  }, []);

  // Show sign-in on first visit if not authenticated
  useEffect(() => {
    if (authChecked && !user) {
      const skipSignIn = localStorage.getItem('skipSignIn');
      if (!skipSignIn) {
        setShowSignIn(true);
      }
    }
  }, [authChecked, user]);

  const persist = useCallback(async (updated) => {
    saveState(updated);
    setState({ ...updated });

    // Background cloud backup
    if (user) {
      const success = await backupToCloud(user.uid, updated);
      if (success) setLastSynced(Date.now());
    }
  }, [user]);

  const handleStart = ({ budget, startDate, endDate, manualDailyTarget }) => {
    const updated = { ...state, budget, startDate, endDate, manualDailyTarget, isConfigured: true };
    persist(updated);
    const diff = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000);
    requestNotificationPermission().then(() => {
      showLocalNotification('Journey Started 🚀', `৳${budget} in ${diff} days. Let's go!`);
    });
  };

  const handleSave = (amount, todayTarget, prevProgress) => {
    const todayStr = getTodayDateStr();
    const updated = {
      ...state,
      savingsHistory: { ...state.savingsHistory, [todayStr]: amount },
      penaltyAmount: amount >= todayTarget ? 0 : todayTarget - amount,
    };
    persist(updated);

    confetti({
      particleCount: 80, spread: 60, origin: { y: 0.7 },
      colors: ['#8B5CF6', '#06B6D4', '#34D399', '#ffffff'],
      ticks: 150, gravity: 1.2, scalar: 0.9,
    });

    const newProg = (getTotalSaved(updated) / updated.budget) * 100;
    if (newProg >= 100 && prevProgress < 100) {
      showLocalNotification('Goal Complete! 🎉', `You hit ৳${updated.budget}. Amazing!`);
    } else if (newProg >= 50 && prevProgress < 50) {
      showLocalNotification('Halfway! 💪', 'You\'re 50% there. Keep pushing.');
    } else {
      showLocalNotification('Saved ✅', `৳${amount} logged. Nice one.`);
    }
  };

  const handleMiss = (todayTarget) => {
    const todayStr = getTodayDateStr();
    const updated = {
      ...state,
      savingsHistory: { ...state.savingsHistory, [todayStr]: 0 },
      penaltyAmount: state.penaltyAmount + todayTarget,
    };
    persist(updated);
    showLocalNotification('Skipped', `৳${updated.penaltyAmount} penalty rolls to tomorrow.`);
  };

  const handleSettings = () => setShowSettingsView(true);

  const handleSaveSettings = ({ budget, endDate, manualDailyTarget }) => {
    const updated = { ...state, budget, endDate, manualDailyTarget };
    persist(updated);
    setShowSettingsView(false);
    showLocalNotification('Settings Saved ⚙️', 'Your tracker has been updated.');
  };

  const handleReset = () => {
    const fresh = getInitialState();
    persist(fresh);
    setShowSettingsView(false);
  };

  const handleSignedIn = (firebaseUser) => {
    setUser(firebaseUser);
    setShowSignIn(false);
  };

  const handleSkipSignIn = () => {
    localStorage.setItem('skipSignIn', 'true');
    setShowSignIn(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setLastSynced(null);
    localStorage.removeItem('skipSignIn');
  };

  // Loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-aurora-900 flex items-center justify-center">
        <AuroraBackground />
        <div className="relative z-10 text-center animate-fade-in">
          <div className="text-5xl mb-4 animate-float">💰</div>
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const isReady = state.isConfigured && state.startDate && state.endDate;

  return (
    <div className="min-h-screen bg-aurora-900 text-white font-sans flex justify-center">
      <AuroraBackground />
      <div className="w-full max-w-[430px] min-h-screen relative">
        {showSignIn ? (
          <SignInPage onSkip={handleSkipSignIn} onSignedIn={handleSignedIn} />
        ) : showSettingsView ? (
          <Settings 
             state={state} 
             onSave={handleSaveSettings} 
             onBack={() => setShowSettingsView(false)} 
             onReset={handleReset} 
          />
        ) : isReady ? (
          <Dashboard
            state={state}
            user={user}
            lastSynced={lastSynced}
            onSave={handleSave}
            onMiss={handleMiss}
            onSettings={handleSettings}
            onSignOut={handleSignOut}
          />
        ) : (
          <Onboarding state={state} onStart={handleStart} />
        )}
      </div>
    </div>
  );
}
