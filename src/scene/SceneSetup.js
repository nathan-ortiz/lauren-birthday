import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createScene() {
  const scene = new THREE.Scene();

  // Sky: vertex-colored sphere — no textures, no shaders, no canvas
  // Just a huge sphere with blue-to-white vertex colors, rendered from inside
  const skyGeo = new THREE.SphereGeometry(180, 32, 20);
  const skyColors = new Float32Array(skyGeo.attributes.position.count * 3);
  const posAttr = skyGeo.attributes.position;

  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i); // -180 to +180
    const t = (y + 180) / 360; // 0 (bottom) to 1 (top)

    // Color gradient: warm bottom → pale horizon → sky blue → deep blue top
    let r, g, b;
    if (t > 0.65) {
      // Upper sky: deep blue
      const s = (t - 0.65) / 0.35;
      r = 0.28 - s * 0.06;
      g = 0.52 - s * 0.04;
      b = 0.88 + s * 0.05;
    } else if (t > 0.45) {
      // Mid sky: sky blue
      const s = (t - 0.45) / 0.2;
      r = 0.48 - s * 0.2;
      g = 0.72 - s * 0.2;
      b = 0.93 - s * 0.05;
    } else if (t > 0.3) {
      // Horizon: pale blue-white
      const s = (t - 0.3) / 0.15;
      r = 0.75 - s * 0.27;
      g = 0.85 - s * 0.13;
      b = 0.92 + s * 0.01;
    } else {
      // Below horizon: warm earth tone
      const s = t / 0.3;
      r = 0.75;
      g = 0.78 + s * 0.07;
      b = 0.72 + s * 0.2;
    }

    skyColors[i * 3] = r;
    skyColors[i * 3 + 1] = g;
    skyColors[i * 3 + 2] = b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(skyColors, 3));

  const skyDome = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    toneMapped: false,
  }));
  scene.add(skyDome);
  scene._skyDome = skyDome;

  // No scene.background — the dome sphere IS the background
  // If dome fails, renderer clear color (set in createRenderer) handles it

  // No fog — was causing white edges
  // scene.fog = new THREE.FogExp2(0x87CEEB, 0.002);

  // Hemisphere light
  const hemiLight = new THREE.HemisphereLight(0xffecd2, 0x8ec5c0, 0.8);
  scene.add(hemiLight);

  // Directional sun
  const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
  dirLight.position.set(50, 80, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -60;
  dirLight.shadow.camera.right = 60;
  dirLight.shadow.camera.top = 60;
  dirLight.shadow.camera.bottom = -60;
  dirLight.shadow.bias = -0.001;
  scene.add(dirLight);

  // Ambient fill
  const ambientLight = new THREE.AmbientLight(0xfff8f0, 0.3);
  scene.add(ambientLight);

  return scene;
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x7bb8ed, 1); // sky blue clear color as fallback
  return renderer;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 14, -18);
  return camera;
}
