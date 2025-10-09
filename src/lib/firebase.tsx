// firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Fixed casing
};

// Initialize app only in the browser to avoid build-time initialization
const app = typeof window !== 'undefined'
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : (null as unknown as ReturnType<typeof initializeApp>);

// Exports
// Avoid initializing Firebase Auth on the server during build to prevent
// auth/invalid-api-key errors when env is not available at build time.
export const db = typeof window !== 'undefined' ? getFirestore(app) : (null as unknown as ReturnType<typeof getFirestore>);
export const auth = typeof window !== 'undefined' ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
export const storage = typeof window !== 'undefined' ? getStorage(app) : (null as unknown as ReturnType<typeof getStorage>);

// Optional: export analytics if supported
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}