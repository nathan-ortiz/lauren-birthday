import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createScene() {
  const scene = new THREE.Scene();

  // Sky gradient
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(0.6, '#c8e6f5');
  gradient.addColorStop(1, '#ffecd2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 256);
  const skyTexture = new THREE.CanvasTexture(canvas);
  scene.background = skyTexture;

  // Fog
  scene.fog = new THREE.FogExp2(COLORS.fog, 0.012);

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
