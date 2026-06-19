import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from '../components/ExpenseForm';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'en',
        t: (key: string) => key,
    }),
}));

vi.mock('../context/AppContext', async () => {
    const { INCOME_CATEGORIES } = await import('../context/AppContext');
    return {
        useApp: () => ({
            currency: 'USD',
            expenses: [],
            categories: ['Food', 'Transport', 'Home', 'Shopping', 'Health', 'Other'],
        }),
        INCOME_CATEGORIES,
    };
});

vi.mock('../utils/currencySymbols', () => ({
    currencySymbols: { USD: '$', EUR: '€', ILS: '₪' },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const renderForm = (props: Partial<Parameters<typeof ExpenseForm>[0]> = {}) => {
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} {...props} />);
    return { onSubmit };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ExpenseForm', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders with expense type selected by default', () => {
        renderForm();
        const expenseBtn = screen.getByRole('button', { name: 'expense' });
        expect(expenseBtn).toHaveClass('active');
    });

    it('switches to income type on click', async () => {
        renderForm();
        await userEvent.click(screen.getByRole('button', { name: 'income' }));
        expect(screen.getByRole('button', { name: 'income' })).toHaveClass('active');
    });

    it('shows income categories after switching to income', async () => {
        renderForm();
        await userEvent.click(screen.getByRole('button', { name: 'income' }));
        // getCatLabel returns the raw cat name when t() returns the key unchanged
        expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Food' })).not.toBeInTheDocument();
    });

    it('shows validation error when amount is empty', async () => {
        renderForm();
        fireEvent.submit(screen.getByRole('button', { name: 'save' }).closest('form')!);
        await waitFor(() => {
            expect(screen.getByText('amount_required')).toBeInTheDocument();
        });
    });

    it('shows validation error when amount is zero', async () => {
        renderForm();
        await userEvent.type(screen.getByRole('spinbutton'), '0');
        fireEvent.submit(screen.getByRole('button', { name: 'save' }).closest('form')!);
        await waitFor(() => {
            expect(screen.getByText('amount_required')).toBeInTheDocument();
        });
    });

    it('calls onSubmit with correct data for a valid expense', async () => {
        const { onSubmit } = renderForm();
        await userEvent.type(screen.getByRole('spinbutton'), '42.50');
        await userEvent.click(screen.getByRole('button', { name: 'save' }));
        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledOnce();
            const arg = onSubmit.mock.calls[0][0];
            expect(Number(arg.amount)).toBeCloseTo(42.5);
            expect(arg.type).toBe('expense');
        });
    });

    it('calls onSubmit with income type after switching', async () => {
        const { onSubmit } = renderForm();
        await userEvent.click(screen.getByRole('button', { name: 'income' }));
        await userEvent.type(screen.getByRole('spinbutton'), '1000');
        await userEvent.click(screen.getByRole('button', { name: 'save' }));
        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledOnce();
            expect(onSubmit.mock.calls[0][0].type).toBe('income');
        });
    });

    it('pre-fills defaultValues when editing', () => {
        renderForm({
            defaultValues: {
                amount: '99',
                category: 'Transport',
                date: '2025-01-15',
                note: 'bus',
                type: 'expense',
            },
        });
        expect(screen.getByRole('spinbutton')).toHaveValue(99);
        expect(screen.getByRole('textbox')).toHaveValue('bus');
    });
});
