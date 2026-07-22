import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import type { Expense, User, InsightsDoc } from '../types';
import type { Language } from '../i18n';
import { saveInsights } from '../services/insights';
import { generateInsights, GeminiRequestError } from '../services/gemini';
import { buildInsightsStats, computeStatsFingerprint } from '../utils/insightsStats';
import { canRegenerateInsights } from '../utils/insightsCooldown';

type InsightsStore = {
    // --- state ---
    doc: InsightsDoc | null;
    loading: boolean;
    generating: boolean;

    // --- actions (called from components) ---
    regenerate: (expenses: Expense[], language: Language) => Promise<void>;

    // --- internal setup (called once from AppProvider when ref changes) ---
    _subscribe: (
        ref: DocumentReference | null,
        user: User | null,
        showToast: (msg: string) => void,
    ) => () => void;
};

export const useInsightsStore = create<InsightsStore>((set, get) => {
    // Plain variables — not reactive, updated on every _subscribe call
    let _ref: DocumentReference | null = null;
    let _user: User | null = null;
    let _showToast: (msg: string) => void = () => {};

    return {
        doc: null,
        loading: false,
        generating: false,

        // Called from AppProvider whenever the Firestore document ref changes.
        // Listens in real time — every family member sees the same cached
        // insights and cooldown timer through this one document.
        _subscribe: (ref, user, showToast) => {
            _ref = ref;
            _user = user;
            _showToast = showToast;

            // No ref means the user is logged out — clear any stale doc
            if (!ref) {
                set({ doc: null, loading: false });
                return () => {};
            }

            set({ loading: true });
            const unsub = onSnapshot(ref, (snap) => {
                set({
                    doc: snap.exists() ? (snap.data() as InsightsDoc) : null,
                    loading: false,
                });
            });

            return unsub;
        },

        // Manual regeneration, gated by the 24h cooldown (v1 doesn't compare
        // statsFingerprint — that's a best-effort auto-refresh for later).
        // On failure the previously cached insights are left in place so the
        // UI never goes blank because of a transient API error.
        regenerate: async (expenses, language) => {
            if (!_ref) return;
            if (!canRegenerateInsights(get().doc?.generatedAt ?? null)) return;

            set({ generating: true });
            try {
                const stats = buildInsightsStats(expenses);
                const insights = await generateInsights(stats, language);
                await saveInsights(_ref, {
                    insights,
                    generatedAt: Date.now(),
                    statsFingerprint: computeStatsFingerprint(stats),
                    language,
                    ...(_user ? { generatedBy: _user.id } : {}),
                });
            } catch (err) {
                console.error('Failed to generate insights', err);
                const code = err instanceof GeminiRequestError ? err.code : 'network_error';
                _showToast(`insights_error_${code}`);
            } finally {
                set({ generating: false });
            }
        },
    };
});
