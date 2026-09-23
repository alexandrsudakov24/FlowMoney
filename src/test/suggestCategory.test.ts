import { describe, it, expect } from 'vitest';
import { buildCategoryIndex, suggestCategory } from '../utils/suggestCategory';
import type { Expense } from '../types';

const EXPENSE_CATS = ['Food', 'Transport', 'Entertainment', 'Other'];

let idCounter = 0;
function expense(overrides: Partial<Expense>): Expense {
    idCounter += 1;
    return {
        id: `e-${idCounter}`,
        amount: 10,
        category: 'Food',
        date: '2026-03-01',
        type: 'expense',
        ...overrides,
    };
}

function suggest(history: Expense[], note: string, type: Expense['type'] = 'expense', allowed = EXPENSE_CATS) {
    return suggestCategory(buildCategoryIndex(history), note, type, allowed);
}

describe('suggestCategory', () => {
    it('remembers the category an identical note was filed under', () => {
        const history = [expense({ note: 'Пятёрочка', category: 'Food' })];
        expect(suggest(history, 'Пятёрочка')).toBe('Food');
    });

    it('ignores case, ё/е and punctuation', () => {
        const history = [expense({ note: 'Пятёрочка', category: 'Food' })];
        expect(suggest(history, '  пятерочка! ')).toBe('Food');
    });

    it('matches a word inside a longer note, including other word endings', () => {
        const history = [expense({ note: 'Пятёрочка', category: 'Food' })];
        expect(suggest(history, 'продукты в Пятёрочке')).toBe('Food');
    });

    it('prefers the category used most often for the note', () => {
        const history = [
            expense({ note: 'Яндекс Такси', category: 'Transport' }),
            expense({ note: 'Яндекс Такси', category: 'Transport' }),
            expense({ note: 'Яндекс Такси', category: 'Other' }),
        ];
        expect(suggest(history, 'Яндекс Такси')).toBe('Transport');
    });

    it('gives no answer when a word is split evenly between categories', () => {
        const history = [
            expense({ note: 'купил хлеб', category: 'Food' }),
            expense({ note: 'купил билет', category: 'Entertainment' }),
        ];
        expect(suggest(history, 'купил')).toBeNull();
    });

    it('returns null for unknown notes, empty notes and short filler words', () => {
        const history = [expense({ note: 'кофе в Starbucks', category: 'Food' })];
        expect(suggest(history, 'Аптека')).toBeNull();
        expect(suggest(history, '')).toBeNull();
        expect(suggest(history, 'в')).toBeNull();
    });

    it('keeps expense and income histories apart', () => {
        const history = [expense({ note: 'Зарплата', category: 'Salary', type: 'income' })];
        expect(suggest(history, 'Зарплата', 'expense')).toBeNull();
        expect(suggest(history, 'Зарплата', 'income', ['Salary', 'Gift'])).toBe('Salary');
    });

    it('skips categories that no longer exist', () => {
        const history = [expense({ note: 'Пятёрочка', category: 'Deleted' })];
        expect(suggest(history, 'Пятёрочка')).toBeNull();
    });
});
