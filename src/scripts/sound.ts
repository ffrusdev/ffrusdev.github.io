// Ambient CRT sound, generated live with the Web Audio API.
// WHY generate instead of using mp3s? Zero download, and it loops forever
// without a seam. A hum is just a couple of low sine waves plus filtered noise.
//
// Browsers block audio until the visitor interacts with the page, so sound
// is OFF by default and only starts after a click/keypress.

const KEY = 'frus-sound';
let ctx: AudioContext | null = null;
let humGain: GainNode | null = null;
let humSources: AudioScheduledSourceNode[] = [];
let enabled = false;

function readPref(): boolean {
  try { return localStorage.getItem(KEY) === 'on'; } catch { return false; }
}
function writePref(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage blocked: fine */ }
}

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

// Brown noise = white noise run through a tiny low-pass. Sounds like room tone.
function noiseBuffer(c: AudioContext, seconds: number, brown: boolean): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else { d[i] = w; }
  }
  return buf;
}

function startHum() {
  const c = getCtx();
  humGain = c.createGain();
  humGain.gain.value = 0;
  humGain.connect(c.destination);

  const tones: Array<[number, number]> = [[50, 0.5], [100, 0.18]]; // mains hum + harmonic
  for (const [freq, vol] of tones) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g).connect(humGain);
    o.start();
    humSources.push(o);
  }

  const room = c.createBufferSource();
  room.buffer = noiseBuffer(c, 3, true);
  room.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  const rg = c.createGain();
  rg.gain.value = 0.6;
  room.connect(lp).connect(rg).connect(humGain);
  room.start();
  humSources.push(room);

  humGain.gain.linearRampToValueAtTime(0.045, c.currentTime + 1.2); // fade in
}

function stopHum() {
  if (!ctx || !humGain) return;
  const g = humGain;
  const sources = humSources;
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  setTimeout(() => { sources.forEach((s) => s.stop()); g.disconnect(); }, 350);
  humSources = [];
  humGain = null;
}

export function playStatic(duration = 0.22) {
  if (!enabled || !ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, duration, false);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3000;
  bp.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.12, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start();
}

export function playClick() {
  if (!enabled || !ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.value = 900;
  g.gain.setValueAtTime(0.05, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.05);
}

function updateButtons() {
  document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(enabled));
    const label = b.querySelector('[data-sound-label]');
    if (label) label.textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
  });
}

function setEnabled(on: boolean) {
  if (on === enabled) return;
  enabled = on;
  writePref(on);
  updateButtons();
  if (on) { void getCtx().resume(); startHum(); } else { stopHum(); }
}

document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]').forEach((b) =>
  b.addEventListener('click', () => setEnabled(!enabled)),
);

// Visitor turned sound on last time? Resume on their first interaction
// (we're not allowed to start it before that).
// Resume only once in total: whichever comes first (click or key) removes
// BOTH listeners, so a later keypress can't switch sound back on after the
// visitor turned it off.
// `capture: true` makes this run BEFORE the channel-surfing key handler, so
// the very first ← / → already plays the click + static.
if (readPref()) {
  const resume = (e: Event) => {
    window.removeEventListener('pointerdown', resume, true);
    window.removeEventListener('keydown', resume, true);
    // don't fight the toggle button itself: its own click handler decides
    if ((e.target as HTMLElement | null)?.closest('[data-sound-toggle]')) return;
    setEnabled(true);
  };
  window.addEventListener('pointerdown', resume, true);
  window.addEventListener('keydown', resume, true);
}
