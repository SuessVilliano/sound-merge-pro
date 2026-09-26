
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

/**
 * PRODUCTION FIREBASE INITIALIZATION
 * SoundMerge Project Node: soundmerge-77880
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDJpetLrw16a7osby9SM2PEXOgSorGdD5Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "soundmerge-77880.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "soundmerge-77880",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "soundmerge-77880.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "947975987408",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:947975987408:web:9b625af817849184a2fed5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZK3KYTLRCB"
};

const app = initializeApp(firebaseConfig);

let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("[Firebase] Analytics disabled (likely ad-blocker).");
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
