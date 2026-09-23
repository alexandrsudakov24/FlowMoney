import type { Expense } from '../types';

// Learns "note → category" from the user's own history, so a note like
// "Пятёрочка" picks the category it was filed under before — no AI call.

type Tally = Map<string, number>; // category → number of transactions

export interface CategoryIndex {
    notes: Record<Expense['type'], Map<string, Tally>>; // whole normalized note
    stems: Record<Expense['type'], Map<string, Tally>>; // individual word stems
}

// Stems shorter than this are prepositions and the like ("в", "на", "для")
const MIN_WORD_LENGTH = 4;
// Crude stemming: "Пятёрочка" and "Пятёрочке" share their first letters
const STEM_LENGTH = 5;
// A stem split evenly between two categories scores 0.5 — too ambiguous to guess
const MIN_SCORE = 0.6;
const EXACT_NOTE_WEIGHT = 2;

export function normalizeNote(note: string): string {
    return note
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

function noteStems(normalized: string): string[] {
    const stems = normalized
        .split(' ')
        .filter((w) => w.length >= MIN_WORD_LENGTH && !/^\d+$/.test(w))
        .map((w) => w.slice(0, STEM_LENGTH));
    return [...new Set(stems)];
}

function bump(map: Map<string, Tally>, key: string, category: string) {
    let tally = map.get(key);
    if (!tally) map.set(key, (tally = new Map()));
    tally.set(category, (tally.get(category) ?? 0) + 1);
}

export function buildCategoryIndex(expenses: Expense[]): CategoryIndex {
    const index: CategoryIndex = {
        notes: { expense: new Map(), income: new Map() },
        stems: { expense: new Map(), income: new Map() },
    };
    for (const e of expenses) {
        const normalized = normalizeNote(e.note ?? '');
        if (!normalized || !e.category) continue;
        bump(index.notes[e.type], normalized, e.category);
        for (const stem of noteStems(normalized)) bump(index.stems[e.type], stem, e.category);
    }
    return index;
}

// Adds each category's share of the tally, so a word used for one category
// only counts fully, while a generic word ("купил") spread across many barely counts.
function addShares(scores: Map<string, number>, tally: Tally | undefined, weight: number) {
    if (!tally) return;
    let total = 0;
    tally.forEach((n) => { total += n; });
    tally.forEach((n, category) => {
        scores.set(category, (scores.get(category) ?? 0) + (weight * n) / total);
    });
}

/** The category this note was usually filed under, or null when history has no confident answer. */
export function suggestCategory(
    index: CategoryIndex,
    note: string,
    type: Expense['type'],
    allowedCategories: string[],
): string | null {
    const normalized = normalizeNote(note);
    if (!normalized) return null;

    const scores = new Map<string, number>();
    addShares(scores, index.notes[type].get(normalized), EXACT_NOTE_WEIGHT);
    for (const stem of noteStems(normalized)) addShares(scores, index.stems[type].get(stem), 1);

    let best: string | null = null;
    let bestScore = 0;
    scores.forEach((score, category) => {
        if (score >= MIN_SCORE && score > bestScore && allowedCategories.includes(category)) {
            best = category;
            bestScore = score;
        }
    });
    return best;
}
