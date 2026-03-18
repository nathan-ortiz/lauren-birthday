import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial, getEmissiveMaterial } from '../utils/Materials.js';

export function createLogStation(scene, world) {
  const group = new THREE.Group();
  const pos = { x: -20, y: 5, z: -35 };

  // Hill mound
  const hillGeo = new THREE.SphereGeometry(12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const hill = new THREE.Mesh(hillGeo, getMaterial(COLORS.grassDark));
  hill.position.y = -5;
  hill.scale.set(1, 0.5, 1);
  hill.receiveShadow = true;
  group.add(hill);

  // === Splash Mountain Log Flume Ride ===
  const logGroup = new THREE.Group();
  logGroup.position.y = 1.2;

  // Log hull — hollowed-out log shape using a trough (half-cylinder bottom + sides)
  const hullLength = 8;
  const hullRadius = 1.3;

  // Bottom hull (half cylinder — the boat part)
  const hullGeo = new THREE.CylinderGeometry(hullRadius, hullRadius * 1.1, hullLength, 12, 1, false, 0, Math.PI);
  const hullMat = getMaterial(0x6b3a1f); // dark brown log exterior
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.rotation.x = Math.PI; // flip so open side faces up
  hull.rotation.y = Math.PI / 2;
  hull.castShadow = true;
  logGroup.add(hull);

  // Inner hull (lighter wood interior)
  const innerGeo = new THREE.CylinderGeometry(hullRadius * 0.85, hullRadius * 0.95, hullLength - 0.4, 10, 1, false, 0, Math.PI);
  const inner = new THREE.Mesh(innerGeo, getMaterial(0xc4956a));
  inner.rotation.x = Math.PI;
  inner.rotation.y = Math.PI / 2;
  inner.position.y = 0.1;
  logGroup.add(inner);

  // Flat deck/floor inside the log
  const floorGeo = new THREE.BoxGeometry(hullLength - 0.5, 0.1, hullRadius * 1.6);
  const floor = new THREE.Mesh(floorGeo, getMaterial(0xb8845a));
  floor.position.y = 0.15;
  logGroup.add(floor);

  // Seats — 3 rows of bench seats inside the log
  const seatMat = getMaterial(0x8b5e3c);
  for (let s = 0; s < 3; s++) {
    // Seat back
    const backGeo = new THREE.BoxGeometry(0.12, 0.6, hullRadius * 1.2);
    const back = new THREE.Mesh(backGeo, seatMat);
    back.position.set(-2 + s * 2, 0.5, 0);
    logGroup.add(back);

    // Seat bench
    const benchGeo = new THREE.BoxGeometry(0.8, 0.12, hullRadius * 1.2);
    const bench = new THREE.Mesh(benchGeo, seatMat);
    bench.position.set(-2 + s * 2 + 0.3, 0.25, 0);
    logGroup.add(bench);
  }

  // Pointed bow (front of log)
  const bowGeo = new THREE.ConeGeometry(hullRadius * 0.8, 1.5, 8);
  const bow = new THREE.Mesh(bowGeo, getMaterial(0x6b3a1f));
  bow.rotation.z = -Math.PI / 2;
  bow.position.set(hullLength / 2 + 0.5, 0, 0);
  logGroup.add(bow);

  // Stern (back end — flat cap)
  const sternGeo = new THREE.BoxGeometry(0.2, hullRadius * 1.2, hullRadius * 1.8);
  const stern = new THREE.Mesh(sternGeo, getMaterial(0x5a2d0c));
  stern.position.set(-hullLength / 2, 0.1, 0);
  logGroup.add(stern);

  // Water splash decoration at the base
  const splashGeo = new THREE.SphereGeometry(0.3, 6, 4);
  const splashMat = getMaterial(COLORS.water, { transparent: true, opacity: 0.5 });
  for (let i = 0; i < 6; i++) {
    const splash = new THREE.Mesh(splashGeo, splashMat);
    splash.position.set(
      hullLength / 2 + 0.5 + Math.random() * 1.5,
      -0.5 + Math.random() * 0.5,
      (Math.random() - 0.5) * 2
    );
    splash.scale.setScalar(0.5 + Math.random() * 0.8);
    logGroup.add(splash);
  }

  group.add(logGroup);

  // Mushrooms around the base
  for (let i = 0; i < 4; i++) {
    const mushroomGroup = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 5), getMaterial(0xf5f0eb));
    stem.position.y = 0.15;
    mushroomGroup.add(stem);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      getMaterial(i % 2 === 0 ? 0xe84545 : 0xf5a623)
    );
    cap.position.y = 0.3;
    mushroomGroup.add(cap);
    const angle = (i / 4) * Math.PI * 2;
    mushroomGroup.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
    group.add(mushroomGroup);
  }

  // Glowing ring
  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(6, 0.15, 8, 32),
    getEmissiveMaterial(COLORS.gold, 1.5)
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.2;
  group.add(glowRing);

  group.position.set(pos.x, pos.y, pos.z);
  scene.add(group);

  // Physics body for the log ride
  const physicsBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(4, 1, 1.5)),
    position: new CANNON.Vec3(pos.x, pos.y + 1.2, pos.z),
  });
  world.addBody(physicsBody);

  return {
    position: new THREE.Vector3(pos.x, pos.y, pos.z),
    radius: 10,
    photo: '/photos/splash-mountain.jpg',
    caption: 'Splash Mountain! 🎢',
    ring: glowRing,
  };
}
