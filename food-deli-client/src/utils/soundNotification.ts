/**
 * Web Audio API synthesized Chime & Audio notification utility for Thunder Food Delivery
 * Generates instant, crystal-clear order chime ("Ding-Dong") without any external MP3 file dependency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Browser autoplay policy might restrict until user interaction
    });
  }
  return audioCtx;
}

const SOUND_STORAGE_KEY = 'thunder_merchant_sound_enabled';

export const soundManager = {
  isEnabled(): boolean {
    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  },

  setEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    } catch {
      // ignore
    }
  },

  /**
   * Synthesize a two-tone kitchen bell / chime (GrabFood / ShopeeFood style)
   * Note 1: 880Hz (A5), Note 2: 1320Hz (E6) harmonic bell chime
   */
  playOrderChime(): boolean {
    if (!this.isEnabled()) return false;

    try {
      const ctx = getAudioContext();
      if (!ctx) return false;

      const now = ctx.currentTime;

      // --- Chime Tone 1 (High bell chime) ---
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // Ramp to C6

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.4, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.6);

      // --- Chime Tone 2 (Resonant bell strike after 140ms) ---
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.5, now + 0.15); // E6

      gain2.gain.setValueAtTime(0.001, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.5, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.15);
      osc2.stop(now + 1.0);

      // --- Chime Tone 3 (Warm sub-harmonic for fullness) ---
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(523.25, now + 0.15); // C5 harmonic

      gain3.gain.setValueAtTime(0.001, now + 0.15);
      gain3.gain.linearRampToValueAtTime(0.25, now + 0.19);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc3.start(now + 0.15);
      osc3.stop(now + 0.9);

      return true;
    } catch (err) {
      console.warn('Cannot play synthesized order chime:', err);
      return false;
    }
  },

  /**
   * Test chime, unmuting temporarily if user explicitly requested test
   */
  testChime(): boolean {
    const prev = this.isEnabled();
    this.setEnabled(true);
    const played = this.playOrderChime();
    if (!prev) {
      setTimeout(() => this.setEnabled(false), 1200);
    }
    return played;
  },
};
