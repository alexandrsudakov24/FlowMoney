import { useEffect, type RefObject } from 'react';

// Closes an open popover/card when the user clicks or taps outside `ref`.
// `enabled` should track the open state so the listener is only attached
// while something is actually open.
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    onOutside: () => void,
    enabled: boolean
) {
    useEffect(() => {
        if (!enabled) return;
        const handler = (e: MouseEvent | TouchEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onOutside();
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [ref, onOutside, enabled]);
}
