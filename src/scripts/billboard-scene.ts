// "Coming soon" billboard on the home page. This file (and Three.js) is only
// downloaded when the section scrolls near the screen; see ComingSoonBillboard.astro.
//
// A look-but-don't-touch 3D scene: a rusty 60s billboard at night with the
// We Are COOKED! art, half hidden under a big dirty sheet. One lamp works,
// the other is dying and flickers. The camera drifts slowly by itself, like
// a handheld shot, and there are no controls.
//
// Same PS2 tricks as the CH03 viewer (src/scripts/ps2viewer.ts): low-res
// render scaled up with crisp pixels, nearest-pixel textures, and vertex
// snapping for that slight wobble.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const PIXEL_SCALE = 3; // 1 rendered pixel = 3x3 screen pixels
const SNAP = 160; // vertex snapping grid (smaller = more wobble)
const FOG = 0x221a14; // smoggy night air, the colour far things fade into

export async function startBillboard(stage: HTMLElement, opts: { still: boolean }) {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(1);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = smogSky();
  scene.fog = new THREE.Fog(FOG, 7, 22);

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 60);

  // ---- PS2 look for every material ----
  const snap = { value: SNAP };
  const ps2ify = (mat: THREE.Material) => {
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (shader, r) => {
      prev?.call(mat, shader, r);
      shader.uniforms.uSnap = snap;
      shader.vertexShader = 'uniform float uSnap;\n' + shader.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
         vec2 ndc = gl_Position.xy / gl_Position.w;
         ndc = floor(ndc * uSnap) / uSnap;
         gl_Position.xy = ndc * gl_Position.w;`,
      );
    };
    for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap'] as const) {
      const t = (mat as THREE.MeshStandardMaterial)[key];
      if (t) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.needsUpdate = true; }
    }
    mat.needsUpdate = true;
  };

  // ---- lights: cold moonlight + two lamps on the billboard ----
  scene.add(new THREE.HemisphereLight(0x5a6478, 0x1a120c, 0.45));
  const moon = new THREE.DirectionalLight(0x8a9bb8, 0.35);
  moon.position.set(-6, 8, 4);
  scene.add(moon);

  // ---- the billboard ----
  const draco = new DRACOLoader();
  draco.setDecoderPath(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/draco/`);
  draco.setDecoderConfig({ type: 'wasm' });
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  const gltf = await loader.loadAsync('/models/billboard.glb');
  const board = gltf.scene;
  scene.add(board);

  // Put its feet on the ground, centred.
  const box = new THREE.Box3().setFromObject(board);
  const centre = box.getCenter(new THREE.Vector3());
  board.position.x -= centre.x;
  board.position.z -= centre.z;
  board.position.y -= box.min.y;
  board.updateMatrixWorld(true);

  // Find the parts we need: the front poster and the lamp bulbs.
  let poster: THREE.Mesh | null = null;
  let bulbs: THREE.Mesh | null = null;
  board.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (mat.name === 'Poster') {
      const p = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());
      if (!poster || p.z > new THREE.Box3().setFromObject(poster).getCenter(new THREE.Vector3()).z) poster = m;
    }
    if (mat.name === 'Emissive lights') bulbs = m;
  });
  if (!poster) throw new Error('billboard: poster not found');
  const pBox = new THREE.Box3().setFromObject(poster as THREE.Mesh);
  const pMin = pBox.min, pMax = pBox.max;
  const pW = pMax.x - pMin.x, pH = pMax.y - pMin.y;
  const front = pMax.z; // the poster faces +z

  // The dying lamp is the one on the right (x > 0). The bulbs are all one
  // mesh, so the flicker is done in the shader: anything right of centre
  // gets its glow multiplied by uFlicker.
  const flicker = { value: 1 };
  if (bulbs) {
    const mat = ((bulbs as THREE.Mesh).material as THREE.MeshStandardMaterial).clone();
    (bulbs as THREE.Mesh).material = mat;
    mat.emissiveIntensity = 2.2;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFlicker = flicker;
      shader.vertexShader = 'varying float vWorldX;\n' + shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\n vWorldX = (modelMatrix * vec4(transformed, 1.0)).x;',
      );
      shader.fragmentShader = 'uniform float uFlicker;\nvarying float vWorldX;\n' + shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n totalEmissiveRadiance *= mix(1.0, uFlicker, step(0.0, vWorldX));',
      );
    };
  }

  // Lamp light pools on the poster, lit from just above and in front of it.
  const lampY = pMax.y + 0.35, lampZ = front + 0.9;
  const makeLamp = (x: number) => {
    const s = new THREE.SpotLight(0xffe6c0, 4, 8, 0.7, 0.6, 1.2);
    s.position.set(x, lampY, lampZ);
    s.target.position.set(x * 0.8, pMin.y + pH * 0.35, front);
    scene.add(s, s.target);
    return s;
  };
  makeLamp(pMin.x + pW * 0.27); // the working lamp
  const dying = makeLamp(pMin.x + pW * 0.75);
  const DYING_MAX = dying.intensity;

  // ---- ground: cracked dark asphalt, made on a canvas (no download) ----
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({
    map: noiseTexture(128, [24, 22, 19], [46, 41, 34], 12), roughness: 1,
  }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ---- the sheet over the right half ----
  scene.add(makeSheet(pMin, pMax, front));

  // PS2-ify everything once (materials shared between meshes are only patched once).
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      if (!mat.userData.ps2) { mat.userData.ps2 = true; ps2ify(mat); }
    }
  });

  // ---- camera: low angle looking up, drifting slowly like a handheld shot ----
  const look = new THREE.Vector3(0, pMin.y + pH * 0.45, front);
  const base = new THREE.Vector3(-1.1, 0.8, front + 4.3);
  const place = (t: number) => {
    camera.position.set(
      base.x + Math.sin(t * 0.11) * 0.6 + Math.sin(t * 0.53) * 0.04,
      base.y + Math.sin(t * 0.17) * 0.18 + Math.sin(t * 0.71) * 0.03,
      base.z + Math.sin(t * 0.07) * 0.35,
    );
    camera.lookAt(look.x + Math.sin(t * 0.13) * 0.15, look.y, look.z);
  };

  // A dying lamp: mostly on, with bursts of fast stutter and short blackouts.
  let nextBurst = 2, burstEnd = 0;
  const flickerAt = (t: number) => {
    if (t > nextBurst) { burstEnd = t + 0.3 + Math.random() * 0.9; nextBurst = burstEnd + 1.5 + Math.random() * 4; }
    if (t < burstEnd) return Math.random() < 0.45 ? 0.05 : 0.6 + Math.random() * 0.4;
    return 0.92 + Math.sin(t * 50) * 0.04; // a faint hum
  };

  function resize() {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    const px = w < 700 ? 2 : PIXEL_SCALE; // phones: finer pixels, or the art turns to mush
    renderer.setSize(Math.max(1, Math.floor(w / px)), Math.max(1, Math.floor(h / px)), false);
    camera.aspect = w / h;
    // Keep the whole board in frame side to side: on narrow (phone) screens
    // that needs a taller view, so work the vertical angle out from a fixed
    // ~56° horizontal one.
    const fitWidth = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(28)) / camera.aspect));
    camera.fov = Math.max(42, fitWidth);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(() => { resize(); if (opts.still) renderer.render(scene, camera); });
  ro.observe(stage);
  resize();

  // Reduced motion: one still frame, both lamps on, nothing moves.
  if (opts.still) {
    place(0);
    renderer.render(scene, camera);
    return;
  }

  // Only animate while the section is on screen (saves battery).
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  const t0 = performance.now();
  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden) return;
    const t = (performance.now() - t0) / 1000 + 3;
    place(t);
    const f = flickerAt(t);
    flicker.value = f;
    dying.intensity = DYING_MAX * f;
    renderer.render(scene, camera);
  });
}

