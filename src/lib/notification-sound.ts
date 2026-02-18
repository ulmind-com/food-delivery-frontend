/**
 * Plays a pleasant "new order" notification sound using the Web Audio API.
 * No external audio files required.
 */
export function playNewOrderSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // A short two-tone "ding-dong" chime
        const notes = [
            { freq: 880, start: 0, duration: 0.18 },   // A5
            { freq: 1174.66, start: 0.2, duration: 0.22 }, // D6
        ];

        notes.forEach(({ freq, start, duration }) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + start);

            // Smooth attack + decay envelope
            gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
            gainNode.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

            oscillator.start(ctx.currentTime + start);
            oscillator.stop(ctx.currentTime + start + duration + 0.05);
        });

        // Close context after sound finishes to free resources
        setTimeout(() => ctx.close(), 1000);
    } catch (e) {
        // Silently fail if audio context is not available
        console.warn("Could not play notification sound:", e);
    }
}
