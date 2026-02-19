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

            // Much Louder Volume (Gain 3.5)
            gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
            gainNode.gain.linearRampToValueAtTime(3.5, ctx.currentTime + start + 0.02); // Boosted to 3.5
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

            oscillator.start(ctx.currentTime + start);
            oscillator.stop(ctx.currentTime + start + duration + 0.05);
        });

        // Close context after sound finishes to free resources
        setTimeout(() => ctx.close(), 1000);
    } catch (e) {
        console.warn("Could not play notification sound:", e);
    }
}

/**
 * Plays a louder "success" sound for order placement.
 * Uses a cheerful major chord arpeggio.
 */
export function playOrderPlacedSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Major chord arpeggio (C6, E6, G6, C7)
        const notes = [
            { freq: 1046.50, start: 0, duration: 0.15 }, // C6
            { freq: 1318.51, start: 0.15, duration: 0.15 }, // E6
            { freq: 1567.98, start: 0.30, duration: 0.15 }, // G6
            { freq: 2093.00, start: 0.45, duration: 0.4 }, // C7
        ];

        notes.forEach(({ freq, start, duration }) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = "triangle"; // Triangle wave for a clearer, game-like sound
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + start);

            // High Volume (Gain 3.0)
            gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
            gainNode.gain.linearRampToValueAtTime(3.0, ctx.currentTime + start + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

            oscillator.start(ctx.currentTime + start);
            oscillator.stop(ctx.currentTime + start + duration + 0.1);
        });

        setTimeout(() => ctx.close(), 2000);
    } catch (e) {
        console.warn("Could not play success sound:", e);
    }
}
