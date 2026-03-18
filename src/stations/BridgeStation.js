import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial, getEmissiveMaterial } from '../utils/Materials.js';

export function createBridgeStation(scene, world) {
  const group = new THREE.Group();
  const pos = { x: -35, y: 0, z: 15 };

  const bridgeColor = 0xc0392b; // International Orange

  // Deck
  const deckGeo = new THREE.BoxGeometry(4, 0.4, 24);
  const deck = new THREE.Mesh(deckGeo, getMaterial(bridgeColor));
  deck.position.y = 3;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Road surface
  const roadGeo = new THREE.BoxGeometry(3.5, 0.05, 23.5);
  const road = new THREE.Mesh(roadGeo, getMaterial(0x555555));
  road.position.y = 3.25;
  group.add(road);

  // Two towers
  for (const tz of [-8, 8]) {
    const towerGroup = new THREE.Group();

    // Twin pillars per tower
    for (const tx of [-1.5, 1.5]) {
      const pillarGeo = new THREE.BoxGeometry(0.5, 10, 0.5);
      const pillar = new THREE.Mesh(pillarGeo, getMaterial(bridgeColor));
      pillar.position.set(tx, 5, 0);
      pillar.castShadow = true;
      towerGroup.add(pillar);
    }

    // Cross bars
    for (const cy of [6, 9]) {
      const crossGeo = new THREE.BoxGeometry(3.5, 0.4, 0.4);
      const cross = new THREE.Mesh(crossGeo, getMaterial(bridgeColor));
      cross.position.set(0, cy, 0);
      towerGroup.add(cross);
    }

    towerGroup.position.z = tz;
    group.add(towerGroup);
  }

  // Cables (simplified catenary using line segments)
  const cableMat = new THREE.LineBasicMaterial({ color: bridgeColor, linewidth: 2 });
  for (const side of [-1.5, 1.5]) {
    const points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const z = -12 + t * 24;
      // Catenary between towers
      let y = 10;
      const zNorm = (z + 12) / 24;
      // Droop between towers
      if (Math.abs(z) <= 8) {
        const localT = (z + 8) / 16;
        y = 10 - Math.sin(localT * Math.PI) * 3;
      } else if (z < -8) {
        const localT = (z + 12) / 4;
        y = 3 + localT * 7;
      } else {
        const localT = (z - 8) / 4;
        y = 10 - localT * 7;
      }
      points.push(new THREE.Vector3(side, y, z));
    }
    const cableGeo = new THREE.BufferGeometry().setFromPoints(points);
    const cable = new THREE.Line(cableGeo, cableMat);
    group.add(cable);
  }

  // Vertical suspender cables
  for (const side of [-1.5, 1.5]) {
    for (let z = -7; z <= 7; z += 2) {
      const localT = (z + 8) / 16;
      const cableY = 10 - Math.sin(localT * Math.PI) * 3;
      const suspGeo = new THREE.CylinderGeometry(0.03, 0.03, cableY - 3.2, 4);
      const susp = new THREE.Mesh(suspGeo, getMaterial(bridgeColor));
      susp.position.set(side, 3.2 + (cableY - 3.2) / 2, z);
      group.add(susp);
    }
  }

  // Railings
  for (const side of [-1.8, 1.8]) {
    const railGeo = new THREE.BoxGeometry(0.08, 0.8, 24);
    const rail = new THREE.Mesh(railGeo, getMaterial(bridgeColor));
    rail.position.set(side, 3.6, 0);
    group.add(rail);

    // Railing posts
    for (let z = -11; z <= 11; z += 2) {
      const postGeo = new THREE.BoxGeometry(0.08, 0.8, 0.08);
      const post = new THREE.Mesh(postGeo, getMaterial(bridgeColor));
      post.position.set(side, 3.6, z);
      group.add(post);
    }
  }

  // Glowing ring
  const ringGeo = new THREE.TorusGeometry(6, 0.15, 8, 32);
  const ring = new THREE.Mesh(ringGeo, getEmissiveMaterial(COLORS.gold, 1.5));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  group.add(ring);

  group.position.set(pos.x, pos.y, pos.z);
  scene.add(group);

  // Physics body for bridge deck
  const physicsBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    position: new CANNON.Vec3(pos.x, 3, pos.z),
  });
  physicsBody.addShape(new CANNON.Box(new CANNON.Vec3(2, 0.2, 12)));
  world.addBody(physicsBody);

  // Tower collision bodies
  for (const tz of [-8, 8]) {
    const towerBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(2, 5, 0.5)),
      position: new CANNON.Vec3(pos.x, 5, pos.z + tz),
    });
    world.addBody(towerBody);
  }

  return {
    position: new THREE.Vector3(pos.x, pos.y, pos.z),
    radius: 10,
    photo: '/photos/golden-gate.jpg',
    caption: 'Us in San Francisco! 🌉',
    ring,
  };
}
