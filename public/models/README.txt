Put your .glb files here, then add an entry in src/data/models.ts with
file: '/models/your-model.glb'

Keep them small (PS2 style!): low-poly, 512px textures or less.
The viewer can read Draco-compressed files (decoder lives in public/draco/).
To shrink a model in Blender: File > Export > glTF 2.0, then
  - Data > Compression: on (Draco)
  - Textures > Images: WebP (or Automatic), and scale big images down first
mantis-07.glb and pilot-seat.glb were made this way (6 MB -> 0.85 MB).
