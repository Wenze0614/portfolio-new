// Phones and tablets get the joystick, drag-to-look and tap-to-interact.
// iPadOS reports itself as a Mac, so it's detected by its touch points instead.
export function isTouchDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /Mobi|Android|iPhone|iPad/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
