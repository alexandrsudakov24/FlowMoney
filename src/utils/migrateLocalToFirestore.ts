import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { Expense } from '../types';


export async function migrateLocalExpensesToFirestore(): Promise<number> {
  try {
    const raw = localStorage.getItem('expenses_data_v1');
    if (!raw) {
      console.log('migrate: no local expenses found (key expenses_data_v1)');
      return 0;
    }
    const items = JSON.parse(raw) as Expense[];
    if (!Array.isArray(items) || items.length === 0) {
      console.log('migrate: no items to migrate');
      return 0;
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('migrate: user not logged in — login before running migration');
    }

    const colRef = (uid: string) => collection(db, 'users', uid, 'expenses');

    type ExpenseWithoutId = Omit<Expense, 'id'>;
    let migrated = 0;
    // добавляем по очереди, чтобы избежать неожиданных ограничений
    for (const it of items) {
      const item = it as Expense;
      const { id } = item;
      void id; // используем переменную, чтобы избежать eslint-ошибки о неиспользуемой переменной
      const payload = (({ amount, category, date, note, type }: Expense) => ({ amount, category, date, note, type }))(item) as ExpenseWithoutId;
      await addDoc(colRef(user.uid), payload);
      migrated += 1;
    }

    console.log(`migrate: migrated ${migrated} items to users/${user.uid}/expenses`);
    return migrated;
  } catch (err) {
    console.error('migrate: failed', err);
    throw err;
  }
}

// expose globally in dev for convenience
declare global {
  interface Window {
    migrateLocalExpensesToFirestore?: () => Promise<number>;
  }
}

if (import.meta.env.DEV) {
  window.migrateLocalExpensesToFirestore = migrateLocalExpensesToFirestore;
}



