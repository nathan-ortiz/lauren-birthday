import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial, getEmissiveMaterial } from '../utils/Materials.js';

export function createTrainStation(scene, world) {
  const group = new THREE.Group();
  const pos = { x: 30, y: 0, z: -25 };

  // Train cart body
  const bodyGeo = new THREE.BoxGeometry(3, 2.5, 6);
  const body = new THREE.Mesh(bodyGeo, getMaterial(0x6b2e3a)); // maroon
  body.position.y = 2;
  body.castShadow = true;
  group.add(body);

  // Roof
  const roofGeo = new THREE.BoxGeometry(3.4, 0.3, 6.4);
  const roof = new THREE.Mesh(roofGeo, getMaterial(COLORS.carAccent));
  roof.position.y = 3.4;
  roof.castShadow = true;
  group.add(roof);

  // Windows (4 on each side)
  const windowMat = getMaterial(0x88ccff, { transparent: true, opacity: 0.6 });
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i++) {
      const winGeo = new THREE.PlaneGeometry(0.6, 0.8);
      const win = new THREE.Mesh(winGeo, windowMat);
      win.position.set(side * 1.51, 2.3, -2.2 + i * 1.4);
      win.rotation.y = side > 0 ? 0 : Math.PI;
      group.add(win);
    }
  }

  // Wheels (6 total)
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = getMaterial(COLORS.carAccent);
  const wheelPositions = [-2, 0, 2];
  for (const z of wheelPositions) {
    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(side * 1.3, 0.6, z);
      wheel.castShadow = true;
      group.add(wheel);
    }
  }

  // Chimney
  const chimneyGeo = new THREE.CylinderGeometry(0.25, 0.35, 1, 6);
  const chimney = new THREE.Mesh(chimneyGeo, getMaterial(COLORS.carAccent));
  chimney.position.set(0, 3.9, 2.2);
  chimney.castShadow = true;
  group.add(chimney);

  // Gold trim lines
  const trimGeo = new THREE.BoxGeometry(3.05, 0.08, 6.05);
  const trim = new THREE.Mesh(trimGeo, getMaterial(COLORS.gold));
  trim.position.y = 1.5;
  group.add(trim);
  const trim2 = trim.clone();
  trim2.position.y = 2.8;
  group.add(trim2);

  // Tracks
  const trackMat = getMaterial(COLORS.metal);
  const tieMat = getMaterial(COLORS.wood);
  for (let i = -6; i <= 6; i++) {
    const tieGeo = new THREE.BoxGeometry(4, 0.15, 0.3);
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 0.08, i * 1.2);
    tie.receiveShadow = true;
    group.add(tie);
  }
  for (const side of [-1.2, 1.2]) {
    const railGeo = new THREE.BoxGeometry(0.15, 0.2, 15);
    const rail = new THREE.Mesh(railGeo, trackMat);
    rail.position.set(side, 0.2, 0);
    group.add(rail);
  }

  // Glowing ring
  const ringGeo = new THREE.TorusGeometry(5, 0.15, 8, 32);
  const ring = new THREE.Mesh(ringGeo, getEmissiveMaterial(COLORS.gold, 1.5));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  group.add(ring);

  group.position.set(pos.x, pos.y, pos.z);
  scene.add(group);

  // Physics body
  const physicsBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(1.5, 1.5, 3)),
    position: new CANNON.Vec3(pos.x, 2, pos.z),
  });
  world.addBody(physicsBody);

  return {
    position: new THREE.Vector3(pos.x, pos.y, pos.z),
    radius: 8,
    photo: '/photos/train.jpg',
    caption: 'December 28, 2024 🚂',
    ring,
  };
}
