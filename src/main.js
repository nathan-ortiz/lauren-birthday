import * as THREE from 'three';
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
  const followCamera = new FollowCamera(camera);

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

  // Handle resize
  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    followCamera.resize();
  }
  window.addEventListener('resize', onResize);

  // Hide loading, show start screen
  loadingScreen.hide();
  const startScreen = new StartScreen();
  await startScreen.show();

  // Start game loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

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

    // Render
    renderer.render(scene, camera);
  }

  animate();
}

init().catch(console.error);
