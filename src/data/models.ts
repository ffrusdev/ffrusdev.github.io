// Your 3D "specimens".
// 1. Export from Blender as .glb (File > Export > glTF 2.0, format: glb).
// 2. Drop it in /public/models/
// 3. Add an entry below. `file: null` shows the built-in placeholder crystal.
export type Specimen = {
  code: string;
  name: string;
  meta: string;
  note: string;
  tris: string;
  texture: string;
  file: string | null;
};

export const specimens: Specimen[] = [
  {
    code: 'SPC-01',
    name: '[MODEL NAME]',
    meta: 'prop · 2026',
    note: 'Placeholder crystal. Swap in your first .glb and write what you made, why, and what you learned.',
    tris: '20',
    texture: 'none',
    file: null,
  },
];
