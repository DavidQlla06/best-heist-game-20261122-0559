// Tiny WebAudio blips, generated in code: no audio files. The context is created on
// the first user gesture (browsers require one) and every sound is a short oscillator
// envelope. Mute with M.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) context = new Ctor();
    }
    if (context && context.state === 'suspended') context.resume();
    return context;
  }

  function tone(freq, seconds, type, gain, slideTo) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + seconds);
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyM') muted = !muted;
    ensure();
  });
  window.addEventListener('pointerdown', ensure);

  return {
    loot() { tone(880, 0.12, 'triangle', 0.12, 1320); },
    vault() { tone(523, 0.14, 'triangle', 0.14); setTimeout(() => tone(784, 0.18, 'triangle', 0.14), 110); },
    spotted() { tone(220, 0.16, 'square', 0.06, 180); },
    caught() { tone(320, 0.5, 'sawtooth', 0.12, 80); },
    escaped() { tone(659, 0.15, 'triangle', 0.13); setTimeout(() => tone(988, 0.25, 'triangle', 0.13), 130); },
    step() { tone(140, 0.05, 'sine', 0.03); },
  };
}
