// The 3D Models channel is the showcase for one production: the film below.
// Each specimen gets its own section with a PS2-filtered 3D viewer, a spec
// sheet and a render, stacked top to bottom in this order.
//
// Add a model:
// 1. Export from Blender as .glb (File > Export > glTF 2.0, format: glb,
//    Include > Limit to > Selected Objects). Keep it under ~10 MB.
// 2. Drop it in /public/models/ and its render in /public/xephos/
// 3. Add an entry to `specimens`.

export const film = {
  title: 'XEPHOS',
  subtitle: 'STARBOUND',
  kind: 'Short 3D animated film',
  context: 'Semester 3 project · Game Design degree · UiTM Puncak Alam',
  credit: 'Solo production',
  tools: ['Blender', 'Substance Painter', 'Cycles'],
  summary:
    'A short 3D animated film I made solo for my Semester 3 project. I modelled, textured, lit, animated and rendered every shot myself. Watch it below, then inspect its hero assets in 3D.',
  // YouTube link: the film plays on the big-screen TV at the top of the page.
  video: 'https://youtu.be/3Pyd8ZWJAlQ',
};

export type Specimen = {
  code: string; // e.g. 'SPC-01'
  name: string;
  role: string; // what this asset is in the film
  note: string; // 1-3 sentences: what you made and how
  specs: [label: string, value: string][];
  file: string | null; // null = placeholder crystal
  frame?: number; // framing size in the viewer: bigger = closer (default 3)
  render?: string; // Cycles render shown under the viewer
};

export const specimens: Specimen[] = [
  {
    code: 'SPC-01',
    name: 'MANTIS-07',
    role: 'Hero starfighter',
    note:
      'The hero ship of Xephos: Starbound. Hard-surface modelled in Blender and textured in Substance Painter, with a worn orange livery, edge wear, decals and hazard markings.',
    specs: [
      ['TRIS', '27.0k'],
      ['TEXTURE SETS', '14 · Substance Painter'],
      ['SOURCE RES', '2K (web copy 1K)'],
      ['RENDER', 'Cycles'],
    ],
    file: '/models/mantis-07.glb',
    render: '/xephos/mantis-07-render.webp',
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
      ['SOURCE RES', '2K (web copy 1K)'],
      ['RENDER', 'Cycles'],
    ],
    file: '/models/pilot-seat.glb',
    frame: 2.3, // tall and boxy, so it needs less zoom than the long, flat ship
    render: '/xephos/pilot-seat-render.webp',
  },
];
