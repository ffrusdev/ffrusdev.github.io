// Channel surfing: a quick burst of static + click sound before moving page,
// and ← / → arrow keys flip channels like a remote.
import { channels } from '../data/channels';
import { playClick, playStatic } from './sound';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const burst = document.querySelector<HTMLElement>('.static-burst');
const current = Number(document.body.dataset.channel ?? 0);

function tuneTo(href: string) {
  playClick();
  playStatic();
  if (reduceMotion || !burst) { window.location.href = href; return; }
  burst.classList.add('on');
  window.setTimeout(() => { window.location.href = href; }, 200);
}

document.querySelectorAll<HTMLAnchorElement>('a[data-channel-link]').forEach((a) => {
  a.addEventListener('click', (e) => {
    // let people open in new tab / window normally
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    tuneTo(a.href);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (t?.closest('[data-no-channel-keys]')) return; // e.g. the 3D viewer
  const i = channels.findIndex((c) => c.num === current);
  const step = e.key === 'ArrowRight' ? 1 : -1;
  const next = channels[(i + step + channels.length) % channels.length];
  tuneTo(next.href);
});

// If the user comes "back" via bfcache, clear the static.
window.addEventListener('pageshow', () => burst?.classList.remove('on'));
