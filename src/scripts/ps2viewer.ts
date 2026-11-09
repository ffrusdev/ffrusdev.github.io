// PS2-style 3D viewer. This file (and Three.js) is only downloaded when a
// visitor presses "INSERT TAPE" — see the dynamic import() in src/pages/models/[id].astro.
//
// The PS2 look comes from three tricks:
//  1. LOW-RES RENDER: draw at 1/3 resolution, then let CSS scale the canvas up
//     with `image-rendering: pixelated` so pixels stay chunky, not blurry.
//  2. NEAREST TEXTURES: no smoothing between texels → crunchy textures.
//  3. VERTEX SNAPPING: round each vertex's screen position to a coarse grid.
//     Old consoles had no sub-pixel precision, which made models "wobble".
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type Viewer = {
  // onProgress gets 0–1 while the file downloads (if the size is known).
  load(file: string | null, onProgress?: (fraction: number) => void): Promise<void>;
  setWireframe(on: boolean): void;
  setPs2(on: boolean): void;
  dispose(): void;
};

const PIXEL_SCALE = 3; // 1 rendered pixel = 3x3 screen pixels
const SNAP_ON = 140; // smaller = more wobble
const SNAP_OFF = 100000;

// Colours of the virtual "room" the model sits in. The defaults match the
// green CRT; a page can pass its own (the Xephos page uses neutral greys so
// the ship's real orange paint isn't tinted green).
export type ViewerLook = {
  background: string; // also the fog colour, so far-away parts fade into it
  sky: number; // hemisphere light from above
  ground: number; // hemisphere light from below
  key: number; // main directional light
  // Strength of a soft fake "studio room" that shiny/metal surfaces reflect.
  // Without it, PBR metal from Substance/Blender renders almost black,
  // because real metal shows its surroundings, not its own colour.
  reflections?: number;
  size?: number; // how big the model is framed (default 2 units)
};
const DEFAULT_LOOK: ViewerLook = { background: '#0e140d', sky: 0xd8f0c8, ground: 0x101410, key: 0xffd9a0 };

export function createViewer(stage: HTMLElement, look: ViewerLook = DEFAULT_LOOK): Viewer {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(1);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(look.background);
  scene.fog = new THREE.Fog(look.background, 4, 12);
  if (look.reflections) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = look.reflections;
    pmrem.dispose();
  }

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 1.1, 3.6);

  scene.add(new THREE.HemisphereLight(look.sky, look.ground, 1.2));
  const key = new THREE.DirectionalLight(look.key, 1.6);
  key.position.set(2, 3, 2);
  scene.add(key);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.minDistance = 1.5;
  controls.maxDistance = 8;
  controls.enablePan = false;

  // Shared uniform: changing .value updates every patched material at once.
  const snap = { value: SNAP_ON };
  let ps2 = true;
  let wire = false;
  let current: THREE.Object3D | null = null;

  // Inject vertex snapping into ANY built-in material (Standard, Basic...).
  // onBeforeCompile lets us edit Three's shader source before it's compiled.
  function ps2ify(mat: THREE.Material) {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSnap = snap;
      shader.vertexShader =
        'uniform float uSnap;\n' +
        shader.vertexShader.replace(
          '#include <project_vertex>',
          `#include <project_vertex>
           vec2 ndc = gl_Position.xy / gl_Position.w;
           ndc = floor(ndc * uSnap) / uSnap;
           gl_Position.xy = ndc * gl_Position.w;`,
        );
    };
    const map = (mat as THREE.MeshStandardMaterial).map;
    if (map) {
      map.magFilter = THREE.NearestFilter;
      map.minFilter = THREE.NearestFilter;
      map.needsUpdate = true;
    }
    mat.needsUpdate = true;
  }

  function eachMaterial(obj: THREE.Object3D, fn: (m: THREE.Material) => void) {
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(fn);
    });
  }

  function placeholder(): THREE.Object3D {
    const geo = new THREE.IcosahedronGeometry(0.9, 0);
    const mat = new THREE.MeshStandardMaterial({ color: '#b8f2a0', flatShading: true, roughness: 0.8 });
    return new THREE.Mesh(geo, mat);
  }

  // Scale any model to the same size and centre it, so every .glb frames the same.
  function normalize(obj: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    obj.scale.setScalar((look.size ?? 2) / maxDim);
    const centre = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
    obj.position.sub(centre);
  }

  function clear() {
    if (!current) return;
    scene.remove(current);
    current.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
    });
    current = null;
  }

  // The .glb files are Draco-compressed (about 7x smaller), so the loader
  // needs the Draco decoder. It lives in public/draco/ (copied from
  // node_modules/three/examples/jsm/libs/draco/) and only downloads when needed.
  const draco = new DRACOLoader();
  draco.setDecoderPath(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/draco/`);
  draco.setDecoderConfig({ type: 'wasm' });
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  async function load(file: string | null, onProgress?: (fraction: number) => void) {
    let obj: THREE.Object3D;
    if (file) {
      const gltf = await loader.loadAsync(file, (e) => {
        if (e.lengthComputable && e.total) onProgress?.(e.loaded / e.total);
      });
      obj = gltf.scene;
    } else {
      obj = placeholder();
    }
    clear();
    normalize(obj);
    eachMaterial(obj, (m) => {
      ps2ify(m);
      (m as THREE.MeshStandardMaterial).wireframe = wire;
    });
    current = obj;
    scene.add(obj);
  }

  function resize() {
    const w = stage.clientWidth || 1;
    const h = stage.clientHeight || 1;
    const s = ps2 ? PIXEL_SCALE : 1;
    renderer.setSize(Math.max(1, Math.floor(w / s)), Math.max(1, Math.floor(h / s)), false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  renderer.setAnimationLoop(() => {
    if (document.hidden) return; // don't burn battery in a background tab
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    load,
    setWireframe(on) {
      wire = on;
      if (current) eachMaterial(current, (m) => { (m as THREE.MeshStandardMaterial).wireframe = on; });
    },
    setPs2(on) {
      ps2 = on;
      snap.value = on ? SNAP_ON : SNAP_OFF;
      resize();
    },
    dispose() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      clear();
      draco.dispose();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
