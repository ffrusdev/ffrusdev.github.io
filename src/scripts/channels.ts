// Channel surfing. Moving to another page plays an old-TV channel change:
//
//   leaving:  a quick, soft blink of static, and the TV's on-screen display
//             shows the channel you're going to.
//   arriving: the static fades and the picture settles; the channel number
//             stays in the corner for a moment.
// Kept short and subtle on purpose so it doesn't get in the way.
//
// Works for every link inside the site, plus ← / → arrow keys like a remote.
// The look lives in global.css (html.switching / html.tuning).
import { channels, chLabel } from '../data/channels';
import { playClick, playStatic } from './sound';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const noise = document.querySelector<HTMLCanvasElement>('.static-noise');
const osd = document.querySelector<HTMLElement>('.ch-osd');
const current = Number(document.body.dataset.channel ?? 0);
// Tells the next page "you were reached by changing channel" (see Base.astro <head>).
const TUNING_KEY = 'frus-tuning';
const LEAVE_MS = 180; // how long the "leaving" effect plays before the page changes

// Which channel a URL belongs to: /models/xephos/ is on CH03 (/models/).
function channelFor(url: URL) {
  let match: (typeof channels)[number] = channels[0];
  for (const c of channels) if (c.href !== '/' && url.pathname.startsWith(c.href)) match = c;
  return match;
}

// ---- live static: random grey pixels, redrawn every frame ----
// Drawn at a quarter of the screen size and stretched up, which keeps it
// cheap and gives it that slightly soft analogue grain.
let frame = 0;
function startNoise() {
  if (!noise || frame) return;
  const ctx = noise.getContext('2d');
  if (!ctx) return;
  const w = (noise.width = Math.max(1, Math.ceil(window.innerWidth / 4)));
  const h = (noise.height = Math.max(1, Math.ceil(window.innerHeight / 4)));
  const image = ctx.createImageData(w, h);
  const pixels = new Uint32Array(image.data.buffer); // one number per pixel (ABGR)
  const draw = () => {
    for (let i = 0; i < pixels.length; i++) {
      const v = (Math.random() * 255) | 0;
      pixels[i] = 0xff000000 | (v << 16) | (v << 8) | v; // opaque grey
    }
    ctx.putImageData(image, 0, 0);
    frame = requestAnimationFrame(draw);
  };
  draw();
}
function stopNoise() {
  cancelAnimationFrame(frame);
  frame = 0;
}

function tuneTo(url: URL) {
  playClick();
  playStatic(0.18);
  if (reduceMotion) {
    window.location.href = url.href;
    return;
  }
  // Show the channel we're switching TO in the on-screen display.
  const ch = channelFor(url);
  if (osd) osd.innerHTML = `<b>${chLabel(ch.num)}</b><span>${ch.label}</span>`;
  try {
    sessionStorage.setItem(TUNING_KEY, '1');
  } catch {
    /* private mode etc: the next page just won't play its arrival effect */
  }
  root.classList.remove('tuning');
  root.classList.add('switching');
  startNoise();
  window.setTimeout(() => {
    window.location.href = url.href;
  }, LEAVE_MS);
}

// Any click on a link to another page of this site changes channel.
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return; // other websites: normal link
  if (url.pathname === window.location.pathname && url.search === window.location.search) return; // #jumps on this page
  e.preventDefault();
  tuneTo(url);
});

// ← / → flip channels like a remote.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (t?.closest('[data-no-channel-keys]')) return; // e.g. the 3D viewer
  const i = channels.findIndex((c) => c.num === current);
  const step = e.key === 'ArrowRight' ? 1 : -1;
  const next = channels[(i + step + channels.length) % channels.length];
  tuneTo(new URL(next.href, window.location.href));
});

// Arriving by channel change: static runs while the picture settles, then stops.
// The `tuning` class is deliberately left on: its animations end invisible and
// stay that way. Removing it would bring back the normal page-load static flash
// (`tuneIn` in global.css), which then plays a second time like a refresh.
if (root.classList.contains('tuning')) {
  startNoise();
  window.setTimeout(stopNoise, 350);
}

// Coming "back" to a page the browser kept in memory: clear the leaving effect.
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  root.classList.remove('switching');
  stopNoise();
});
