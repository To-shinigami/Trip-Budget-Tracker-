import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

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

  // Calculate preview days
  let previewDays = null;
  if (startDate && endDate) {
    const diff = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000);
    if (diff > 0) previewDays = diff;
  }

  return (
    <div className="animate-slide-up w-full px-5 py-10 flex flex-col justify-center min-h-screen">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">✈️</div>
        <h1 className="text-[28px] font-bold text-white tracking-tight">
          Trip Saver
        </h1>
        <p className="text-[15px] text-white/40 mt-2">
          Set your savings target below
        </p>
      </div>

      {/* Glass Form Card */}
      <div className="glass space-y-5">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ios-blue/10 border border-ios-blue/20">
            <span className="text-ios-blue text-[13px] font-medium">
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
        {suffix && <span className="text-[11px] text-white/30 uppercase tracking-wider">{suffix}</span>}
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
      {/* Glow behind ring */}
      <div className="absolute w-32 h-32 rounded-full animate-pulse-soft"
           style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.15) 0%, transparent 70%)' }} />

      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="none" cx="70" cy="70" r={r} />
        <circle
          stroke="url(#ringGradient)" strokeWidth="6" fill="none"
          cx="70" cy="70" r={r}
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0A84FF" />
            <stop offset="100%" stopColor="#64D2FF" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute text-center">
        <div className="text-[34px] font-bold text-white tracking-tight">{Math.round(percentage)}%</div>
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
    { label: 'Saved',  value: `৳${totalSaved}`,  color: 'text-ios-green' },
    { label: 'Days Left', value: daysLeft, color: 'text-ios-teal' },
    { label: 'Today',  value: `৳${todayTarget}`, color: 'text-ios-orange' },
    { label: 'Goal',   value: `৳${budget}`,      color: 'text-white' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <div key={s.label} className="glass glass-sm text-center"
             style={{ animationDelay: `${i * 80}ms` }}>
          <div className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-1.5">{s.label}</div>
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
        <p className="text-[13px] text-white/25">No entries yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map(([date, amount]) => {
        const missed = amount === 0;
        // Format date nicely
        const d = new Date(date);
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return (
          <div key={date} className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-b-0">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${missed ? 'bg-ios-red/60' : 'bg-ios-green/60'}`} />
              <span className="text-[15px] text-white/50">{formatted}</span>
            </div>
            <span className={`text-[15px] font-semibold ${missed ? 'text-ios-red/70' : 'text-ios-green'}`}>
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
function Dashboard({ state, onSave, onMiss, onSettings }) {
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
    <div className="animate-fade-in flex flex-col min-h-screen">
      {/* ── Header Bar ── */}
      <header className="flex justify-between items-center px-5 py-4 sticky top-0 z-30"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(30px) saturate(180%)', WebkitBackdropFilter: 'blur(30px) saturate(180%)' }}>
        <h2 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
          ✈️ Trip Saver
        </h2>
        <button onClick={onSettings} className="text-white p-1">
          <GearIcon />
        </button>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto pb-10">
        {/* Progress Ring */}
        <ProgressRing percentage={progress} />

        {/* Stats */}
        <StatsGrid totalSaved={totalSaved} daysLeft={daysLeft} todayTarget={todayTarget} budget={state.budget} />

        {/* ── Action Card ── */}
        <div className="glass">
          {hasSavedToday ? (
            <div className="text-center py-4">
              <CheckCircle />
              <h3 className="text-[20px] font-bold text-ios-green mt-4 mb-1">All Done Today</h3>
              <p className="text-[14px] text-white/40">You've hit your target. Rest easy.</p>
            </div>
          ) : (
            <>
              <h3 className="text-[17px] font-bold text-white mb-1">Log Savings</h3>
              {state.penaltyAmount > 0 ? (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-ios-red/10 border border-ios-red/15">
                  <span className="text-ios-red text-[13px] font-medium">
                    ⚠️ ৳{state.penaltyAmount} penalty included
                  </span>
                </div>
              ) : (
                <p className="text-[14px] text-white/30 mb-4">How much did you save today?</p>
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
        <div className="glass">
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
   MAIN APP
   ═══════════════════════════════════════════════ */
export default function App() {
  const [state, setState] = useState(() => loadState());

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

  const persist = (updated) => {
    saveState(updated);
    setState({ ...updated });
  };

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
      colors: ['#0A84FF', '#30D158', '#64D2FF', '#ffffff'],
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

  const handleSettings = () => persist({ ...state, isConfigured: false });

  const isReady = state.isConfigured && state.startDate && state.endDate;

  return (
    <div className="min-h-screen bg-black text-white font-sans flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen relative">
        {isReady ? (
          <Dashboard state={state} onSave={handleSave} onMiss={handleMiss} onSettings={handleSettings} />
        ) : (
          <Onboarding state={state} onStart={handleStart} />
        )}
      </div>
    </div>
  );
}
