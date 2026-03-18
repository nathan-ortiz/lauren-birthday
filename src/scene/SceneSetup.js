import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createScene() {
  const scene = new THREE.Scene();

  // Sky dome using a custom shader — no textures, no canvas, can't break
  // Computes sky color from vertex direction: blue at top, warm at horizon
  // Includes procedural cloud-like noise for natural variation
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(190, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {},
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDir;
        void main() {
          float h = vDir.y; // -1 (bottom) to +1 (top)

          // Sky gradient
          vec3 zenith  = vec3(0.22, 0.47, 0.83);  // rich blue
          vec3 mid     = vec3(0.48, 0.72, 0.92);  // sky blue
          vec3 horizon = vec3(0.78, 0.88, 0.95);  // pale blue
          vec3 ground  = vec3(0.82, 0.85, 0.78);  // warm gray-green

          vec3 color;
          if (h > 0.3) {
            color = mix(mid, zenith, (h - 0.3) / 0.7);
          } else if (h > 0.0) {
            color = mix(horizon, mid, h / 0.3);
          } else {
            color = mix(ground, horizon, (h + 1.0) / 1.0);
          }

          // Soft cloud bands near horizon
          float cloudBand = smoothstep(0.05, 0.25, h) * (1.0 - smoothstep(0.25, 0.5, h));
          float noise = fract(sin(vDir.x * 12.9 + vDir.z * 78.2) * 43758.5) * 0.5 + 0.5;
          float cloud = cloudBand * noise * 0.3;
          color = mix(color, vec3(1.0), cloud);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
  );
  scene.add(skyDome);
  scene._skyDome = skyDome;

  // Solid blue background fallback
  scene.background = new THREE.Color(0x7bb8ed);

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
