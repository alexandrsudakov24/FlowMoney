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

// Инициализируем Firebase только один раз
const isNew = !getApps().length;
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];

// Offline persistence через IndexedDB (multi-tab).
// initializeFirestore должен вызываться до первого getFirestore — только при первом запуске.
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
