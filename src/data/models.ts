// CH03 (3D Models) is a shelf of short films. /models/ lists them as cards;
// each film gets its own page at /models/<id>/ with the film on a big-screen
// TV, its hero models in PS2-filtered 3D viewers, and stills.
//
// Add a film: copy one of the entries below and change the text.
// Add a model to a film:
// 1. Export from Blender as .glb (File > Export > glTF 2.0, format: glb,
//    Include > Limit to > Selected Objects, Data > Compression on).
//    See public/models/README.txt for keeping it small.
// 2. Drop it in /public/models/ and its render/still in the film's folder
//    in /public/ (e.g. /public/xephos/).
// 3. Add an entry to that film's `specimens`.
import type { ViewerLook } from '../scripts/ps2viewer';

export type Specimen = {
  code: string; // e.g. 'SPC-01'
  name: string;
  role: string; // what this asset is in the film
  note: string; // 1-3 sentences: what you made and how
  specs: [label: string, value: string][];
  file: string | null; // null = placeholder crystal
  frame?: number; // framing size in the viewer: bigger = closer (default 3)
  render?: string; // image shown under the viewer
  renderAlt?: string;
};

export type Still = { src: string; caption: string; alt: string };

export type Film = {
  id: string; // the page lives at /models/<id>/
  order: number; // position on the /models/ shelf
  // Each film page has its own accent. 'xephos' = retro-future sci-fi
  // (red + blue title); 'forge' = Norse smithy (iron + ember, runes).
  theme: 'xephos' | 'forge';
  name: string; // full title in normal text, e.g. 'Xephos: Starbound'
  titleMain: string; // big word on the title card
  titleSub: string; // smaller line under it
  fileNo: string; // 'FILE № 03' on the title card
  code: string; // short catalogue code, e.g. 'XPH-STB'
  kind: string;
  context: string;
  credit: string;
  tools: string[];
  summary: string; // title card paragraph
  blurb: string; // one or two lines for the /models/ card
  thumb: string; // 320x180 card image (shown with chunky pixels)
  video: string; // YouTube link, plays on the big-screen TV
  videoPoster?: string; // picture on the TV before PLAY is pressed (default: YouTube's thumbnail)
  tvBrand: [string, string]; // the TV's brand plate
  engine?: { mark: string; logo?: string; name: string; sub?: string }; // "powered by" sticker on the TV
  story?: string[]; // paragraphs for THE STORY section (optional)
  runes?: string; // forge theme: text written in runes on the title card
  renderLabel: string; // caption prefix under each model's image
  look: ViewerLook; // lighting/colours of the 3D viewer "room"
  specimens: Specimen[];
  stills?: Still[];
};

