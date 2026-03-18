import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';

export function createWater(scene) {
  // River winding across the map
  const riverPieces = [];
  const segments = 20;

  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const x = -40 + t * 80;
    const z = 15 + Math.sin(t * Math.PI * 2) * 8;
    const width = 6 + Math.sin(t * Math.PI) * 3;

    const geo = new THREE.PlaneGeometry(width, 5, 8, 8);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.water,
      transparent: true,
      opacity: 0.65,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, -0.2, z);
    mesh.rotation.y = Math.atan2(
      (15 + Math.sin(((i + 1) / segments) * Math.PI * 2) * 8) - z,
      (80 / segments)
    );
    mesh.receiveShadow = true;
    scene.add(mesh);
    riverPieces.push(mesh);
  }

  // Wider section near bridge
  const wideGeo = new THREE.PlaneGeometry(18, 14, 12, 12);
  wideGeo.rotateX(-Math.PI / 2);
  const wideMat = new THREE.MeshStandardMaterial({
    color: COLORS.waterDeep,
    transparent: true,
    opacity: 0.6,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const widePiece = new THREE.Mesh(wideGeo, wideMat);
  widePiece.position.set(-35, -0.25, 15);
  scene.add(widePiece);
  riverPieces.push(widePiece);

  return {
    update(time) {
      riverPieces.forEach((mesh, idx) => {
        const pos = mesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          pos.setY(i, Math.sin(time * 2 + x * 0.5 + z * 0.3 + idx) * 0.15);
        }
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
      });
    },
  };
}
