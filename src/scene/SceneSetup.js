import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createScene() {
  const scene = new THREE.Scene();

  // Sky dome — a large sphere with gradient + clouds, visible from all angles
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 1024;
  skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d');

  // Gradient: blue sky top → warm horizon bottom
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#4a90d9');
  grad.addColorStop(0.3, '#6db3f2');
  grad.addColorStop(0.55, '#87CEEB');
  grad.addColorStop(0.75, '#b8dff5');
  grad.addColorStop(0.9, '#e8d5c4');
  grad.addColorStop(1, '#ffecd2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Soft clouds scattered across the sky
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  const clouds = [
    [100, 80, 50], [300, 100, 60], [550, 70, 45], [750, 110, 55],
    [200, 150, 40], [450, 130, 50], [650, 90, 40], [900, 120, 45],
    [150, 60, 35], [500, 160, 35], [800, 80, 50], [350, 50, 40],
    [50, 130, 30], [700, 150, 35], [950, 70, 40],
  ];
  for (const [cx, cy, r] of clouds) {
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      ctx.ellipse(
        cx + (j - 2) * r * 0.4,
        cy + Math.sin(j * 1.3) * r * 0.12,
        r * (0.5 + j * 0.12),
        r * 0.45,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  scene.background = skyTexture;

  // Fog
  scene.fog = new THREE.FogExp2(0xc8dff0, 0.005); // matches sky horizon for seamless edge

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
