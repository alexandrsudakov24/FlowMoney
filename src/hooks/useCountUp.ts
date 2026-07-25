import { useEffect, useRef, useState } from 'react';

/**
 * Animates a displayed number from its previous value to `target` whenever
 * `target` changes, using an ease-out curve. Purely presentational — callers
 * should still use the raw `target` for any logic (e.g. conditional styling).
 *
 * Pass `startAt: 0` to always count up from zero on mount (e.g. a dashboard
 * that should "load in" its numbers every time it's shown), instead of the
 * default of seeding straight to `target` on first render.
 */
export function useCountUp(target: number, duration = 600, startAt: number = target): number {
    const [value, setValue] = useState(startAt);
    const valueRef = useRef(startAt);

    useEffect(() => {
        valueRef.current = value;
    });

    useEffect(() => {
        const from = valueRef.current;
        const delta = target - from;
        if (delta === 0) return;

        let rafId: number;
        let start: number | null = null;

        const tick = (now: number) => {
            if (start === null) start = now;
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(from + delta * eased);
            if (progress < 1) rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [target, duration]);

    return value;
}
