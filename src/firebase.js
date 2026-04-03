import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ═══════════════════════════════════════════════
// 🔥 FIREBASE CONFIG — Budget Saver App
// ═══════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyA2UUmERaIFlExktH-Hpyi1m5oNmmoJbCc",
  authDomain: "budget-saver-app-2026.firebaseapp.com",
  projectId: "budget-saver-app-2026",
  storageBucket: "budget-saver-app-2026.firebasestorage.app",
  messagingSenderId: "955001632818",
  appId: "1:955001632818:web:fc358e3ff4871b25e8a42b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
