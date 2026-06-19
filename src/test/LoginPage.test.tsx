import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockLogin = vi.fn();
const mockLoginWithGoogle = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await import('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ login: mockLogin, loginWithGoogle: mockLoginWithGoogle }),
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (key: string) => key }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const renderPage = () => {
    const result = render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>
    );
    const emailInput = () => result.container.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = () => result.container.querySelector('input[type="password"]') as HTMLInputElement;
    return { ...result, emailInput, passwordInput };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders email and password inputs', () => {
        const { emailInput, passwordInput } = renderPage();
        expect(emailInput()).toBeInTheDocument();
        expect(passwordInput()).toBeInTheDocument();
    });

    it('calls login with entered credentials on submit', async () => {
        mockLogin.mockResolvedValue(undefined);
        const { emailInput, passwordInput } = renderPage();
        await userEvent.type(emailInput(), 'user@test.com');
        await userEvent.type(passwordInput(), 'secret123');
        await userEvent.click(screen.getByRole('button', { name: 'login' }));
        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({ email: 'user@test.com', password: 'secret123' });
        });
    });

    it('navigates to / on successful login', async () => {
        mockLogin.mockResolvedValue(undefined);
        const { emailInput, passwordInput } = renderPage();
        await userEvent.type(emailInput(), 'user@test.com');
        await userEvent.type(passwordInput(), 'pass');
        await userEvent.click(screen.getByRole('button', { name: 'login' }));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    });

    it('shows error key when login fails', async () => {
        mockLogin.mockRejectedValue({ code: 'auth/invalid-credential' });
        const { emailInput, passwordInput } = renderPage();
        await userEvent.type(emailInput(), 'bad@test.com');
        await userEvent.type(passwordInput(), 'wrong');
        await userEvent.click(screen.getByRole('button', { name: 'login' }));
        await waitFor(() => {
            expect(screen.getByText('error_invalid_credential')).toBeInTheDocument();
        });
    });

    it('calls loginWithGoogle and navigates on Google login', async () => {
        mockLoginWithGoogle.mockResolvedValue(undefined);
        renderPage();
        await userEvent.click(screen.getByRole('button', { name: /google/i }));
        await waitFor(() => {
            expect(mockLoginWithGoogle).toHaveBeenCalledOnce();
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows error when Google login fails', async () => {
        mockLoginWithGoogle.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
        renderPage();
        await userEvent.click(screen.getByRole('button', { name: /google/i }));
        await waitFor(() => {
            expect(screen.getByText('error_popup_closed')).toBeInTheDocument();
        });
    });
});
