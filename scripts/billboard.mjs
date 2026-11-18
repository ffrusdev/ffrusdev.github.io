// Builds public/models/billboard.glb: the "coming soon" billboard on the home page.
//
//   node scripts/billboard.mjs path/to/Billboards.glb
//
// Source model: "Post-Apocalyptic 60s Billboards" from Sketchfab (see the
// credit in src/components/ComingSoonBillboard.astro). That file has two
// billboards; this keeps only the first one and:
//   1. swaps its 60s ad for the We Are COOKED! key art + logo,
//   2. ages that art (faded print, rust runs, grime) so it fits a dead city,
//   3. makes the poster lit by the scene's lamps instead of glowing,
//   4. shrinks textures to 512px WebP and Draco-compresses the mesh
//      (14 MB -> well under 1 MB, PS2 style).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, draco } from '@gltf-transform/functions';
import { EXTTextureWebP } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const [input, output = 'public/models/billboard.glb'] = process.argv.slice(2);
if (!input) throw new Error('usage: node scripts/billboard.mjs Billboards.glb [out.glb]');

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'draco3d.encoder': await draco3d.createEncoderModule(), 'draco3d.decoder': await draco3d.createDecoderModule() });
const doc = await io.read(input);
const root = doc.getRoot();

// ---- 1. keep only the first billboard (it carries a poster on each side) ----
const keep = root.listNodes().find((n) => n.getName() === 'Billboard double-sided');
if (!keep) throw new Error('could not find "Billboard double-sided" in the file');
for (const scene of root.listScenes())
  for (const n of scene.listChildren()) if (n !== keep) n.dispose();

// ---- 2. the new poster art ----
const W = 1024, H = 436; // same shape as the poster (3.55 x 1.51)
const art = await sharp('public/projects/we-are-cooked/key-art.webp')
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .toBuffer();
const logo = await sharp('public/projects/we-are-cooked/logo.webp').resize({ width: Math.round(W * 0.46) }).toBuffer();
const logoMeta = await sharp(logo).metadata();
const fresh = await sharp(art)
  .composite([{ input: logo, left: Math.round((W - logoMeta.width) / 2), top: Math.round(H * 0.03) }])
  .raw().toBuffer({ resolveWithObject: true });

// Ageing, done pixel by pixel. A small seeded random keeps every build identical.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
// Smooth "value noise": random values on a coarse grid, blended between.
function noise(cells) {
  const g = Array.from({ length: (cells + 2) * (cells + 2) }, rnd);
  return (x, y) => {
    const fx = (x / W) * cells, fy = (y / H) * cells;
    const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const v = (a, b) => g[b * (cells + 2) + a];
    const top = v(ix, iy) * (1 - tx) + v(ix + 1, iy) * tx;
    const bot = v(ix, iy + 1) * (1 - tx) + v(ix + 1, iy + 1) * tx;
    return top * (1 - ty) + bot * ty;
  };
}
const big = noise(5), mid = noise(18), fine = noise(70);
// Rust runs: streaks that drip down from the top frame, fading out.
const runs = Array.from({ length: 9 }, () => ({ x: rnd() * W, w: 1 + rnd() * 2, len: 0.12 + rnd() * 0.3, s: 0.15 + rnd() * 0.2 }));

const px = fresh.data, ch = fresh.info.channels;
const out = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * ch;
    let r = px[i], g = px[i + 1], b = px[i + 2];
    // sun-faded print: less colour, washed-out blacks, warmer paper tone
    const grey = 0.3 * r + 0.59 * g + 0.11 * b;
    const fade = 0.3 + 0.2 * (1 - y / H) + 0.1 * big(x, y); // top faded most
    r = r + (grey - r) * fade * 0.35; g = g + (grey - g) * fade * 0.35; b = b + (grey - b) * fade * 0.35;
    r = 8 + r * 0.96; g = 6 + g * 0.93; b = 3 + b * 0.86; // slightly warm, yellowed paper
    // grime: dark blotches and fine dirt
    let dirt = 1 - 0.16 * Math.max(0, mid(x, y) - 0.45) - 0.06 * fine(x, y);
    // rust runs from the top edge
    for (const run of runs) {
      const d = Math.abs(x - run.x - Math.sin(y * 0.05) * 1.5);
      if (d < run.w && y / H < run.len) {
        const k = run.s * (1 - y / H / run.len) * (1 - d / run.w);
        r = r * (1 - k) + 96 * k; g = g * (1 - k) + 48 * k; b = b * (1 - k) + 22 * k;
      }
    }
    // darker edges where water collects
    const ex = Math.min(x, W - 1 - x) / W, ey = Math.min(y, H - 1 - y) / H;
    dirt *= 0.85 + 0.15 * Math.min(1, Math.min(ex * 9, ey * 5));
    // the odd scratch / paper speck
    const speck = rnd() < 0.004 ? 1.35 : 1;
    const o = (y * W + x) * 4;
    out[o] = Math.min(255, r * dirt * speck);
    out[o + 1] = Math.min(255, g * dirt * speck);
    out[o + 2] = Math.min(255, b * dirt * speck);
    out[o + 3] = 255;
  }
}

// Torn-paper outline: the original poster's alpha mask, squeezed to our size.
const posterMat = root.listMaterials().find((m) => m.getName() === "Dickinson'");
const maskTex = posterMat.getBaseColorTexture();
const mask = await sharp(Buffer.from(maskTex.getImage())).resize(W, H, { fit: 'fill' }).ensureAlpha().extractChannel(3).raw().toBuffer();
for (let p = 0; p < W * H; p++) out[p * 4 + 3] = mask[p];

const posterPng = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
if (process.env.POSTER_PREVIEW) await sharp(posterPng).toFile(process.env.POSTER_PREVIEW); // to look at the art on its own

// ---- 3. lit, weathered poster instead of a glowing one ----
const tex = doc.createTexture('wearecooked-poster').setImage(new Uint8Array(posterPng)).setMimeType('image/png');
posterMat
  .setName('Poster')
  .setBaseColorTexture(tex)
  .setBaseColorFactor([1, 1, 1, 1])
  .setEmissiveTexture(null)
  .setEmissiveFactor([0, 0, 0]) // lit only by the scene's lamps
  .setAlphaMode('MASK') // crisp torn edges, no sorting problems
  .setAlphaCutoff(0.5)
  .setRoughnessFactor(0.95)
  .setMetallicFactor(0);

// ---- 4. shrink for the web ----
await doc.transform(prune(), dedup());
// Rust/metal textures: 512px is plenty for a PS2 look. The poster has the
// logo on it, so it stays 1024 wide.
for (const t of root.listTextures()) {
  const poster = t === tex;
  const img = sharp(Buffer.from(t.getImage()));
  if (!poster) img.resize(512, 512, { fit: 'inside' });
  t.setImage(new Uint8Array(await img.webp({ quality: poster ? 88 : 80 }).toBuffer())).setMimeType('image/webp');
}
doc.createExtension(EXTTextureWebP).setRequired(true);
await doc.transform(draco());
await io.write(output, doc);
console.log('wrote', output);
