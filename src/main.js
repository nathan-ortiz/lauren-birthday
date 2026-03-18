import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createScene, createRenderer, createCamera } from './scene/SceneSetup.js';
import { createTerrain } from './scene/Terrain.js';
import { createWater } from './scene/Water.js';
import { createTrees } from './scene/Trees.js';
import { createDecorations } from './scene/Decorations.js';
import { createBirthdayText, updateBirthdayText } from './scene/BirthdayText.js';
import { createParticles, createPetalParticles } from './scene/Particles.js';
import { Car } from './vehicles/Car.js';
import { FollowCamera } from './camera/FollowCamera.js';
import { KeyboardControls } from './controls/KeyboardControls.js';
import { MobileControls } from './controls/MobileControls.js';
import { createPhysicsWorld } from './physics/PhysicsWorld.js';
import { createTrainStation } from './stations/TrainStation.js';
import { createBridgeStation } from './stations/BridgeStation.js';
import { createKayakStation } from './stations/KayakStation.js';
import { createLogStation } from './stations/LogStation.js';
import { StationManager } from './stations/StationManager.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { StartScreen } from './ui/StartScreen.js';
import { PhotoOverlay } from './ui/PhotoOverlay.js';
import { PromptUI } from './ui/PromptUI.js';

// Mobile detection
const isMobile =
  /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

async function init() {
  const loadingScreen = new LoadingScreen();

  // Create scene, renderer, camera
  const scene = createScene();
  const renderer = createRenderer();
  const camera = createCamera();
  document.getElementById('game-container').appendChild(renderer.domElement);

  // Post-processing: bloom makes emissive materials glow
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,   // strength — subtle but visible glow
    0.4,   // radius — how far the glow spreads
    0.82   // threshold — only bright/emissive things bloom
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // Physics
  const { world } = createPhysicsWorld();

  // World
  createTerrain(scene);
  const water = createWater(scene);
  createTrees(scene);
  createDecorations(scene);
  const { letters, bodies } = createBirthdayText(scene, world);
  const particles = createParticles(scene);
  const petals = createPetalParticles(scene);

  // Car
  const car = new Car(scene, world);

  // Camera
  const followCamera = new FollowCamera(camera, isMobile);

  // Controls
  const keyboard = new KeyboardControls();
  const mobileControls = new MobileControls();
  if (isMobile) {
    mobileControls.init();
  }

  // Stations
  const stations = [
    createTrainStation(scene, world),
    createBridgeStation(scene, world),
    createKayakStation(scene, world),
    createLogStation(scene, world),
  ];

  // UI
  const promptUI = new PromptUI();
  let stationManager;

  const photoOverlay = new PhotoOverlay(() => {
    stationManager.closeOverlay();
  });

  stationManager = new StationManager(
    stations,
    promptUI,
    photoOverlay,
    keyboard,
    mobileControls,
    isMobile
  );

  // Handle resize — update renderer AND composer
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(w, h);
    bloomPass.resolution.set(w, h);
    followCamera.resize();
  });

  // Pause when tab is hidden (save battery on mobile)
  let paused = false;
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) clock.getDelta();
  });

  // Hide loading, show start screen
  loadingScreen.hide();
  const startScreen = new StartScreen(isMobile);
  await startScreen.show();

  // Start game loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (paused) return;

    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.getElapsedTime();

    // Physics step
    world.step(1 / 60, delta, 3);

    // Car input
    if (isMobile) {
      car.applyJoystickInput(mobileControls.forwardAmount, mobileControls.steerAmount);
    } else {
      car.applyInput(keyboard.forward, keyboard.backward, keyboard.left, keyboard.right);
    }

    // Update systems
    car.update();
    followCamera.update(car.getPosition(), car.getRotationY());
    stationManager.update(car.getPosition(), elapsed);
    water.update(elapsed);
    particles.update(delta);
    petals.update(delta);
    updateBirthdayText(letters, bodies);

    // Render with bloom post-processing
    composer.render();
  }

  animate();
}

init().catch(console.error);
