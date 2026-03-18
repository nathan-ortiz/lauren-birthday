import * as THREE from 'three';
import { COLORS } from '../utils/Colors.js';
import { getMaterial } from '../utils/Materials.js';
import { rand } from '../utils/Helpers.js';

export function createTerrain(scene) {
  const size = 120;
  const segments = 60;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grassColor = new THREE.Color(COLORS.grass);
  const grassDarkColor = new THREE.Color(COLORS.grassDark);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // FLAT terrain — physics ground is flat at y=0, so visual must match
    // Only very subtle variation (< 0.1) for visual interest, not enough to clip
    let y = Math.sin(x * 0.15) * Math.cos(z * 0.12) * 0.08;

    // Raised hill for log station (around x:-20, z:-35)
    // This has its own physics sphere collision, so the car rides over it
    const dxHill = x - (-20);
    const dzHill = z - (-35);
    const hillDist = Math.sqrt(dxHill * dxHill + dzHill * dzHill);
    if (hillDist < 18) {
      y += Math.cos((hillDist / 18) * Math.PI * 0.5) * 5;
    }

    // Slight dip for river area (around z:22)
    const riverDist = Math.abs(z - 22);
    if (riverDist < 6) {
      y -= Math.cos((riverDist / 6) * Math.PI * 0.5) * 0.3;
    }

    // Cliff/mountain base rise (around x:70, z:27) — skip cave corridor
    const dxM = x - 70;
    const dzM = z - 24;
    const distM = Math.sqrt(dxM * dxM + dzM * dzM);
    const inCaveCorridor = x > 40 && z > 13 && z < 35;
    if (distM < 30 && !inCaveCorridor) {
      y += Math.cos((distM / 30) * Math.PI * 0.5) * 3;
    }

    pos.setY(i, y);

    // Vertex colors — blend grass shades for visual variety
    const blend = (Math.sin(x * 0.3) * Math.cos(z * 0.2) + 1) * 0.5;
    const c = grassColor.clone().lerp(grassDarkColor, blend * 0.4 + Math.random() * 0.08);

    // Blend to rocky brown near cliff
    if (distM < 30) {
      const rockBlend = 1 - distM / 30;
      c.lerp(new THREE.Color(0x8a7a6a), rockBlend * 0.6);
    }
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

  // Tile paths connecting stations
  createPaths(scene);

  return ground;
}

function createPaths(scene) {
  const tileGeo = new THREE.BoxGeometry(1.2, 0.08, 1.2);
  const tileMat = getMaterial(COLORS.dirt);
  const tileMat2 = getMaterial(COLORS.sand);

  const paths = [
    ...interpolatePath(0, 0, 30, -25, 20),
    ...interpolatePath(0, 0, -35, 22, 25),
    ...interpolatePath(0, 0, 15, 22, 15),
    ...interpolatePath(0, 0, -20, -35, 25), // extends all the way to hill top
  ];

  const placed = new Set();
  paths.forEach(([x, z], i) => {
    const key = `${Math.round(x * 2)},${Math.round(z * 2)}`;
    if (placed.has(key)) return;
    placed.add(key);

    // Compute Y — tiles follow the hill slope if near the log hill
    const hillCx = -20, hillCz = -35;
    const distToHill = Math.sqrt((x - hillCx) ** 2 + (z - hillCz) ** 2);
    let tileY = 0.05;
    if (distToHill < 18) {
      // Hill height at this distance (matches terrain vertex displacement)
      tileY = Math.cos((distToHill / 18) * Math.PI * 0.5) * 5 + 0.05;
    }
    const tile = new THREE.Mesh(tileGeo, i % 3 === 0 ? tileMat2 : tileMat);
    tile.position.set(x, tileY, z);
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

// Returns terrain height at any world XZ position
export function getTerrainHeight(x, z) {
  let y = 0;
  // Log station hill at (-20, -35)
  const dxH = x - (-20);
  const dzH = z - (-35);
  const distH = Math.sqrt(dxH * dxH + dzH * dzH);
  if (distH < 18) {
    y = Math.cos((distH / 18) * Math.PI * 0.5) * 5;
  }
  // Cliff base rise at (70, 27) — flat in cave corridor
  const dxM = x - 70;
  const dzM = z - 27;
  const distM = Math.sqrt(dxM * dxM + dzM * dzM);
  const inCaveCorridor = x > 40 && z > 13 && z < 35;
  if (distM < 30 && !inCaveCorridor) {
    y = Math.max(y, Math.cos((distM / 30) * Math.PI * 0.5) * 3);
  }
  return y;
}
