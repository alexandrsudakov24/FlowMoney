import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import {
    collection, getDocs, deleteDoc, doc
} from 'firebase/firestore';
import styles from '../styles/pages/AdminPage.module.css';

export const ADMIN_EMAIL = 'alexandrsudakov24@gmail.com';

interface UserRecord {
    id: string;
    name: string;
    email: string;
    language?: string;
    familyId?: string;
    createdAt?: number;
}

export default function AdminPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        getDocs(collection(db, 'users')).then((snap) => {
            const list: UserRecord[] = snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<UserRecord, 'id'>),
            }));
            setUsers(list);
        }).finally(() => setLoading(false));
    }, []);

    const handleDelete = async (target: UserRecord) => {
        if (!confirm(t('delete_user_confirm'))) return;
        setDeletingId(target.id);
        try {
            // Delete expenses subcollection
            const expSnap = await getDocs(collection(db, 'users', target.id, 'expenses'));
            await Promise.all(expSnap.docs.map((d) => deleteDoc(d.ref)));

            // Delete settings subcollection
            const setSnap = await getDocs(collection(db, 'users', target.id, 'settings'));
            await Promise.all(setSnap.docs.map((d) => deleteDoc(d.ref)));

            // Delete user doc
            await deleteDoc(doc(db, 'users', target.id));

            setUsers((prev) => prev.filter((u) => u.id !== target.id));
        } finally {
            setDeletingId(null);
        }
    };

    if (user?.email !== ADMIN_EMAIL) {
        return <div className={styles.denied}>403</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t('admin_panel')}</h1>
            <p className={styles.subtitle}>{t('all_users')}: <strong>{users.length}</strong></p>

            {loading ? (
                <div className={styles.loading}>...</div>
            ) : users.length === 0 ? (
                <p className={styles.empty}>{t('no_users')}</p>
            ) : (
                <ul className={styles.list}>
                    {users.map((u) => (
                        <li key={u.id} className={styles.item}>
                            <div className={styles.avatar}>
                                {(u.name || u.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.info}>
                                <span className={styles.name}>{u.name || '—'}</span>
                                <span className={styles.email}>{u.email || '—'}</span>
                                <span className={styles.uid}>{u.id}</span>
                                {u.familyId && (
                                    <span className={styles.tag}>family: {u.familyId.slice(0, 8)}…</span>
                                )}
                            </div>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(u)}
                                disabled={deletingId === u.id || u.email === ADMIN_EMAIL}
                                title={u.email === ADMIN_EMAIL ? 'Cannot delete admin' : t('delete_user')}
                            >
                                {deletingId === u.id ? '…' : t('delete_user')}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
