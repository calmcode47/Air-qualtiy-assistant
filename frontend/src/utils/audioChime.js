// Simple, soothing Web Audio acoustic breathing chime (174 Hz / 285 Hz)
let audioCtx = null;
let chimeInterval = null;

export function toggleAcousticChime(isActive) {
  if (!isActive) {
    if (chimeInterval) clearInterval(chimeInterval);
    chimeInterval = null;
    return;
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const playChime = () => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;

      // Primary warm resonant sine wave
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 1.2); // C4

      // Gentle breath-like envelope (4-second cycle)
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 1.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 4.0);
    };

    playChime();
    chimeInterval = setInterval(playChime, 4500);
  } catch (e) {
    console.warn('Web Audio not allowed or supported', e);
  }
}
