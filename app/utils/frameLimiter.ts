/**
 * Decides which display refreshes to render, to stay near `targetFps` on fast screens without
 * judder: it renders every Nth refresh, so frames stay evenly spaced (a fixed 60 Hz clock on a
 * 90 Hz screen would alternate 11 ms and 22 ms gaps).
 *
 *   60 Hz → every refresh (60)    90 Hz → every 2nd (45)     120 Hz → every 2nd (60)
 *   144 Hz → every 2nd (72)       165 Hz → every 3rd (55)    240 Hz → every 4th (60)
 *
 * The refresh interval is learned from the timestamps requestAnimationFrame passes in, so moving the
 * window to another screen adapts within about half a second.
 */
export function makeFrameLimiter(targetFps = 60) {
    const targetMs = 1000 / targetFps;
    let lastNow: number | null = null;
    let refreshMs = targetMs;  // smoothed display refresh interval
    let every = 1;             // render every Nth refresh
    let sinceRender = 0;
    let sinceRetune = 0;
    let lastRenderAt = -Infinity;
    // Never leave more than this between renders: if requestAnimationFrame itself slows down (a slow
    // GPU, a busy machine), render every callback rather than skip on a stale idea of the refresh rate.
    // Above every normal gap (22 ms at 90 Hz), so it doesn't disturb the even spacing.
    const maxGapMs = targetMs * 1.5;

    return function shouldRender(now: number): boolean {
        if (lastNow !== null) {
            const d = now - lastNow;
            if (d > 0 && d < 50) refreshMs += (d - refreshMs) * 0.1; // ignore pauses (tab hidden, hitches)
        }
        lastNow = now;

        // Retune N now and then, not every refresh, so noise can't flip it back and forth.
        // +0.55 instead of rounding (+0.5) keeps 90 Hz (ratio 1.5) and 144 Hz (2.4) clear of a boundary.
        if (++sinceRetune >= 30) {
            sinceRetune = 0;
            every = Math.max(1, Math.floor(targetMs / refreshMs + 0.55));
        }

        if (++sinceRender >= every || now - lastRenderAt >= maxGapMs) {
            sinceRender = 0;
            lastRenderAt = now;
            return true;
        }
        return false;
    };
}
