// Bake a PS2 look into a still image (run once, commit the output).
//
//   node scripts/ps2-image.mjs <input> <output.png> [width] [left,top,size]
//   e.g. node scripts/ps2-image.mjs src/assets/portrait.jpg public/portrait-ps2.png 160
//
// The optional last argument crops a square first (in original-image pixels):
// start `left` px from the left, `top` px from the top, `size` px wide/tall,
// e.g. `55,40,290`. Handy for cutting something out of a photo's corner.
//
// The PS2 look for a 2D image, step by step:
//  1. LOW RES: shrink to `width` pixels wide. The page shows it at 2x with
//     `image-rendering: pixelated`, so every pixel becomes a crisp 2x2 block.
//     Bigger width = less pixelated (200 keeps a face readable).
//  2. 16-BIT COLOUR: the PS2 often drew to a 16-bit framebuffer (5 bits per
//     channel = 32 shades instead of 256), which causes colour banding.
//  3. ORDERED DITHER: to hide that banding, the hardware added a fixed 4x4
//     pattern of tiny offsets before rounding. That's the faint crosshatch
//     you see in smooth gradients in PS2 games.
import sharp from 'sharp';

const [input, output, widthArg, cropArg] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node scripts/ps2-image.mjs <input> <output.png> [width] [left,top,size]');
  process.exit(1);
}
const width = Number(widthArg ?? 200);
const crop = cropArg?.split(',').map(Number); // e.g. "55,40,290" -> [55, 40, 290]
const LEVELS = 32; // 5 bits per channel
const STEP = 255 / (LEVELS - 1);

// 4x4 Bayer matrix: values 0..15 spread evenly so the pattern never clumps.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

let img = sharp(input);
if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[2] });

const { data, info } = await img
  .resize({ width, kernel: 'lanczos3' }) // smooth shrink keeps facial detail
  .modulate({ saturation: 1.08 }) // tiny bit punchier, like a CRT
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    // offset in -0.5..+0.5 of one colour step, chosen by pixel position
    const offset = (BAYER[y % 4][x % 4] / 16 - 0.5) * STEP;
    const i = (y * info.width + x) * info.channels;
    for (let c = 0; c < 3; c++) {
      const v = data[i + c] + offset;
      data[i + c] = Math.max(0, Math.min(255, Math.round(v / STEP) * STEP));
    }
  }
}

await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(output);
console.log(`wrote ${output} (${info.width}x${info.height})`);
