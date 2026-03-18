import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createWater(scene) {
  const riverPieces = [];

  // Create a full, continuous river using overlapping wide planes
  // River runs from west to east at z≈22, winding slightly
  const riverLength = 100;
  const riverWidth = 10;
  const segments = 30;

  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const x = -50 + t * riverLength;
    const z = 22 + Math.sin(t * Math.PI * 2.5) * 6;

    // Each piece is wide enough to overlap neighbors for a continuous look
    const geo = new THREE.PlaneGeometry(riverLength / segments + 4, riverWidth, 6, 6);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.water,
      transparent: true,
      opacity: 0.7,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    const nextZ = 22 + Math.sin(((i + 1) / segments) * Math.PI * 2.5) * 6;
    const angle = Math.atan2(nextZ - z, riverLength / segments);
    mesh.position.set(x, -0.15, z);
    mesh.rotation.y = angle;
    mesh.receiveShadow = true;
    scene.add(mesh);
    riverPieces.push(mesh);
  }

  // Wider pool section near bridge (x=-35, z=22)
  const poolGeo = new THREE.PlaneGeometry(22, 16, 10, 10);
  poolGeo.rotateX(-Math.PI / 2);
  const poolMat = new THREE.MeshStandardMaterial({
    color: COLORS.waterDeep,
    transparent: true,
    opacity: 0.65,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.position.set(-35, -0.18, 22);
  scene.add(pool);
  riverPieces.push(pool);

  return {
    update(time) {
      // Gentle wave animation
      for (const mesh of riverPieces) {
        const pos = mesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          pos.setY(i, Math.sin(time * 2 + x * 0.3 + z * 0.2) * 0.12);
        }
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
      }
    },
  };
}
