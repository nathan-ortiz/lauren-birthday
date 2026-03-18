import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial } from '../utils/Materials.js';
import { rand } from '../utils/Helpers.js';

function createRoundTree(height = 4, color = COLORS.treeLeaves) {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, height * 0.4, 6);
  const trunk = new THREE.Mesh(trunkGeo, getMaterial(COLORS.treeTrunk));
  trunk.position.y = height * 0.2;
  trunk.castShadow = true;
  group.add(trunk);

  const foliageGeo = new THREE.DodecahedronGeometry(height * 0.35, 1);
  const foliageMat = getMaterial(color);
  const foliage1 = new THREE.Mesh(foliageGeo, foliageMat);
  foliage1.position.y = height * 0.6;
  foliage1.castShadow = true;
  group.add(foliage1);

  const foliage2Geo = new THREE.DodecahedronGeometry(height * 0.25, 1);
  const foliage2 = new THREE.Mesh(foliage2Geo, foliageMat);
  foliage2.position.set(0.5, height * 0.75, 0.3);
  foliage2.castShadow = true;
  group.add(foliage2);

  return group;
}

function createPineTree(height = 5) {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, height * 0.3, 5);
  const trunk = new THREE.Mesh(trunkGeo, getMaterial(COLORS.treeTrunk));
  trunk.position.y = height * 0.15;
  trunk.castShadow = true;
  group.add(trunk);

  const layers = 3;
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const radius = height * 0.3 * (1 - t * 0.3);
    const coneH = height * 0.35;
    const coneGeo = new THREE.ConeGeometry(radius, coneH, 6);
    const cone = new THREE.Mesh(coneGeo, getMaterial(0x2d7a2d));
    cone.position.y = height * 0.3 + i * coneH * 0.6;
    cone.castShadow = true;
    group.add(cone);
  }

  return group;
}

function createBush(size = 1, color = COLORS.treeLeaves) {
  const geo = new THREE.DodecahedronGeometry(size, 1);
  const mesh = new THREE.Mesh(geo, getMaterial(color));
  mesh.position.y = size * 0.5;
  mesh.castShadow = true;
  return mesh;
}

export function createTrees(scene, world) {
  const trees = [];

  // Station positions to avoid
  const avoid = [
    [0, 0],       // spawn
    [30, -25],    // train
    [-35, 15],    // bridge
    [15, 15],     // kayak
    [-20, -35],   // log hill
  ];

  const treeCount = 120;

  for (let i = 0; i < treeCount; i++) {
    const x = rand(-55, 55);
    const z = rand(-55, 55);

    // Skip if too close to stations or river
    const tooClose = avoid.some(([ax, az]) => {
      const d = Math.sqrt((x - ax) ** 2 + (z - az) ** 2);
      return d < 10;
    });
    if (tooClose) continue;
    if (Math.abs(z - 15) < 6 && x > -45 && x < 45) continue; // river

    const scale = rand(0.7, 1.3);
    let tree;
    const r = Math.random();

    if (r < 0.15) {
      // Cherry blossom
      tree = createRoundTree(rand(3, 5), COLORS.treeLeavesAlt);
    } else if (r < 0.35) {
      tree = createPineTree(rand(4, 7));
    } else if (r < 0.5) {
      tree = createRoundTree(rand(3, 5), COLORS.treeLeavesAutumn);
    } else if (r < 0.7) {
      tree = createBush(rand(0.6, 1.2));
    } else {
      tree = createRoundTree(rand(3, 6));
    }

    tree.scale.setScalar(scale);
    tree.position.set(x, 0, z);
    tree.rotation.y = rand(0, Math.PI * 2);
    scene.add(tree);
    trees.push(tree);

    // Add trunk collision body (cylinder) so car bounces off trees
    if (world && r < 0.7) { // skip bushes (r >= 0.7)
      const trunkBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Cylinder(0.3 * scale, 0.3 * scale, 2 * scale, 6),
        position: new CANNON.Vec3(x, 1 * scale, z),
      });
      world.addBody(trunkBody);
    }
  }

  // Cherry blossom cluster near spawn
  for (let i = 0; i < 6; i++) {
    const tree = createRoundTree(rand(3.5, 5.5), COLORS.treeLeavesAlt);
    const bx = rand(-12, -5);
    const bz = rand(-8, 2);
    tree.position.set(bx, 0, bz);
    tree.rotation.y = rand(0, Math.PI * 2);
    scene.add(tree);
    trees.push(tree);

    if (world) {
      const trunkBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Cylinder(0.3, 0.3, 2, 6),
        position: new CANNON.Vec3(bx, 1, bz),
      });
      world.addBody(trunkBody);
    }
  }

  return trees;
}