export const films: Film[] = [
  {
    id: 'xephos',
    order: 1,
    theme: 'xephos',
    name: 'Xephos: Starbound',
    titleMain: 'XEPHOS',
    titleSub: ': STARBOUND',
    fileNo: '03',
    code: 'XPH-STB',
    kind: 'Short 3D animated film',
    context: 'Semester 3 project · Game Design degree · UiTM Puncak Alam',
    credit: 'Solo production',
    tools: ['Blender', 'Substance Painter', 'Cycles'],
    summary:
      'A short 3D animated film I made solo for my Semester 3 project. I modelled, textured, lit, animated and rendered every shot myself. Watch it below, then inspect its hero assets in 3D.',
    blurb: 'A retro-future sci-fi short starring the MANTIS-07 starfighter. Hard-surface modelling, Substance Painter texturing and Cycles rendering.',
    thumb: '/xephos/thumb.webp',
    video: 'https://youtu.be/3Pyd8ZWJAlQ',
    videoPoster: '/xephos/still-asteroid-ring.webp',
    tvBrand: ['XPH', 'VISION'],
    engine: { mark: 'UE5', logo: '/logos/unreal.png', name: 'UNREAL', sub: 'ENGINE 5' },
    renderLabel: 'RENDER // CYCLES',
    // Neutral grey "studio" so the orange paint reads true, like the renders.
    // Metal parts need something to reflect (see ps2viewer.ts).
    look: { background: '#1a1814', sky: 0xf2ece0, ground: 0x2a2620, key: 0xfff1dc, reflections: 0.8 },
    specimens: [
      {
        code: 'SPC-01',
        name: 'MANTIS-07',
        role: 'Hero starfighter',
        note:
          'The hero ship of Xephos: Starbound. Hard-surface modelled in Blender and textured in Substance Painter, with a worn orange livery, edge wear, decals and hazard markings.',
        specs: [
          ['TRIS', '27.0k'],
          ['TEXTURE SETS', '14 · Substance Painter'],
          ['SOURCE RES', '2K (web copy 512px)'],
          ['RENDER', 'Cycles'],
        ],
        file: '/models/mantis-07.glb',
        render: '/xephos/mantis-07-render.webp',
        renderAlt: 'Cycles render of the MANTIS-07 starfighter',
      },
      {
        code: 'SPC-02',
        name: 'PILOT SEAT',
        role: 'Cockpit prop',
        note:
          "The MANTIS-07's pilot seat. Modelled in Blender, with PBR leather, painted metal and rubber materials.",
        specs: [
          ['TRIS', '5.9k'],
          ['MATERIALS', '6 · PBR'],
          ['SOURCE RES', '2K (web copy 512px)'],
          ['RENDER', 'Cycles'],
        ],
        file: '/models/pilot-seat.glb',
        frame: 2.3, // tall and boxy, so it needs less zoom than the long, flat ship
        render: '/xephos/pilot-seat-render.webp',
        renderAlt: 'Cycles render of the pilot seat',
      },
    ],
    stills: [
      {
        src: '/xephos/still-crew-quarters.webp',
        caption: 'INTERIOR · CREW QUARTERS',
        alt: 'Dim sci-fi crew quarters with a bunk, flowers in white planters and orange crates',
      },
      {
        src: '/xephos/still-common-area.webp',
        caption: 'INTERIOR · COMMON AREA',
        alt: 'Worn orange and grey ship interior with glowing consoles and a window onto asteroids',
      },
      {
        src: '/xephos/still-cockpit.webp',
        caption: 'IN THE COCKPIT',
        alt: 'View from the cockpit seat, glowing controls in front of a starfield and asteroids',
      },
      {
        src: '/xephos/still-through-the-belt.webp',
        caption: 'MANTIS-07 · THROUGH THE BELT',
        alt: 'The starfighter, engines glowing cyan, weaving through an asteroid belt near a ringed planet',
      },
      {
        src: '/xephos/still-asteroid-ring.webp',
        caption: 'THE ASTEROID RING',
        alt: 'Dark asteroids drifting over a planetary ring, a bright star behind',
      },
      {
        src: '/xephos/still-ringed-world.webp',
        caption: 'THE RINGED WORLD',
        alt: 'A reddish planet circled by a ring of rock and asteroids',
      },
      {
        src: '/xephos/still-ring-arc.webp',
        caption: 'RING ARC',
        alt: 'A planetary ring curving away into space, strewn with asteroids',
      },
      {
        src: '/xephos/still-ring-backlit.webp',
        caption: 'RING PLANE · BACKLIT',
        alt: 'Asteroids silhouetted against a tilted ring and a bright star',
      },
    ],
  },
  {
    id: 'hammer-of-gods',
    order: 2,
    theme: 'forge',
    name: 'Hammer of Gods',
    titleMain: 'HAMMER',
    titleSub: 'OF GODS',
    fileNo: '04',
    code: 'HOG-MJR',
    kind: 'Short 3D animated film',
    context: 'Semester 3 project · Game Design degree · UiTM Puncak Alam',
    credit: 'Solo production · about 6 weeks',
    tools: ['Blender', 'Unreal Engine 5'],
    summary:
      'A short 3D animated film retelling the Norse myth of how Mjolnir was made. I made it solo in about six weeks: every model built in Blender, then the world assembled, lit and rendered in Unreal Engine 5.',
    blurb: 'Two dwarven smiths forge Mjolnir, until Loki comes knocking. A low-poly short film made in Blender and Unreal Engine 5.',
    thumb: '/hammer-of-gods/thumb.webp',
    video: 'https://youtu.be/FydDJMnvQ9A',
    tvBrand: ['RUNE', 'VISION'],
    engine: { mark: 'UE5', logo: '/logos/unreal.png', name: 'UNREAL', sub: 'ENGINE 5' },
    story: [
      'Deep in an amber forest stands a lonely smithy. Inside, two dwarven brothers, Sindri and Brokkr, the finest smiths in all the Nine Realms, are at work on their greatest piece yet: a hammer worthy of a god.',
      'The fire has to stay hot and the work can never stop. Then Loki, the trickster set on ruining it all, knocks at the front door.',
      'One knock, at the worst possible moment. The rest is history.',
    ],
    runes: 'SINDRI · BROKKR · MJOLNIR',
    renderLabel: 'STILL // UNREAL ENGINE 5',
    // Warm amber dusk, like the forest in the film. Matte low-poly: no reflections.
    look: { background: '#17130f', sky: 0xffe6c4, ground: 0x3a2616, key: 0xffcf96 },
    specimens: [
      {
        code: 'SPC-01',
        name: 'THE SMITHY',
        role: "Main set · Sindri & Brokkr's forge",
        note:
          "The brothers' smithy, where the whole film happens. Modelled low-poly in Blender and coloured with one shared 128px palette texture instead of unique textures per object, the way a lot of stylised games keep things light.",
        specs: [
          ['TRIS', '4.7k'],
          ['TEXTURE', '1 palette · 128px'],
          ['MATERIALS', '2'],
          ['ENGINE', 'Unreal Engine 5'],
        ],
        file: '/models/smithy.glb',
        render: '/hammer-of-gods/smithy-path.webp',
        renderAlt: 'The smithy at the end of a forest path, in warm evening light',
      },
      {
        code: 'SPC-02',
        name: 'FOREST TREE',
        role: 'Set dressing · the amber forest',
        note:
          'One of the stylised trees that fill the forest around the smithy, with chunky low-poly leaf clumps. It uses the same palette texture as the smithy, so the whole set shares one look.',
        specs: [
          ['TRIS', '29.9k'],
          ['MESHES', '4 · trunk + 3 canopies'],
          ['TEXTURE', '1 palette · 128px'],
          ['ENGINE', 'Unreal Engine 5'],
        ],
        file: '/models/forest-tree.glb',
        render: '/hammer-of-gods/forest.webp',
        renderAlt: 'A dense low-poly forest with glowing fireflies',
      },
    ],
    stills: [
      {
        src: '/hammer-of-gods/forge-brothers.webp',
        caption: 'SINDRI & BROKKR AT THE FORGE',
        alt: 'Two dwarves working at a blazing forge inside the smithy',
      },
      {
        src: '/hammer-of-gods/forge-fire.webp',
        caption: 'THE FIRE MUST NOT GO OUT',
        alt: 'Close-up of the forge fire with sparks, a dwarf at the anvil beside it',
      },
    ],
  },
];

export const sortedFilms = () => [...films].sort((a, b) => a.order - b.order);
