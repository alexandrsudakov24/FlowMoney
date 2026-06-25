import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockRegister = vi.fn();
const mockLoginWithGoogle = vi.fn();
const mockNavigate = vi.fn();
const mockChangeCurrency = vi.fn();
const mockSetLanguage = vi.fn();
const mockSetTheme = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await import('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ register: mockRegister, loginWithGoogle: mockLoginWithGoogle }),
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'en',
        setLanguage: mockSetLanguage,
        t: (key: string) => key,
    }),
}));

vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ setTheme: mockSetTheme }),
}));

vi.mock('../context/AppContext', () => ({
    useApp: () => ({ changeCurrency: mockChangeCurrency }),
}));

vi.mock('../constants/currency', () => ({
    currencySymbols: { USD: '$', EUR: '€', ILS: '₪' },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const renderPage = () => {
    const result = render(
        <MemoryRouter>
            <RegisterPage />
        </MemoryRouter>
    );
    const q = (sel: string) => result.container.querySelector(sel) as HTMLInputElement;
    return { ...result, q };
};

const fillForm = async (
    q: (sel: string) => HTMLInputElement,
    password = 'validPass123'
) => {
    // inputs have no for/id association — query by type/position
    const inputs = document.querySelectorAll('input');
    await userEvent.type(inputs[0], 'Alice');        // name
    await userEvent.type(inputs[1], 'alice@test.com'); // email
    await userEvent.type(q('input[type="password"]'), password);
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RegisterPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders name, email, password inputs', () => {
        const { q } = renderPage();
        expect(q('input[type="email"]')).toBeInTheDocument();
        expect(q('input[type="password"]')).toBeInTheDocument();
        // first input is the name field (no type attr)
        expect(document.querySelectorAll('input')[0]).toBeInTheDocument();
    });

    it('shows error_weak_password when password is shorter than 6 chars', async () => {
        const { q } = renderPage();
        await fillForm(q, 'abc');
        await userEvent.click(screen.getByRole('button', { name: 'create_account' }));
        await waitFor(() => {
            expect(screen.getByText('error_weak_password')).toBeInTheDocument();
        });
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('calls register with correct data on valid submit', async () => {
        mockRegister.mockResolvedValue(undefined);
        const { q } = renderPage();
        await fillForm(q);
        await userEvent.click(screen.getByRole('button', { name: 'create_account' }));
        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                name: 'Alice',
                email: 'alice@test.com',
                password: 'validPass123',
                language: 'en',
            });
        });
    });

    it('navigates to / after successful registration', async () => {
        mockRegister.mockResolvedValue(undefined);
        const { q } = renderPage();
        await fillForm(q);
        await userEvent.click(screen.getByRole('button', { name: 'create_account' }));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    });

    it('shows error_email_in_use when Firebase returns that code', async () => {
        mockRegister.mockRejectedValue({ code: 'auth/email-already-in-use' });
        const { q } = renderPage();
        await fillForm(q);
        await userEvent.click(screen.getByRole('button', { name: 'create_account' }));
        await waitFor(() => {
            expect(screen.getByText('error_email_in_use')).toBeInTheDocument();
        });
    });

    it('calls changeCurrency and setLanguage before registering', async () => {
        mockRegister.mockResolvedValue(undefined);
        const { q } = renderPage();
        await fillForm(q);
        await userEvent.click(screen.getByRole('button', { name: 'create_account' }));
        await waitFor(() => expect(mockRegister).toHaveBeenCalled());
        expect(mockChangeCurrency).toHaveBeenCalled();
        expect(mockSetLanguage).toHaveBeenCalled();
    });
});
