// Turns a logo on a white background into a tiny pixel-art PNG.
//
//   node scripts/pixel-logo.mjs <input> <output.png> [height=16] [outline] [colours=8]
//
//   height   final size in pixels. The page shows it with
//            `image-rendering: pixelated`, so every pixel stays a crisp square.
//   outline  optional colour (e.g. "#f2eee6") for a 1px ring around the logo,
//            so a dark logo stays visible on a dark background.
//   colours  how many colours the final PNG may use (fewer = flatter, more "pixel art").
//
// Steps: remove the white background (flood fill from the edges, so white
// parts INSIDE the logo stay), trim, shrink, then make every pixel either fully
// solid or fully clear and cut the colours down to a small palette.
import sharp from 'sharp';

const [input, output, heightArg = '16', outlineArg = '', coloursArg = '8'] = process.argv.slice(2);
const outline = outlineArg || null; // pass "" to skip the outline but still set colours
const colours = Number(coloursArg);
if (!input || !output) {
  console.error('usage: node scripts/pixel-logo.mjs <input> <output.png> [height] [outline] [colours]');
  process.exit(1);
}
const height = Number(heightArg);

// 1. Background → transparent.
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const seen = new Uint8Array(w * h);
const stack = [];
const lightness = (p) => Math.min(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
while (stack.length) {
  const p = stack.pop();
  if (seen[p] || lightness(p) < 232) continue;
  seen[p] = 1;
  data[p * 4 + 3] = 0;
  const x = p % w;
  const y = (p / w) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < w - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - w);
  if (y < h - 1) stack.push(p + w);
}

// 2. Trim and shrink (smooth shrink first, so thin details average out nicely).
const small = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
  .trim()
  .resize({ height, kernel: 'lanczos3' })
  .raw()
  .toBuffer({ resolveWithObject: true });
const px = small.data;
const sw = small.info.width;
const sh = small.info.height;

// 3. Hard edges: each pixel is either solid or clear.
for (let i = 3; i < px.length; i += 4) px[i] = px[i] >= 110 ? 255 : 0;

// 4. Optional 1px outline, drawn on a canvas 1px bigger on every side.
let out = { data: px, width: sw, height: sh };
if (outline) {
  const [r, g, b] = outline.replace('#', '').match(/../g).map((c) => parseInt(c, 16));
  const W = sw + 2;
  const H = sh + 2;
  const big = Buffer.alloc(W * H * 4);
  const solid = (x, y) => x >= 0 && y >= 0 && x < sw && y < sh && px[(y * sw + x) * 4 + 3] === 255;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (solid(x - 1, y - 1)) {
        px.copy(big, o, ((y - 1) * sw + (x - 1)) * 4, ((y - 1) * sw + x) * 4);
      } else if (solid(x - 2, y - 1) || solid(x, y - 1) || solid(x - 1, y - 2) || solid(x - 1, y)) {
        big[o] = r; big[o + 1] = g; big[o + 2] = b; big[o + 3] = 255;
      }
    }
  }
  out = { data: big, width: W, height: H };
}

// 5. Small palette PNG (a handful of colours = proper pixel-art look, tiny file).
const result = await sharp(out.data, { raw: { width: out.width, height: out.height, channels: 4 } })
  .png({ palette: true, colours, dither: 0 })
  .toFile(output);
console.log(`${output}: ${result.width}x${result.height}, ${result.size} bytes`);
