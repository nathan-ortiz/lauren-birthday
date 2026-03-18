import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';
import { getMaterial } from '../utils/Materials.js';
import { rand } from '../utils/Helpers.js';

export function createTerrain(scene) {
  // Main ground plane with gentle hills
  const size = 120;
  const segments = 80;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grassColor = new THREE.Color(COLORS.grass);
  const grassDarkColor = new THREE.Color(COLORS.grassDark);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Gentle rolling hills
    let y = 0;
    y += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5;
    y += Math.sin(x * 0.1 + 1) * Math.cos(z * 0.08 + 2) * 0.8;

    // Raised hill for log station (around x:-20, z:-35)
    const dxHill = x - (-20);
    const dzHill = z - (-35);
    const hillDist = Math.sqrt(dxHill * dxHill + dzHill * dzHill);
    if (hillDist < 18) {
      y += Math.cos((hillDist / 18) * Math.PI * 0.5) * 6;
    }

    // Lower for river area (around z:22)
    const riverDist = Math.abs(z - 22);
    if (riverDist < 8) {
      y -= Math.cos((riverDist / 8) * Math.PI * 0.5) * 0.5;
    }

    pos.setY(i, y);

    // Vertex colors — blend grass colors
    const blend = (Math.sin(x * 0.3) * Math.cos(z * 0.2) + 1) * 0.5;
    const c = grassColor.clone().lerp(grassDarkColor, blend * 0.5 + Math.random() * 0.1);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
  });
  const ground = new THREE.Mesh(geo, mat);
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid overlay removed — looked too stark, not warm enough

  // Tile paths connecting stations
  createPaths(scene);

  return ground;
}

function createPaths(scene) {
  const tileGeo = new THREE.BoxGeometry(1.2, 0.08, 1.2);
  const tileMat = getMaterial(COLORS.dirt);
  const tileMat2 = getMaterial(COLORS.sand);

  const paths = [
    // From spawn (0, 0) to Train Station (30, -25)
    ...interpolatePath(0, 0, 30, -25, 20),
    // From spawn to Bridge (-35, 22)
    ...interpolatePath(0, 0, -35, 22, 25),
    // From spawn to Kayak (15, 22)
    ...interpolatePath(0, 0, 15, 22, 15),
    // From spawn to Log Hill (-20, -35)
    ...interpolatePath(0, 0, -20, -30, 20),
  ];

  // Deduplicate tiles that overlap near the center (prevents Z-fighting flicker)
  const placed = new Set();
  paths.forEach(([x, z], i) => {
    const key = `${Math.round(x * 2)},${Math.round(z * 2)}`;
    if (placed.has(key)) return;
    placed.add(key);

    const tile = new THREE.Mesh(tileGeo, i % 3 === 0 ? tileMat2 : tileMat);
    tile.position.set(x, 0.05 + getTerrainHeight(x, z), z);
    tile.rotation.y = rand(-0.1, 0.1);
    tile.receiveShadow = true;
    scene.add(tile);
  });
}

function interpolatePath(x1, z1, x2, z2, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t + Math.sin(t * Math.PI * 2) * 1.5;
    const z = z1 + (z2 - z1) * t + Math.cos(t * Math.PI * 3) * 1.0;
    pts.push([x, z]);
  }
  return pts;
}

export function getTerrainHeight(x, z) {
  let y = 0;
  y += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5;
  y += Math.sin(x * 0.1 + 1) * Math.cos(z * 0.08 + 2) * 0.8;

  const dxHill = x - (-20);
  const dzHill = z - (-35);
  const hillDist = Math.sqrt(dxHill * dxHill + dzHill * dzHill);
  if (hillDist < 18) {
    y += Math.cos((hillDist / 18) * Math.PI * 0.5) * 6;
  }

  return y;
}
