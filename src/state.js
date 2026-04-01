export function getInitialState() {
  return {
    isConfigured: false,
    budget: 8000,
    startDate: getTodayDateStr(),
    endDate: '', // YYYY-MM-DD
    manualDailyTarget: 0, // 0 means auto-calculate
    savingsHistory: {}, // { 'YYYY-MM-DD': amountSaved }
    penaltyAmount: 0 // Accumulated missed amounts
  };
}

export function loadState() {
  const data = localStorage.getItem('tripSaverState');
  if (data) {
    return JSON.parse(data);
  }
  return getInitialState();
}

export function saveState(state) {
  localStorage.setItem('tripSaverState', JSON.stringify(state));
}

// Ensure the local date is formatted consistently
export function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate the base daily target without penalty
export function calculateBaseDailyTarget(state) {
  if (!state.isConfigured || !state.startDate || !state.endDate) return 0;
  
  if (state.manualDailyTarget && state.manualDailyTarget > 0) {
    return state.manualDailyTarget;
  }
  
  const savedTotal = Object.values(state.savingsHistory).reduce((sum, val) => sum + val, 0);
  const remainingBudget = Math.max(0, state.budget - savedTotal);
  
  // Calculate remaining days from today to end Date
  const end = new Date(state.endDate);
  const today = new Date();
  today.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  
  const remainingDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  
  // Prevent division by zero or negative days
  if (remainingDays <= 0) {
    return remainingBudget; 
  }

  // Subtract unpaid penalty from remaining budget so it's not double-counted in the spread
  const distributedBudget = Math.max(0, remainingBudget - state.penaltyAmount);

  // Purely distributed target among remaining days
  return Math.ceil(distributedBudget / remainingDays);
}

// Actual target for today = Base target + Any accumulated penalty from past missed days
export function getTodayTarget(state) {
  return calculateBaseDailyTarget(state) + state.penaltyAmount;
}

// Get the total saved amount
export function getTotalSaved(state) {
  return Object.values(state.savingsHistory).reduce((sum, val) => sum + val, 0);
}
