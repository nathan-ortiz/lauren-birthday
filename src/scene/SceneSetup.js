import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createScene() {
  const scene = new THREE.Scene();

  // Warm Pixar-style sky gradient — blue top, warm peach horizon
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d');

  // Base gradient — warm sky blue to soft peach
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#6db3f2');    // clear blue
  grad.addColorStop(0.35, '#87CEEB'); // light sky blue
  grad.addColorStop(0.65, '#b8dff5'); // pale blue
  grad.addColorStop(0.85, '#fce8d5'); // warm peach
  grad.addColorStop(1, '#ffecd2');    // golden horizon
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft cloud puffs — white, blurred, scattered in upper half
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  const cloudPositions = [
    [80, 100, 60], [200, 80, 45], [350, 120, 55], [120, 160, 40],
    [400, 90, 50], [280, 140, 35], [50, 180, 45], [450, 160, 30],
    [160, 60, 50], [320, 70, 40],
  ];
  for (const [cx, cy, r] of cloudPositions) {
    // Draw each cloud as overlapping ellipses for soft, natural shape
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.ellipse(
        cx + (j - 1.5) * r * 0.5,
        cy + Math.sin(j * 1.5) * r * 0.15,
        r * (0.6 + j * 0.15),
        r * 0.5,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  scene.background = skyTexture;

  // Fog
  scene.fog = new THREE.FogExp2(0xddeeff, 0.004); // light blue-white fog, very subtle

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
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
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
