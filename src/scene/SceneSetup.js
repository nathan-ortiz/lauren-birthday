import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createScene() {
  const scene = new THREE.Scene();

  // Sky background — flat canvas texture (confirmed working)
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#3a7bd5');
  grad.addColorStop(0.3, '#5b9de5');
  grad.addColorStop(0.55, '#7bb8ed');
  grad.addColorStop(0.75, '#a0d0f5');
  grad.addColorStop(0.9, '#d4e8f5');
  grad.addColorStop(1, '#e8ddd0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  const clouds = [
    [80, 100, 50], [200, 130, 60], [350, 90, 45], [120, 180, 40],
    [400, 110, 50], [280, 160, 35], [50, 150, 40], [450, 80, 35],
    [300, 60, 45], [160, 220, 30],
  ];
  for (const [cx2, cy, r] of clouds) {
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.ellipse(cx2 + (j - 1.5) * r * 0.4, cy + Math.sin(j) * r * 0.1, r * (0.5 + j * 0.12), r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  scene.background = new THREE.CanvasTexture(skyCanvas);

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
