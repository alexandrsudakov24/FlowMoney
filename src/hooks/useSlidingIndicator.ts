import { useLayoutEffect, useRef, useState } from 'react';

interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * Measures the DOM position of the active item within a group (a toggle,
 * a tab bar, ...) so a single pill element can be animated to it with a
 * CSS transform, instead of each item owning its own highlight. Works
 * under RTL for free since getBoundingClientRect is viewport-relative.
 */
export function useSlidingIndicator<C extends HTMLElement = HTMLDivElement, I extends HTMLElement = HTMLButtonElement>(
    activeIndex: number,
    extraDeps: unknown[] = []
) {
    const containerRef = useRef<C>(null);
    const itemRefs = useRef<(I | null)[]>([]);
    const [rect, setRect] = useState<Rect | null>(null);

    useLayoutEffect(() => {
        const recompute = () => {
            const container = containerRef.current;
            const item = itemRefs.current[activeIndex];
            if (!container || !item) {
                setRect(null);
                return;
            }
            const containerRect = container.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();
            setRect({
                left: itemRect.left - containerRect.left,
                top: itemRect.top - containerRect.top,
                width: itemRect.width,
                height: itemRect.height,
            });
        };
        recompute();
        window.addEventListener('resize', recompute);
        return () => window.removeEventListener('resize', recompute);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, ...extraDeps]);

    return { containerRef, itemRefs, rect };
}
