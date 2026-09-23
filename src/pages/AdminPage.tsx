import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchUsersPage, deleteUserData, type UsersCursor } from '../services/admin';
import { fetchFeedback, deleteFeedback } from '../services/feedback';
import { ConfirmModal, Spinner } from '../components/ui';
import type { AdminUserRecord, Feedback } from '../types';
import styles from './AdminPage.module.css';

const PAGE_SIZE = 20;

export default function AdminPage() {
    const { user, role } = useAuth();
    const { t } = useLanguage();
    const [users, setUsers] = useState<AdminUserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<UsersCursor | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const [tab, setTab] = useState<'users' | 'feedback'>('users');
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [feedbackLoading, setFeedbackLoading] = useState(true);
    const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
    const [confirmDeleteFeedbackId, setConfirmDeleteFeedbackId] = useState<string | null>(null);

    const fetchPage = useCallback(async (after: UsersCursor | null = null) => {
        const page = await fetchUsersPage(PAGE_SIZE, after);
        setUsers((prev) => after ? [...prev, ...page.users] : page.users);
        setLastDoc(page.cursor);
        setHasMore(page.hasMore);
    }, []);

    useEffect(() => {
        fetchPage().finally(() => setLoading(false));
    }, [fetchPage]);

    useEffect(() => {
        fetchFeedback()
            .then(setFeedback)
            .finally(() => setFeedbackLoading(false));
    }, []);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        await fetchPage(lastDoc).finally(() => setLoadingMore(false));
    };

    const handleDelete = async (target: AdminUserRecord) => {
        setDeletingId(target.id);
        setConfirmDeleteId(null);
        try {
            await deleteUserData(target.id);
            setUsers((prev) => prev.filter((u) => u.id !== target.id));
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteFeedback = async (id: string) => {
        setDeletingFeedbackId(id);
        setConfirmDeleteFeedbackId(null);
        try {
            await deleteFeedback(id);
            setFeedback((prev) => prev.filter((f) => f.id !== id));
        } finally {
            setDeletingFeedbackId(null);
        }
    };

    if (role !== 'admin') {
        return <div className={styles.denied}>403</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t('admin_panel')}</h1>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tabBtn} ${tab === 'users' ? styles.tabActive : ''}`}
                    onClick={() => setTab('users')}
                >
                    {t('all_users')}
                </button>
                <button
                    className={`${styles.tabBtn} ${tab === 'feedback' ? styles.tabActive : ''}`}
                    onClick={() => setTab('feedback')}
                >
                    {t('feedback')}
                </button>
            </div>

            {tab === 'users' && (
                <>
                    <p className={styles.subtitle}>{t('all_users')}: <strong>{users.length}</strong></p>

                    {loading ? (
                        <Spinner size="sm" />
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
                                        onClick={() => setConfirmDeleteId(u.id)}
                                        disabled={deletingId === u.id || u.id === user?.id}
                                        title={u.id === user?.id ? 'Cannot delete admin' : t('delete_user')}
                                    >
                                        {deletingId === u.id ? '…' : t('delete_user')}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {hasMore && (
                        <button
                            className={styles.loadMoreBtn}
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? '…' : t('load_more')}
                        </button>
                    )}
                </>
            )}

            {tab === 'feedback' && (
                <>
                    <p className={styles.subtitle}>{t('feedback')}: <strong>{feedback.length}</strong></p>

                    {feedbackLoading ? (
                        <Spinner size="sm" />
                    ) : feedback.length === 0 ? (
                        <p className={styles.empty}>{t('no_feedback')}</p>
                    ) : (
                        <ul className={styles.list}>
                            {feedback.map((f) => (
                                <li key={f.id} className={styles.item}>
                                    <div className={styles.info}>
                                        <span className={styles.name}>{f.name || f.email || f.userId}</span>
                                        {f.email && <span className={styles.email}>{f.email}</span>}
                                        <p className={styles.feedbackMessage}>{f.message}</p>
                                        {f.createdAt && (
                                            <span className={styles.uid}>{new Date(f.createdAt).toLocaleString()}</span>
                                        )}
                                    </div>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => setConfirmDeleteFeedbackId(f.id)}
                                        disabled={deletingFeedbackId === f.id}
                                    >
                                        {deletingFeedbackId === f.id ? '…' : t('delete')}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => {
                    const target = users.find(u => u.id === confirmDeleteId);
                    if (target) handleDelete(target);
                }}
                title={t('delete_user')}
                message={t('delete_user_confirm')}
                confirmLabel={t('delete_user')}
                variant="danger"
                loading={!!deletingId}
            />

            <ConfirmModal
                isOpen={!!confirmDeleteFeedbackId}
                onClose={() => setConfirmDeleteFeedbackId(null)}
                onConfirm={() => {
                    if (confirmDeleteFeedbackId) handleDeleteFeedback(confirmDeleteFeedbackId);
                }}
                title={t('delete')}
                message={t('delete_feedback_confirm')}
                confirmLabel={t('delete')}
                variant="danger"
                loading={!!deletingFeedbackId}
            />
        </div>
    );
}
