import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  loadState, saveState, getTodayDateStr,
  getTodayTarget, getTotalSaved, getInitialState
} from './state.js';
import { requestNotificationPermission, showLocalNotification } from './notifications.js';

// ─── Gear Icon SVG ───
const GearIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// ─── Onboarding Screen ───
function Onboarding({ state, onStart }) {
  const [budget, setBudget] = useState(state.budget);
  const [startDate, setStartDate] = useState(state.startDate || getTodayDateStr());
  const [endDate, setEndDate] = useState(state.endDate || '');
  const [dailyLimit, setDailyLimit] = useState(state.manualDailyTarget || 0);

  const handleStart = () => {
    if (!endDate) {
      alert('Please select a target voyage date.');
      return;
    }
    onStart({ budget, startDate, endDate, manualDailyTarget: dailyLimit });
  };

  const inputClass =
    'w-full bg-white/60 backdrop-blur-md border border-estateGreen/20 shadow-sm px-4 py-3 rounded-xl text-lg text-estateGreen outline-none focus:ring-2 ring-brass/50 transition-all font-sans';

  return (
    <div className="p-6 sm:p-8 animate-[fadeIn_0.5s_ease-out] w-full max-w-md mx-auto my-auto">
      <h1 className="text-3xl font-heading font-bold text-estateGreen text-center mb-2">
        Heritage Saver
      </h1>
      <p className="text-center text-charcoal/70 mb-10 text-sm tracking-wide uppercase">
        Establish Your Foundation
      </p>

      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-estateGreen uppercase tracking-wider">
            Total Budget (BDT)
          </label>
          <input
            type="number" value={budget}
            onChange={e => setBudget(parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-estateGreen uppercase tracking-wider">
            Start Date
          </label>
          <input
            type="date" value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-estateGreen uppercase tracking-wider">
            Target Voyage Date
          </label>
          <input
            type="date" value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-estateGreen uppercase tracking-wider">
            Daily Saving Limit (0 = Auto)
          </label>
          <input
            type="number" value={dailyLimit}
            onChange={e => setDailyLimit(parseInt(e.target.value) || 0)}
            className={inputClass}
            placeholder="Leave 0 for Auto"
          />
        </div>
      </div>

      <button
        onClick={handleStart}
        className="mt-10 w-full bg-estateGreen text-cream py-4 rounded-xl font-heading font-bold text-lg border border-estateGreen/80 hover:bg-estateGreen/90 active:scale-95 transition-all duration-300 shadow-[0_4px_20px_rgba(30,63,32,0.3)] relative overflow-hidden"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          Start Journey <span className="text-brass">⟡</span>
        </span>
      </button>
    </div>
  );
}

// ─── Progress Ring ───
function ProgressRing({ percentage }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex justify-center items-center py-6 relative">
      <svg fill="transparent" width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle stroke="rgba(30,63,32,0.08)" strokeWidth="8" cx="70" cy="70" r={radius} />
        <circle
          className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
          stroke="#C5A059" strokeWidth="8"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          cx="70" cy="70" r={radius}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-heading font-bold text-estateGreen">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

// ─── Stats Grid ───
function StatsGrid({ totalSaved, daysLeft, todayTarget, budget }) {
  const items = [
    { label: 'Accumulated', value: `৳${totalSaved}`, color: 'text-estateGreen' },
    { label: 'Days Remaining', value: daysLeft, color: 'text-estateGreen' },
    { label: 'Daily Expectation', value: `৳${todayTarget}`, color: 'text-brass' },
    { label: 'Endowment', value: `৳${budget}`, color: 'text-estateGreen' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-2">
      {items.map(item => (
        <div key={item.label} className="glass-card glass-card-sm flex flex-col items-center justify-center">
          <span className="text-[0.65rem] font-bold tracking-[0.1em] uppercase text-estateGreen/60 mb-1">
            {item.label}
          </span>
          <span className={`text-xl font-heading font-bold ${item.color}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── History Ledger ───
function HistoryLedger({ history }) {
  const entries = Object.entries(history).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);

  if (entries.length === 0) {
    return <p className="text-center text-sm text-charcoal/50 py-4 italic">No contributions recorded.</p>;
  }

  return entries.map(([date, amount]) => (
    <div key={date} className="flex justify-between items-center py-3 border-b border-charcoal/5 last:border-b-0 text-sm">
      <span className="text-charcoal/70 tracking-wide">{date}</span>
      <span className={`font-medium ${amount === 0 ? 'text-red-700/80' : 'text-estateGreen'}`}>
        {amount === 0 ? 'Passed' : `৳ ${amount}`}
      </span>
    </div>
  ));
}

// ─── Dashboard Screen ───
function Dashboard({ state, onSave, onMiss, onSettings }) {
  const [customAmount, setCustomAmount] = useState('');
  const todayStr = getTodayDateStr();
  const todayTarget = getTodayTarget(state);
  const totalSaved = getTotalSaved(state);
  const hasSavedToday = typeof state.savingsHistory[todayStr] !== 'undefined';

  let progressPercentage = Math.min(100, (totalSaved / state.budget) * 100);

  const end = new Date(state.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));

  const handleSave = () => {
    const amount = customAmount ? parseInt(customAmount) : todayTarget;
    if (amount < 1) {
      alert('Please enter a valid amount.');
      return;
    }
    onSave(amount, todayTarget, progressPercentage);
  };

  const handleMiss = () => {
    const ok = confirm(`Deferring adds ৳${todayTarget} to your accumulated deficit. Shall we proceed?`);
    if (ok) onMiss(todayTarget);
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] flex flex-col h-full">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-5 sticky top-0 z-20 backdrop-blur-xl bg-cream/70 border-b border-estateGreen/5 shadow-sm">
        <h2 className="font-heading font-bold text-xl text-estateGreen flex items-center gap-2">
          <span className="text-brass">⟡</span> Heritage
        </h2>
        <button onClick={onSettings} className="text-estateGreen/70 hover:text-estateGreen transition-colors">
          <GearIcon />
        </button>
      </header>

      <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
        <ProgressRing percentage={progressPercentage} />

        <StatsGrid totalSaved={totalSaved} daysLeft={daysLeft} todayTarget={todayTarget} budget={state.budget} />

        {/* Action Card */}
        <div className="glass-card text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          {hasSavedToday ? (
            <>
              <h2 className="text-xl font-heading font-bold text-estateGreen mb-2">Obligation Met</h2>
              <p className="text-sm text-charcoal/70">A prudent approach for today.</p>
            </>
          ) : (
            <>
              <h3 className="font-heading text-xl font-bold text-estateGreen mb-1">Process Contribution</h3>
              {state.penaltyAmount > 0 ? (
                <p className="text-xs font-semibold text-red-800/80 tracking-wide uppercase mb-4">
                  Includes ৳{state.penaltyAmount} Prior Deficit
                </p>
              ) : (
                <p className="text-sm text-estateGreen/60 mb-4">Record your savings.</p>
              )}

              <input
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder={`৳ ${todayTarget}`}
                className="w-full bg-white/50 backdrop-blur border border-estateGreen/10 px-4 py-3 rounded-xl text-center text-lg font-bold text-estateGreen outline-none mb-4 placeholder-estateGreen/30 focus:border-brass/60 focus:ring-2 focus:ring-brass/20 transition-all"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-estateGreen text-cream py-3 rounded-xl font-heading font-bold text-md shadow-md hover:bg-estateGreen/90 active:scale-95 transition-all"
                >
                  Deposit
                </button>
                <button
                  onClick={handleMiss}
                  className="flex-[0.4] bg-white text-charcoal/80 border border-charcoal/10 py-3 rounded-xl font-sans font-medium text-sm hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Defer
                </button>
              </div>
            </>
          )}
        </div>

        {/* History */}
        <div className="glass-card pb-2">
          <h3 className="font-heading text-lg font-bold text-estateGreen border-b border-estateGreen/10 pb-2 mb-2">
            Ledger
          </h3>
          <HistoryLedger history={state.savingsHistory} />
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function App() {
  const [state, setState] = useState(() => loadState());

  // Morning notification check (once per session)
  useEffect(() => {
    if (state.isConfigured && state.startDate) {
      const lastCheck = sessionStorage.getItem('morningChecked');
      const todayStr = getTodayDateStr();
      if (!lastCheck && typeof state.savingsHistory[todayStr] === 'undefined') {
        const target = getTodayTarget(state);
        showLocalNotification('Prudence Check', `Today's deposit stands at ${target} BDT.`);
        sessionStorage.setItem('morningChecked', 'true');
      }
    }
  }, []);

  const persist = (updated) => {
    saveState(updated);
    setState({ ...updated });
  };

  // ── Onboarding complete ──
  const handleStart = ({ budget, startDate, endDate, manualDailyTarget }) => {
    const updated = { ...state, budget, startDate, endDate, manualDailyTarget, isConfigured: true };
    persist(updated);

    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    requestNotificationPermission().then(() => {
      showLocalNotification('Journey Commenced', `Estate planned: ${budget} BDT in ${diff} days.`);
    });
  };

  // ── Save today ──
  const handleSave = (amount, todayTarget, prevProgress) => {
    const todayStr = getTodayDateStr();
    const updated = { ...state, savingsHistory: { ...state.savingsHistory, [todayStr]: amount } };

    if (amount >= todayTarget) {
      updated.penaltyAmount = 0;
    } else {
      updated.penaltyAmount = todayTarget - amount;
    }
    persist(updated);

    confetti({
      particleCount: 100, spread: 70, origin: { y: 0.6 },
      colors: ['#1E3F20', '#C5A059', '#F9F6F0'], ticks: 200, gravity: 0.8,
    });

    const newTotal = getTotalSaved(updated);
    const newProg = (newTotal / updated.budget) * 100;

    if (newProg >= 100 && prevProgress < 100) {
      showLocalNotification('Endowment Complete ⟡', `You reached your goal of ${updated.budget} BDT!`);
    } else if (newProg >= 50 && prevProgress < 50) {
      showLocalNotification('Half Measure Reached', 'You hit 50%. A solid progression.');
    } else {
      showLocalNotification('Ledger Updated', `Deposited ${amount} BDT today.`);
    }
  };

  // ── Miss today ──
  const handleMiss = (todayTarget) => {
    const todayStr = getTodayDateStr();
    const updated = {
      ...state,
      savingsHistory: { ...state.savingsHistory, [todayStr]: 0 },
      penaltyAmount: state.penaltyAmount + todayTarget,
    };
    persist(updated);
    showLocalNotification('Deferred', `A deficit of ${updated.penaltyAmount} is recorded.`);
  };

  // ── Back to settings ──
  const handleSettings = () => {
    persist({ ...state, isConfigured: false });
  };

  const isConfigured = state.isConfigured && state.startDate && state.endDate;

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen relative flex flex-col pb-8">
        {isConfigured ? (
          <Dashboard state={state} onSave={handleSave} onMiss={handleMiss} onSettings={handleSettings} />
        ) : (
          <Onboarding state={state} onStart={handleStart} />
        )}
      </div>
    </div>
  );
}
