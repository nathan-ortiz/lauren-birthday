import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';

export function createBirthdayText(scene, world) {
  const letters = [];
  const bodies = [];

  const letterSize = 1.2;
  const spacing = 1.6;

  // Text placed IN FRONT of the car (positive Z), on dry land before the river
  // Reversed strings because camera right = -X flips left-right reading order
  createTextRow('YADHTRIB YPPAH', 0, 0, 8, letterSize, spacing, scene, world, letters, bodies);
  createTextRow('NERUAL', 0, 0, 5, letterSize * 1.3, spacing * 1.3, scene, world, letters, bodies);

  return { letters, bodies };
}

function createTextRow(text, cx, y, cz, size, spacing, scene, world, letters, bodies) {
  const totalWidth = text.length * spacing;
  const startX = cx - totalWidth / 2;
  const blockColors = [COLORS.red, COLORS.gold, COLORS.treeLeavesAlt, 0xff6b8a, 0x4fa4e8, 0xe8a63a];

  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') continue;

    const color = blockColors[i % blockColors.length];

    // Create canvas with colored background + letter
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 128, 160);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 100px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text[i], 64, 82);
    const texture = new THREE.CanvasTexture(canvas);

    // Solid color material for most faces, textured only on -Z face (faces car/user)
    const solidMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    const faceMat = new THREE.MeshStandardMaterial({ map: texture, flatShading: true });

    // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
    // The -Z face (index 5) faces toward the car/camera at spawn
    const materials = [solidMat, solidMat, solidMat, solidMat, solidMat, faceMat];
    const geo = new THREE.BoxGeometry(size, size * 1.4, size * 0.5);
    const mesh = new THREE.Mesh(geo, materials);
    mesh.castShadow = true;

    const x = startX + i * spacing;
    const blockY = y + size * 0.7;
    mesh.position.set(x, blockY, cz);
    scene.add(mesh);

    // Physics body
    const body = new CANNON.Body({
      mass: 3,
      shape: new CANNON.Box(new CANNON.Vec3(size / 2, size * 0.7, size * 0.25)),
      position: new CANNON.Vec3(x, blockY, cz),
      linearDamping: 0.4,
      angularDamping: 0.6,
    });
    world.addBody(body);

    letters.push(mesh);
    bodies.push(body);
  }
}

export function updateBirthdayText(letters, bodies) {
  for (let i = 0; i < letters.length; i++) {
    letters[i].position.copy(bodies[i].position);
    letters[i].quaternion.copy(bodies[i].quaternion);
  }
}
