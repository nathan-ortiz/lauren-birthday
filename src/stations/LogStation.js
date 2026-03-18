import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial, getEmissiveMaterial } from '../utils/Materials.js';

export function createLogStation(scene, world) {
  const group = new THREE.Group();
  const pos = { x: -20, y: 5, z: -35 };

  // Hill mound
  const hillGeo = new THREE.SphereGeometry(12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const hillMat = getMaterial(COLORS.grassDark);
  const hill = new THREE.Mesh(hillGeo, hillMat);
  hill.position.y = -5;
  hill.scale.set(1, 0.5, 1);
  hill.receiveShadow = true;
  group.add(hill);

  // Big log
  const logGeo = new THREE.CylinderGeometry(1.2, 1.4, 10, 10);
  logGeo.rotateZ(Math.PI / 2);
  const logMat = getMaterial(0x8b5e3c);
  const log = new THREE.Mesh(logGeo, logMat);
  log.position.y = 1.4;
  log.castShadow = true;
  group.add(log);

  // Bark rings (darker bands)
  for (let i = -4; i <= 4; i += 2) {
    const ringGeo = new THREE.CylinderGeometry(1.45, 1.45, 0.15, 10);
    ringGeo.rotateZ(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, getMaterial(0x6b4226));
    ring.position.set(i, 1.4, 0);
    group.add(ring);
  }

  // Cross-section caps (tree rings)
  for (const side of [-5, 5]) {
    const capGeo = new THREE.CircleGeometry(1.3, 10);
    const capMat = getMaterial(0xd4a76a);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(side, 1.4, 0);
    cap.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(cap);

    // Inner rings
    for (let r = 0.3; r < 1.2; r += 0.3) {
      const torusGeo = new THREE.TorusGeometry(r, 0.02, 4, 16);
      const torus = new THREE.Mesh(torusGeo, getMaterial(0x8b5e3c));
      torus.position.set(side > 0 ? side + 0.01 : side - 0.01, 1.4, 0);
      torus.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      group.add(torus);
    }
  }

  // Mushrooms
  for (let i = 0; i < 4; i++) {
    const mushroomGroup = new THREE.Group();
    const stemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 5);
    const stem = new THREE.Mesh(stemGeo, getMaterial(0xf5f0eb));
    stem.position.y = 0.15;
    mushroomGroup.add(stem);

    const capGeo = new THREE.SphereGeometry(0.15, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, getMaterial(i % 2 === 0 ? 0xe84545 : 0xf5a623));
    cap.position.y = 0.3;
    mushroomGroup.add(cap);

    const angle = (i / 4) * Math.PI * 2;
    const mx = Math.cos(angle) * 1.3 + (i - 2);
    mushroomGroup.position.set(mx, 0.5 + 1.2, Math.sin(angle) * 0.5);
    mushroomGroup.rotation.z = Math.sin(angle) * 0.2;
    group.add(mushroomGroup);
  }

  // Glowing ring
  const glowRingGeo = new THREE.TorusGeometry(6, 0.15, 8, 32);
  const glowRing = new THREE.Mesh(glowRingGeo, getEmissiveMaterial(COLORS.gold, 1.5));
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.2;
  group.add(glowRing);

  group.position.set(pos.x, pos.y, pos.z);
  scene.add(group);

  // Physics
  const physicsBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Cylinder(1.3, 1.5, 10, 8),
    position: new CANNON.Vec3(pos.x, pos.y + 1.4, pos.z),
  });
  physicsBody.quaternion.setFromEuler(0, 0, Math.PI / 2);
  world.addBody(physicsBody);

  // Hill collision — wide gentle sphere so car can drive up
  const hillBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Sphere(14),
    position: new CANNON.Vec3(pos.x, pos.y - 10, pos.z),
  });
  world.addBody(hillBody);

  return {
    position: new THREE.Vector3(pos.x, pos.y, pos.z),
    radius: 10,
    photo: '/photos/splash-mountain.jpg',
    caption: 'Splash Mountain! 🎢',
    ring: glowRing,
  };
}
