import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createScene() {
  const scene = new THREE.Scene();

  // 3D Sky dome — a large sphere with gradient + clouds that has proper perspective
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 1024;
  skyCanvas.height = 1024;
  const ctx = skyCanvas.getContext('2d');

  // Rich blue gradient — much bluer, less white
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#3a7bd5');    // rich blue at zenith
  grad.addColorStop(0.25, '#5b9de5'); // medium blue
  grad.addColorStop(0.5, '#7bb8ed');  // sky blue
  grad.addColorStop(0.7, '#a0d0f5');  // light blue
  grad.addColorStop(0.85, '#d4e8f5'); // pale blue horizon
  grad.addColorStop(1, '#e8ddd0');    // warm horizon
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft white clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  const clouds = [
    [120, 200, 70], [350, 250, 80], [600, 180, 60], [850, 220, 75],
    [200, 350, 55], [500, 300, 65], [750, 280, 50], [950, 350, 60],
    [80, 400, 45], [400, 380, 50], [650, 350, 55], [300, 150, 40],
    [150, 500, 40], [700, 450, 45], [500, 480, 50],
  ];
  for (const [cx, cy, r] of clouds) {
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      ctx.ellipse(
        cx + (j - 2) * r * 0.45,
        cy + Math.sin(j * 1.2) * r * 0.1,
        r * (0.5 + j * 0.13),
        r * 0.4,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  const skyTexture = new THREE.CanvasTexture(skyCanvas);

  // Sky: use the canvas texture directly as scene background
  // No dome sphere — it was covering everything with a broken white texture
  scene.background = skyTexture;

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
