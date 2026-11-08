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
| Add / edit a project | Add a `.md` file in `src/data/projects/` (copy an existing one) |
| Post a dev log | Add a `.md` file in `src/data/devlog/` (name it `YYYY-MM-DD-title.md`) |
| Add a 3D model | Put the `.glb` in `public/models/`, add an entry in `src/data/models.ts` |
| Add a CV | Put `cv.pdf` in `public/` |
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
- **Three.js only loads on demand.** `models.astro` uses `await import(...)` when you press
  INSERT TAPE. The bundler splits Three into its own file, so no other page pays for it.
- **The PS2 look** (`src/scripts/ps2viewer.ts`): low-res render + `image-rendering: pixelated`,
  nearest-neighbour textures, and vertex snapping injected into Three's shader via
  `onBeforeCompile`. Read the comments there; same ideas work in Unity shaders.
- **Sound** (`src/scripts/sound.ts`) is synthesized with the Web Audio API (sine hum + brown
  noise), so it costs zero download. Off by default; browsers block autoplay anyway.
- **Accessibility:** real links/buttons, skip link, and `prefers-reduced-motion` turns off all
  flicker/static for people who get motion sick.

## Deploy (free)

1. Push this folder to a GitHub repo.
2. Go to vercel.com (or netlify.com) → New Project → import the repo. It auto-detects Astro.
3. Every `git push` redeploys. Add a custom domain later (e.g. `frus.dev`).

## TODO

- [ ] Replace every `[PLACEHOLDER]` (search the project for `[`)
- [ ] Add real 3D models
- [ ] Pixel portrait / avatar for About
- [ ] Optional: per-project trailer embeds, Steam wishlist button when the game is announced