// Night sky over a dead city: near-black at the top, a dirty orange smog
// glow at the horizon (like distant fires or sodium street lights).
function smogSky() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#07070a');
  grad.addColorStop(0.55, '#16120f');
  grad.addColorStop(0.8, '#3a2618');
  grad.addColorStop(1, '#221a14');
  g.fillStyle = grad;
  g.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A canvas texture with blotchy noise between two colours (dirt, asphalt).
function noiseTexture(size: number, dark: number[], light: number[], blobs: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = `rgb(${dark})`;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < blobs * 40; i++) {
    const k = Math.random();
    g.fillStyle = `rgba(${light.map((v, j) => Math.round(dark[j] + (v - dark[j]) * k))},0.5)`;
    g.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(14, 14);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The big sheet: pinned along the top of the poster, covering its right half,
// hanging past the bottom edge in heavy folds. It never moves, so the folds are
// simply baked into the shape.
function makeSheet(pMin: THREE.Vector3, pMax: THREE.Vector3, front: number) {
  const pW = pMax.x - pMin.x, pH = pMax.y - pMin.y;
  const w = pW * 0.56, h = pH * 1.32;
  const geo = new THREE.PlaneGeometry(w, h, 48, 40);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const u = (x + w / 2) / w; // 0 = left edge (middle of the poster) … 1 = right
    const down = (h / 2 - y) / h; // 0 at the top pin line … 1 at the hem
    // vertical folds, deeper towards the hem, plus a big belly in the middle
    const folds = Math.sin(u * 19 + Math.sin(down * 3) * 0.8) * 0.035 + Math.sin(u * 7.3 + 1.2) * 0.05;
    const z = 0.04 + folds * Math.pow(down, 0.6) + Math.sin(u * Math.PI) * 0.05 * down;
    // the free left edge swings inward as it falls (the sheet is pulled to the right)
    const pull = (1 - u) * down * down * 0.22 * w;
    // ragged hem: the bottom edge droops unevenly
    const sag = Math.sin(u * 11.0) * 0.06 + Math.sin(u * 4.1) * 0.05;
    pos.setXYZ(i, x + pull, y - sag * down * down, z);
  }
  geo.computeVertexNormals();

  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  // dirty canvas cloth: off-white, water stains, soot near the hem, frayed hem
  g.fillStyle = '#8f8676';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) {
    const r = 8 + Math.random() * 40, x = Math.random() * 256, y = Math.random() * 256;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const dark = Math.random() < 0.6;
    grad.addColorStop(0, dark ? 'rgba(60,44,28,0.35)' : 'rgba(190,180,160,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const soot = g.createLinearGradient(0, 150, 0, 256);
  soot.addColorStop(0, 'rgba(20,14,10,0)');
  soot.addColorStop(1, 'rgba(20,14,10,0.6)');
  g.fillStyle = soot;
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) { g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.05})`; g.fillRect(0, y, 256, 1); } // weave
  // rust drips from the pin line
  for (let i = 0; i < 9; i++) {
    const x = Math.random() * 256;
    const drip = g.createLinearGradient(0, 0, 0, 40 + Math.random() * 90);
    drip.addColorStop(0, 'rgba(110,52,20,0.55)');
    drip.addColorStop(1, 'rgba(110,52,20,0)');
    g.fillStyle = drip;
    g.fillRect(x, 0, 2 + Math.random() * 4, 130);
  }
  // frayed, torn hem: cut holes in the alpha along the bottom
  g.globalCompositeOperation = 'destination-out';
  for (let x = 0; x < 256; x += 3) {
    const tear = 4 + Math.random() * 10 + (Math.sin(x * 0.07) + 1) * 6;
    g.fillRect(x, 256 - tear, 3, tear);
  }
  for (let i = 0; i < 6; i++) { // a few moth holes
    g.beginPath(); g.arc(Math.random() * 256, 60 + Math.random() * 170, 1.5 + Math.random() * 3, 0, Math.PI * 2); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const sheet = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: tex, roughness: 1, side: THREE.DoubleSide, alphaTest: 0.5,
  }));
  // pin line: just above the poster's top edge, right half
  sheet.position.set(pMax.x - w / 2 + 0.06, pMax.y + 0.08 - h / 2, front);
  return sheet;
}
