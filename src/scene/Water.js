import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createWater(scene) {
  const riverPieces = [];

  // Dense, continuous river — 50 overlapping segments
  const segments = 50;

  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const x = -55 + t * 110;
    const z = 22 + Math.sin(t * Math.PI * 2.5) * 5;
    const nextT = (i + 1) / segments;
    const nextX = -55 + nextT * 110;
    const nextZ = 22 + Math.sin(nextT * Math.PI * 2.5) * 5;

    // Wide pieces that overlap heavily — no gaps
    const pieceWidth = 110 / segments + 6;
    const geo = new THREE.PlaneGeometry(pieceWidth, 12, 4, 4);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.water,
      transparent: true,
      opacity: 0.7,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    const angle = Math.atan2(nextZ - z, nextX - x);
    mesh.position.set(x, -0.15, z);
    mesh.rotation.y = angle;
    mesh.receiveShadow = true;
    scene.add(mesh);
    riverPieces.push(mesh);
  }

  // Wider pool at bridge
  const poolGeo = new THREE.PlaneGeometry(24, 18, 8, 8);
  poolGeo.rotateX(-Math.PI / 2);
  const pool = new THREE.Mesh(poolGeo, new THREE.MeshStandardMaterial({
    color: COLORS.waterDeep,
    transparent: true,
    opacity: 0.65,
    flatShading: true,
    side: THREE.DoubleSide,
  }));
  pool.position.set(-35, -0.18, 22);
  scene.add(pool);
  riverPieces.push(pool);

  return {
    update(time) {
      for (const mesh of riverPieces) {
        const pos = mesh.geometry.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const px = pos.getX(j);
          const pz = pos.getZ(j);
          pos.setY(j, Math.sin(time * 1.5 + px * 0.4 + pz * 0.3) * 0.1);
        }
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
      }
    },
  };
}
