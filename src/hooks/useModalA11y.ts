import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared accessibility behavior for modal dialogs: closes on Escape, locks
 * background scroll, traps Tab focus inside the modal, and moves focus into
 * it on open (returning focus to the trigger on close). Attach the returned
 * ref to the modal's outermost dialog element.
 */
export function useModalA11y(isOpen: boolean, onClose: () => void) {
    const ref = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<Element | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        triggerRef.current = document.activeElement;
        document.body.style.overflow = 'hidden';

        const node = ref.current;
        const focusable = node?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        (focusable?.[0] ?? node)?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !node) return;
            const items = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
        };
    }, [isOpen, onClose]);

    return ref;
}
