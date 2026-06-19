import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// ── Helpers ──────────────────────────────────────────────────────────────────

const Bomb = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) throw new Error('Test render error');
    return <div>OK</div>;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
    // Suppress React's console.error output for expected errors
    beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
    afterEach(() => vi.restoreAllMocks());

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <Bomb shouldThrow={false} />
            </ErrorBoundary>
        );
        expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('renders fallback UI when a child throws', () => {
        render(
            <ErrorBoundary>
                <Bomb shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Reload page')).toBeInTheDocument();
    });

    it('displays the error message in the detail block', () => {
        render(
            <ErrorBoundary>
                <Bomb shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText('Test render error')).toBeInTheDocument();
    });

    it('calls window.location.reload when reload button is clicked', () => {
        const reload = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { reload },
            writable: true,
        });

        render(
            <ErrorBoundary>
                <Bomb shouldThrow={true} />
            </ErrorBoundary>
        );
        fireEvent.click(screen.getByText('Reload page'));
        expect(reload).toHaveBeenCalledOnce();
    });

    it('resets when resetKey changes', () => {
        const { rerender } = render(
            <ErrorBoundary resetKey="page-a">
                <Bomb shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        rerender(
            <ErrorBoundary resetKey="page-b">
                <Bomb shouldThrow={false} />
            </ErrorBoundary>
        );
        expect(screen.getByText('OK')).toBeInTheDocument();
    });
});
