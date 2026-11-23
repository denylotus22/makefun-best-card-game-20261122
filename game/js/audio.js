// audio.js — tiny synthesised sound effects for Runehold.
// No audio files: every sound is an oscillator envelope made with the
// Web Audio API, so the game stays fully offline and file-light.

let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
  return muted;
}
export function isMuted() {
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Play one tone: frequency in Hz, length in seconds, wave shape, volume.
function tone(freq, dur, type = "sine", vol = 0.12, when = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  // Short click when a card is picked up.
  select() { tone(660, 0.07, "triangle", 0.08); },
  // A played card: a bright two-note snap.
  play() { tone(520, 0.09, "triangle", 0.12); tone(780, 0.12, "triangle", 0.10, 0.06); },
  // Damage landing: low thud.
  hit() { tone(140, 0.18, "sawtooth", 0.10); tone(90, 0.22, "sine", 0.14, 0.02); },
  // Guard / heal: soft rising chime.
  guard() { tone(440, 0.12, "sine", 0.09); tone(660, 0.16, "sine", 0.08, 0.08); },
  // A card drawn from the deck.
  draw() { tone(880, 0.05, "triangle", 0.06); },
  // Turn passing to the other side.
  turn() { tone(392, 0.08, "triangle", 0.07); tone(523, 0.10, "triangle", 0.07, 0.07); },
  // Resonance combo firing.
  resonance() { tone(587, 0.08, "triangle", 0.10); tone(880, 0.10, "triangle", 0.10, 0.05); tone(1174, 0.14, "triangle", 0.09, 0.10); },
  // Victory fanfare.
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, "triangle", 0.12, i * 0.11));
    tone(1318, 0.4, "triangle", 0.10, 0.46);
  },
  // Defeat: a slow descending pair.
  lose() { tone(330, 0.3, "sine", 0.11); tone(220, 0.5, "sine", 0.11, 0.25); },
};
