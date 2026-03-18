import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';
import { getMaterial, getEmissiveMaterial } from '../utils/Materials.js';
import { rand } from '../utils/Helpers.js';

export function createDecorations(scene) {
  // Rocks
  for (let i = 0; i < 40; i++) {
    const size = rand(0.3, 1.0);
    const geo = new THREE.DodecahedronGeometry(size, 0);
    // Deform for organic look
    const pos = geo.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      pos.setX(j, pos.getX(j) + rand(-0.15, 0.15) * size);
      pos.setY(j, pos.getY(j) + rand(-0.1, 0.1) * size);
      pos.setZ(j, pos.getZ(j) + rand(-0.15, 0.15) * size);
    }
    geo.computeVertexNormals();
    const color = Math.random() > 0.5 ? 0x888888 : 0x9a8a7a;
    const rock = new THREE.Mesh(geo, getMaterial(color));
    rock.position.set(rand(-50, 50), size * 0.3, rand(-50, 50));
    rock.rotation.set(rand(0, 1), rand(0, 1), rand(0, 1));
    rock.castShadow = true;
    scene.add(rock);
  }

  // Flowers
  for (let i = 0; i < 60; i++) {
    const flowerGroup = new THREE.Group();
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4);
    const stem = new THREE.Mesh(stemGeo, getMaterial(0x3a8a3a));
    stem.position.y = 0.2;
    flowerGroup.add(stem);

    const petalColor = [0xff6b8a, 0xffb347, 0xff69b4, 0xffd700, 0xff4500][
      Math.floor(Math.random() * 5)
    ];
    const petalGeo = new THREE.SphereGeometry(0.12, 5, 4);
    const petal = new THREE.Mesh(petalGeo, getMaterial(petalColor));
    petal.position.y = 0.45;
    flowerGroup.add(petal);

    flowerGroup.position.set(rand(-50, 50), 0, rand(-50, 50));
    flowerGroup.scale.setScalar(rand(0.8, 1.5));
    scene.add(flowerGroup);
  }

  // Lanterns along paths
  const lanternPositions = [
    [5, 0, -5], [-5, 0, 3], [10, 0, -10], [15, 0, -15],
    [-10, 0, 5], [-15, 0, 8], [-20, 0, 10], [5, 0, 8],
    [8, 0, 10], [-8, 0, -8], [-12, 0, -15], [-15, 0, -20],
  ];
  lanternPositions.forEach(([x, _, z]) => {
    const lantern = createLantern();
    lantern.position.set(x, 0, z);
    scene.add(lantern);
  });

  // Fence boundary
  createFence(scene);
}

function createLantern() {
  const group = new THREE.Group();

  const postGeo = new THREE.BoxGeometry(0.15, 1.5, 0.15);
  const post = new THREE.Mesh(postGeo, getMaterial(COLORS.wood));
  post.position.y = 0.75;
  post.castShadow = true;
  group.add(post);

  const lightGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const light = new THREE.Mesh(lightGeo, getEmissiveMaterial(COLORS.gold, 0.8));
  light.position.y = 1.6;
  group.add(light);

  const capGeo = new THREE.ConeGeometry(0.25, 0.2, 4);
  const cap = new THREE.Mesh(capGeo, getMaterial(COLORS.carAccent));
  cap.position.y = 1.85;
  group.add(cap);

  return group;
}

function createFence(scene) {
  const fenceMat = getMaterial(COLORS.wood);
  const half = 57;

  for (let side = 0; side < 4; side++) {
    for (let i = -half; i <= half; i += 4) {
      const postGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2);
      const post = new THREE.Mesh(postGeo, fenceMat);

      if (side === 0) post.position.set(i, 0.6, -half);
      else if (side === 1) post.position.set(i, 0.6, half);
      else if (side === 2) post.position.set(-half, 0.6, i);
      else post.position.set(half, 0.6, i);

      post.castShadow = true;
      scene.add(post);
    }

    // Rails
    const railGeo = new THREE.BoxGeometry(side < 2 ? half * 2 : 0.1, 0.1, side < 2 ? 0.1 : half * 2);
    const rail1 = new THREE.Mesh(railGeo, fenceMat);
    const rail2 = new THREE.Mesh(railGeo, fenceMat);

    if (side === 0) { rail1.position.set(0, 0.4, -half); rail2.position.set(0, 0.9, -half); }
    else if (side === 1) { rail1.position.set(0, 0.4, half); rail2.position.set(0, 0.9, half); }
    else if (side === 2) { rail1.position.set(-half, 0.4, 0); rail2.position.set(-half, 0.9, 0); }
    else { rail1.position.set(half, 0.4, 0); rail2.position.set(half, 0.9, 0); }

    scene.add(rail1, rail2);
  }
}
