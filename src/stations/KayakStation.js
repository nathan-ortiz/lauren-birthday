import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial, getEmissiveMaterial } from '../utils/Materials.js';

export function createKayakStation(scene, world) {
  const group = new THREE.Group();
  const pos = { x: 15, y: -0.1, z: 15 };

  // Kayak hull — elongated tapered shape
  const hullShape = new THREE.Shape();
  hullShape.moveTo(0, -2.5);
  hullShape.quadraticCurveTo(0.7, -1.5, 0.6, 0);
  hullShape.quadraticCurveTo(0.7, 1.5, 0, 2.5);
  hullShape.quadraticCurveTo(-0.7, 1.5, -0.6, 0);
  hullShape.quadraticCurveTo(-0.7, -1.5, 0, -2.5);

  const extrudeSettings = { depth: 0.6, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 2 };
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
  hullGeo.rotateX(-Math.PI / 2);
  hullGeo.translate(0, 0.3, 0);
  const hull = new THREE.Mesh(hullGeo, getMaterial(0xf5a623)); // bright orange
  hull.castShadow = true;
  group.add(hull);

  // Interior (darker)
  const innerGeo = new THREE.BoxGeometry(0.8, 0.15, 3.5);
  const inner = new THREE.Mesh(innerGeo, getMaterial(0xd4871d));
  inner.position.y = 0.55;
  group.add(inner);

  // Seat
  const seatGeo = new THREE.BoxGeometry(0.5, 0.12, 0.6);
  const seat = new THREE.Mesh(seatGeo, getMaterial(COLORS.carAccent));
  seat.position.y = 0.65;
  group.add(seat);

  // Paddle
  const paddleGroup = new THREE.Group();
  const shaftGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 6);
  shaftGeo.rotateZ(Math.PI / 2);
  const shaft = new THREE.Mesh(shaftGeo, getMaterial(COLORS.wood));
  paddleGroup.add(shaft);

  const bladeGeo = new THREE.BoxGeometry(0.5, 0.02, 0.3);
  const bladeMat = getMaterial(COLORS.carAccent);
  const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
  blade1.position.x = 1.3;
  paddleGroup.add(blade1);
  const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
  blade2.position.x = -1.3;
  blade2.rotation.y = Math.PI / 2;
  paddleGroup.add(blade2);

  paddleGroup.position.set(0, 1.0, 0);
  paddleGroup.rotation.z = 0.15;
  group.add(paddleGroup);

  // Glowing ring
  const ringGeo = new THREE.TorusGeometry(4, 0.08, 8, 32);
  const ring = new THREE.Mesh(ringGeo, getEmissiveMaterial(COLORS.gold, 0.6));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  group.add(ring);

  group.position.set(pos.x, pos.y, pos.z);
  scene.add(group);

  // Physics body
  const physicsBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(0.6, 0.5, 2.5)),
    position: new CANNON.Vec3(pos.x, 0.5, pos.z),
  });
  world.addBody(physicsBody);

  return {
    position: new THREE.Vector3(pos.x, pos.y, pos.z),
    radius: 7,
    photo: '/photos/kayak.jpg',
    caption: 'Us kayaking! 🛶',
    ring,
    // Bobbing animation
    group,
    update(time) {
      group.position.y = pos.y + Math.sin(time * 1.5) * 0.2;
      group.rotation.z = Math.sin(time * 0.8) * 0.03;
    },
  };
}
