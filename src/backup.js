import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Backup state to Firestore under the user's UID
 */
export async function backupToCloud(userId, state) {
  if (!userId) return false;
  try {
    const ref = doc(db, 'users', userId);
    await setDoc(ref, {
      state: JSON.stringify(state),
      updatedAt: Date.now(),
      version: 2
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Backup failed:', err.message);
    return false;
  }
}

/**
 * Restore state from Firestore
 */
export async function restoreFromCloud(userId) {
  if (!userId) return null;
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return JSON.parse(data.state);
    }
    return null;
  } catch (err) {
    console.warn('Restore failed:', err.message);
    return null;
  }
}

/**
 * Merge local and cloud states — cloud wins if it has more history entries
 */
export function mergeStates(localState, cloudState) {
  if (!cloudState) return localState;
  if (!localState || !localState.isConfigured) return cloudState;

  const localEntries = Object.keys(localState.savingsHistory || {}).length;
  const cloudEntries = Object.keys(cloudState.savingsHistory || {}).length;

  // Cloud wins if it has same or more data
  if (cloudEntries >= localEntries) return cloudState;
  return localState;
}
