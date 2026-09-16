import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import type { Expense, User, BudgetTipsDoc } from '../types';
import type { Language } from '../i18n';
import { saveBudgetTips } from '../services/budgetTips';
import { generateBudgetTips, GeminiRequestError } from '../services/gemini';
import { buildBudgetTipsStats, computeBudgetStatsFingerprint } from '../utils/budgetTipsStats';
import { canRegenerateBudgetTips } from '../utils/budgetTipsCooldown';

type BudgetTipsStore = {
    // --- state ---
    doc: BudgetTipsDoc | null;
    loading: boolean;
    generating: boolean;

    // --- actions (called from components) ---
    regenerate: (expenses: Expense[], categoryLimits: Record<string, number>, language: Language) => Promise<void>;

    // --- internal setup (called once from AppProvider when ref changes) ---
    _subscribe: (
        ref: DocumentReference | null,
        user: User | null,
        showToast: (msg: string) => void,
    ) => () => void;
};

export const useBudgetTipsStore = create<BudgetTipsStore>((set, get) => {
    let _ref: DocumentReference | null = null;
    let _user: User | null = null;
    let _showToast: (msg: string) => void = () => {};

    return {
        doc: null,
        loading: false,
        generating: false,

        _subscribe: (ref, user, showToast) => {
            _ref = ref;
            _user = user;
            _showToast = showToast;

            if (!ref) {
                set({ doc: null, loading: false });
                return () => {};
            }

            set({ loading: true });
            const unsub = onSnapshot(ref, (snap) => {
                set({
                    doc: snap.exists() ? (snap.data() as BudgetTipsDoc) : null,
                    loading: false,
                });
            });

            return unsub;
        },

        // Manual regeneration, gated by a 7-day cooldown — advice is meant to
        // be weekly, not chased on every visit. Failure leaves the previous
        // tips in place rather than clearing the panel.
        regenerate: async (expenses, categoryLimits, language) => {
            if (!_ref) return;
            if (!canRegenerateBudgetTips(get().doc?.generatedAt ?? null)) return;
            if (Object.keys(categoryLimits).length === 0) return;

            set({ generating: true });
            try {
                const stats = buildBudgetTipsStats(expenses, categoryLimits);
                const tips = await generateBudgetTips(stats, language);
                await saveBudgetTips(_ref, {
                    tips,
                    generatedAt: Date.now(),
                    statsFingerprint: computeBudgetStatsFingerprint(stats),
                    language,
                    ...(_user ? { generatedBy: _user.id } : {}),
                });
            } catch (err) {
                console.error('Failed to generate budget tips', err);
                const code = err instanceof GeminiRequestError ? err.code : 'network_error';
                _showToast(`budget_tips_error_${code}`);
            } finally {
                set({ generating: false });
            }
        },
    };
});
