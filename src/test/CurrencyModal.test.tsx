import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CurrencyModal from '../components/CurrencyModal';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockChangeCurrency = vi.fn();

vi.mock('../context/AppContext', () => ({
    useApp: () => ({
        currency: 'USD',
        changeCurrency: mockChangeCurrency,
    }),
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (key: string) => key }),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CurrencyModal', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders nothing when isOpen is false', () => {
        render(<CurrencyModal isOpen={false} onClose={vi.fn()} />);
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('renders modal with currency select when open', () => {
        render(<CurrencyModal isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows exactly USD, EUR, ILS options', () => {
        render(<CurrencyModal isOpen={true} onClose={vi.fn()} />);
        const options = screen.getAllByRole('option').map((o) => o.textContent);
        expect(options).toEqual(['USD', 'EUR', 'ILS']);
    });

    it('select reflects current currency', () => {
        render(<CurrencyModal isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByRole('combobox')).toHaveValue('USD');
    });

    it('calls changeCurrency when a new option is selected', async () => {
        render(<CurrencyModal isOpen={true} onClose={vi.fn()} />);
        await userEvent.selectOptions(screen.getByRole('combobox'), 'EUR');
        expect(mockChangeCurrency).toHaveBeenCalledWith('EUR');
    });

    it('calls onClose when close button is clicked', async () => {
        const onClose = vi.fn();
        render(<CurrencyModal isOpen={true} onClose={onClose} />);
        await userEvent.click(screen.getByRole('button', { name: '✕' }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when overlay is clicked', async () => {
        const onClose = vi.fn();
        const { container } = render(<CurrencyModal isOpen={true} onClose={onClose} />);
        // First child of fragment is the overlay div
        const overlay = container.firstElementChild as HTMLElement;
        await userEvent.click(overlay);
        expect(onClose).toHaveBeenCalledOnce();
    });
});
