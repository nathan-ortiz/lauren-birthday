import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createScene() {
  const scene = new THREE.Scene();

  // Sky: CubeTexture — 6 canvas faces forming a cube map
  // Three.js renders cube map backgrounds with proper 3D perspective
  // No dome mesh needed — this is the native Three.js way to do 3D skies
  const skySize = 256;
  function makeSkyFace(topHex, bottomHex, addClouds) {
    const c = document.createElement('canvas');
    c.width = skySize;
    c.height = skySize;
    const cx = c.getContext('2d');
    const g = cx.createLinearGradient(0, 0, 0, skySize);
    g.addColorStop(0, topHex);
    g.addColorStop(1, bottomHex);
    cx.fillStyle = g;
    cx.fillRect(0, 0, skySize, skySize);
    if (addClouds) {
      cx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 5; i++) {
        const px = Math.random() * skySize;
        const py = skySize * 0.3 + Math.random() * skySize * 0.4;
        const pr = 20 + Math.random() * 30;
        for (let j = 0; j < 4; j++) {
          cx.beginPath();
          cx.ellipse(px + (j - 1.5) * pr * 0.4, py, pr * (0.5 + j * 0.12), pr * 0.4, 0, 0, Math.PI * 2);
          cx.fill();
        }
      }
    }
    return c;
  }

  function makeSolidFace(hex) {
    const c = document.createElement('canvas');
    c.width = skySize;
    c.height = skySize;
    const cx = c.getContext('2d');
    cx.fillStyle = hex;
    cx.fillRect(0, 0, skySize, skySize);
    return c;
  }

  // CubeTexture face order: +X, -X, +Y, -Y, +Z, -Z
  const cubeTexture = new THREE.CubeTexture([
    makeSkyFace('#4a8ad4', '#c0daf0', true),  // +X right
    makeSkyFace('#5090d8', '#c5ddf2', true),  // -X left
    makeSolidFace('#3a78cc'),                  // +Y top (deep blue)
    makeSolidFace('#c8d8c0'),                  // -Y bottom (warm green-gray)
    makeSkyFace('#4888d2', '#bdd8ef', true),  // +Z front
    makeSkyFace('#5292da', '#c8def3', true),  // -Z back
  ]);
  cubeTexture.needsUpdate = true;
  scene.background = cubeTexture;

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
