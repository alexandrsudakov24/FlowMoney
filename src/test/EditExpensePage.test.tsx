import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditExpensePage from '../pages/EditExpensePage';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUpdateExpense = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await import('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('../context/AppContext', () => ({
    useApp: () => ({
        expenses: [
            { id: 'exp-1', amount: 50, category: 'Food', date: '2025-06-01', note: 'lunch', type: 'expense' },
        ],
        updateExpense: mockUpdateExpense,
        currency: 'USD',
        categories: ['Food', 'Transport', 'Home', 'Shopping', 'Health', 'Other'],
    }),
    INCOME_CATEGORIES: ['Salary', 'Freelance', 'Dividends', 'Gift', 'Other'],
}));

vi.mock('../utils/currencySymbols', () => ({
    currencySymbols: { USD: '$', EUR: '€', ILS: '₪' },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const renderAt = (expenseId: string) =>
    render(
        <MemoryRouter initialEntries={[`/edit/${expenseId}`]}>
            <Routes>
                <Route path="/edit/:id" element={<EditExpensePage />} />
            </Routes>
        </MemoryRouter>
    );

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EditExpensePage', () => {
    it('shows "not found" message for unknown id', () => {
        renderAt('non-existent');
        expect(screen.getByText('expense_not_found')).toBeInTheDocument();
    });

    it('shows a back link when expense is not found', () => {
        renderAt('non-existent');
        const link = screen.getByRole('link', { name: 'go_back' });
        expect(link).toHaveAttribute('href', '/');
    });

    it('renders the expense form when expense exists', () => {
        renderAt('exp-1');
        // The form's save button should be present
        expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument();
    });

    it('pre-fills the amount from the found expense', () => {
        renderAt('exp-1');
        expect(screen.getByRole('spinbutton')).toHaveValue(50);
    });
});
