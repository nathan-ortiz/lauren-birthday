import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';

export function createBirthdayText(scene, world) {
  const letters = [];
  const bodies = [];

  const letterSize = 1.2;
  const spacing = 1.6;

  // REVERSED strings — the camera behind the car flips left/right,
  // so reversed input text reads correctly on screen
  const text1 = 'YADHTRIB YPPAH';
  const text2 = 'NERUAL';

  // Row 1: well ahead of spawn
  createTextRow(text1, 0, 0.6, 14, letterSize, spacing, scene, world, letters, bodies);

  // Row 2: closer to car
  createTextRow(text2, 0, 0.6, 10, letterSize * 1.3, spacing * 1.3, scene, world, letters, bodies);

  return { letters, bodies };
}

function createLetterCanvas(letter, bgColorHex, mirror) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  // Colored background
  ctx.fillStyle = `#${bgColorHex.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, 128, 160);

  if (mirror) {
    ctx.save();
    ctx.translate(128, 0);
    ctx.scale(-1, 1);
  }

  // Letter
  ctx.fillStyle = '#dddddd';
  ctx.font = 'bold 100px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 64, 82);

  if (mirror) {
    ctx.restore();
  }

  return canvas;
}

function createTextRow(text, cx, y, cz, size, spacing, scene, world, letters, bodies) {
  const totalWidth = text.length * spacing;
  const startX = cx - totalWidth / 2;
  const blockColors = [COLORS.red, COLORS.gold, COLORS.treeLeavesAlt, 0xff6b8a, 0x4fa4e8, 0xe8a63a];

  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') continue;

    const color = blockColors[i % blockColors.length];

    // +Z face (away from camera initially) — normal canvas
    const frontCanvas = createLetterCanvas(text[i], color, false);
    const frontTex = new THREE.CanvasTexture(frontCanvas);
    const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, flatShading: true });

    // -Z face (faces camera initially) — MIRRORED canvas
    // BoxGeometry -Z face UVs are horizontally flipped, so mirrored canvas displays correctly
    const backCanvas = createLetterCanvas(text[i], color, true);
    const backTex = new THREE.CanvasTexture(backCanvas);
    const backMat = new THREE.MeshStandardMaterial({ map: backTex, flatShading: true });

    const solidMat = new THREE.MeshStandardMaterial({ color, flatShading: true });

    // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
    const materials = [
      solidMat,  // +X
      solidMat,  // -X
      solidMat,  // +Y
      solidMat,  // -Y
      frontMat,  // +Z (away from initial camera — mirrored canvas)
      backMat,   // -Z (faces initial camera — normal canvas)
    ];

    const geo = new THREE.BoxGeometry(size, size * 1.4, size * 0.5);
    const mesh = new THREE.Mesh(geo, materials);
    mesh.castShadow = true;

    // Original left-to-right placement (camera reverses it visually)
    const x = startX + i * spacing;
    mesh.position.set(x, y + size * 0.7, cz);
    scene.add(mesh);

    // Physics body
    const halfExtents = new CANNON.Vec3(size / 2, size * 0.7, size * 0.25);
    const body = new CANNON.Body({
      mass: 3,
      shape: new CANNON.Box(halfExtents),
      position: new CANNON.Vec3(x, y + size * 0.7, cz),
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
