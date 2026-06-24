import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
    initializeFirestore,
    getFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app only once (guard for HMR)
const isNew = !getApps().length;
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];

// Enable offline persistence via IndexedDB (multi-tab).
// initializeFirestore must be called before the first getFirestore call — only on initial app creation.
if (isNew) {
    initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
        }),
    });
}

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
