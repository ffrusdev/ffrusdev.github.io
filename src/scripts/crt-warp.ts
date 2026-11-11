// Fish-eye / barrel distortion for CRT screens (the homepage TV).
//
// USE: give the element to bend `data-crt-warp="<id of an SVG filter>"` and
// optionally `data-crt-strength="0.06"`. The filter needs an <feImage> and an
// <feDisplacementMap> (see Tv.astro). This script draws
// the map for that element's size and switches the filter on.
//
// HOW IT WORKS
// SVG's <feDisplacementMap> moves every pixel of an element by an amount read
// from a second image (the "map"): the map's RED channel says how far to move
// in x, GREEN how far in y (128 = don't move, 0/255 = move the most).
// We paint a map where pixels near the centre barely move and pixels near the
// edges move a lot. Each spot on screen then shows content from a bit further
// out, so the picture looks squeezed at the edges and bulged in the middle,
// like curved CRT glass. (Same maths as a lens-distortion shader in Unity.)
//
// The map depends on the screen's size, so we redraw it whenever that changes.

const DEFAULT_STRENGTH = 0.1; // 0 = flat glass. Higher = more bulge (0.05–0.1 looks right)

// Safari draws SVG filters on normal HTML unreliably (the text can vanish).
// It just gets the flat-glass CSS look instead; that's still curved-looking.
const isSafari = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

function setUp(warp: HTMLElement) {
  const filter = document.getElementById(warp.dataset.crtWarp ?? '');
  const feImage = filter?.querySelector('feImage');
  const feDisp = filter?.querySelector('feDisplacementMap');
  if (!filter || !feImage || !feDisp) return;
  const STRENGTH = Number(warp.dataset.crtStrength) || DEFAULT_STRENGTH;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const draw = () => {
    const w = Math.round(warp.clientWidth);
    const h = Math.round(warp.clientHeight);
    if (!ctx || w < 2 || h < 2) return;

    // Biggest move happens in the corners: u = v = ±1, r² = 2.
    // feDisplacementMap's `scale` is the full range (−scale/2 … +scale/2).
    const maxMove = STRENGTH * 2 * Math.max(w, h) / 2;
    const scale = maxMove * 2;

    canvas.width = w;
    canvas.height = h;
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const v = (y / (h - 1)) * 2 - 1; // -1 (top) … +1 (bottom)
      for (let x = 0; x < w; x++) {
        const u = (x / (w - 1)) * 2 - 1; // -1 (left) … +1 (right)
        const r2 = u * u + v * v; // squared distance from centre
        const dx = u * STRENGTH * r2 * (w / 2); // in pixels
        const dy = v * STRENGTH * r2 * (h / 2);
        const i = (y * w + x) * 4;
        img.data[i] = 255 * (dx / scale + 0.5); // R: x move
        img.data[i + 1] = 255 * (dy / scale + 0.5); // G: y move
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Filter coordinates are in px from the element's top-left corner.
    for (const el of [filter, feImage]) {
      el.setAttribute('x', '0');
      el.setAttribute('y', '0');
      el.setAttribute('width', String(w));
      el.setAttribute('height', String(h));
    }
    feImage.setAttribute('href', canvas.toDataURL());
    feDisp.setAttribute('scale', scale.toFixed(2));
    warp.style.filter = `url(#${filter.id})`;
    warp.classList.add('is-warped');
  };

  draw(); // right away, so the bend is there from the first frame
  new ResizeObserver(draw).observe(warp); // and again whenever the screen changes size
}

if (!isSafari) document.querySelectorAll<HTMLElement>('[data-crt-warp]').forEach(setUp);
