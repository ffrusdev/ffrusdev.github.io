# FRUS — portfolio of Nabil Luqman

"Dead Channel" theme: the homepage is an old CRT TV, and each page is a channel.
Built with **Astro** (static, fast HTML) + **Three.js** (3D viewer only).

## Run it

You need Node.js 20+ installed.

```bash
npm install
npm run dev        # open http://localhost:4321
npm run build      # makes the production site in /dist
```

## Update your content (no code needed)

| I want to… | Do this |
|---|---|
| Add / edit a project | Add a `.md` file in `src/data/projects/` (copy an existing one). Set `section: 3d` (3D + multiplayer games), `2d`, or `work` to pick its shelf on CH01 |
| Give a project a showcase page | In its `.md`, fill in `video:` (YouTube) and/or `poster:`, plus optional `context`, `stamp`, `tools` and `gallery` (see `src/data/projects/a-way-end.md`). Put its images in `public/projects/<name>/` |
| Add / edit a VR/MR project | Add a `.md` file in `src/data/xr/` (copy an existing one). Paste a YouTube link in `video:` and it embeds itself |
| Post a dev log | Add a `.md` file in `src/data/devlog/` (name it `YYYY-MM-DD-title.md`) |
| Change the homepage highlight reel | Edit the `ads` list at the top of `src/components/HighlightReel.astro` (image, title, tagline, button text, link). The "POWERED BY" tools strip is the `tools` list in `src/components/PoweredByStrip.astro` |
| Add a short film to CH03 | Copy a film entry in `src/data/models.ts` (title, YouTube `video`, story, stills, models). It gets a card on `/models/` and its own page at `/models/<id>/` |
| Add a 3D model to a film | Export from Blender as `.glb` with **Limit to → Selected Objects** and **Compression** on (see `public/models/README.txt`), put it in `public/models/` and its render in the film's folder in `public/`, then add it to that film's `specimens` |
| Add a CV | Put `cv.pdf` in `public/` |
| Change the About photo | Replace `src/assets/portrait.jpg` (square works best), then run `node scripts/ps2-image.mjs src/assets/portrait.jpg public/portrait-ps2.png 160` (bigger 160 = less pixelated; add e.g. `55,40,290` at the end to crop a square: left,top,size) |
| Add a channel/page | New file in `src/pages/` + one line in `src/data/channels.ts` |

The homepage "NOW PLAYING" box picks the first project with `status: active` automatically.

## How it works (the why)

- **Why Astro?** It turns pages into plain HTML at build time and sends *zero* JavaScript
  unless you ask for it. Recruiters on slow Wi-Fi get the TV instantly.
- **The CRT look is pure CSS** (`src/styles/global.css`): scanlines are a repeating gradient,
  static is a tiny dot pattern jittering with `steps()`, flicker is an opacity keyframe.
  No images, no JS.
- **Content collections** (`src/content.config.ts`): Astro validates your markdown
  frontmatter against a schema, so a typo like `status: actve` fails the build instead of
  silently breaking the page.
- **Three.js only loads on demand.** `src/pages/models/[id].astro` uses `await import(...)` when you press
  INSERT TAPE. The bundler splits Three into its own file, so no other page pays for it.
- **The PS2 look** (`src/scripts/ps2viewer.ts`): low-res render + `image-rendering: pixelated`,
  nearest-neighbour textures, and vertex snapping injected into Three's shader via
  `onBeforeCompile`. Read the comments there; same ideas work in Unity shaders.
- **Sound** (`src/scripts/sound.ts`) is synthesized with the Web Audio API (sine hum + brown
  noise), so it costs zero download. Off by default; browsers block autoplay anyway.
- **Accessibility:** real links/buttons, skip link, and `prefers-reduced-motion` turns off all
  flicker/static for people who get motion sick.

## Deploy (free)

The site is hosted on GitHub Pages at https://ffrusdev.github.io/.

1. Every `git push` to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it.
2. Watch a deploy in the repo's **Actions** tab; it takes about a minute.
3. For a custom domain later (e.g. `frus.dev`), add it under **Settings → Pages** and update `site` in `astro.config.mjs`.

## TODO

- [ ] Replace every `[PLACEHOLDER]` (search the project for `[`)
- [ ] Add real 3D models
- [x] Pixel portrait / avatar for About
- [ ] Optional: per-project trailer embeds, Steam wishlist button when the game is announced
