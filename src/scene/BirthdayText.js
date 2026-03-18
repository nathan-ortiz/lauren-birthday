import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';

export function createBirthdayText(scene, world) {
  const letters = [];
  const bodies = [];

  const text1 = 'HAPPY BIRTHDAY';
  const text2 = 'LAUREN';

  const letterSize = 1.2;
  const spacing = 1.6;

  // Row 1: pushed well ahead of spawn so player sees full message
  createTextRow(text1, 0, 0.6, 14, letterSize, spacing, scene, world, letters, bodies);

  // Row 2: "LAUREN" - bigger, centered, closer to car
  createTextRow(text2, 0, 0.6, 10, letterSize * 1.3, spacing * 1.3, scene, world, letters, bodies);

  return { letters, bodies };
}

function createLetterCanvas(letter, bgColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  // Colored background
  ctx.fillStyle = `#${bgColor.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, 128, 160);
  // White letter
  ctx.fillStyle = '#dddddd'; // slightly off-white to avoid bloom trigger
  ctx.font = 'bold 100px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 64, 82);
  return canvas;
}

function createTextRow(text, cx, y, cz, size, spacing, scene, world, letters, bodies) {
  const totalWidth = text.length * spacing;
  const blockColors = [COLORS.red, COLORS.gold, COLORS.treeLeavesAlt, 0xff6b8a, 0x4fa4e8, 0xe8a63a];

  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') continue;

    const color = blockColors[i % blockColors.length];

    // Create canvas texture with colored bg + letter
    const canvas = createLetterCanvas(text[i], color);
    const texture = new THREE.CanvasTexture(canvas);

    // Use 6 materials for the BoxGeometry (one per face)
    // Face order: +X, -X, +Y, -Y, +Z, -Z
    const solidMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    const frontMat = new THREE.MeshStandardMaterial({ map: texture, flatShading: true });

    // For the -Z face (camera-facing), create a mirrored canvas
    const mirrorCanvas = createLetterCanvas(text[i], color);
    const mirrorCtx = mirrorCanvas.getContext('2d');
    // Re-draw mirrored
    mirrorCtx.clearRect(0, 0, 128, 160);
    mirrorCtx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    mirrorCtx.fillRect(0, 0, 128, 160);
    mirrorCtx.save();
    mirrorCtx.translate(128, 0);
    mirrorCtx.scale(-1, 1);
    mirrorCtx.fillStyle = '#dddddd';
    mirrorCtx.font = 'bold 100px sans-serif';
    mirrorCtx.textAlign = 'center';
    mirrorCtx.textBaseline = 'middle';
    mirrorCtx.fillText(text[i], 64, 82);
    mirrorCtx.restore();
    const mirrorTex = new THREE.CanvasTexture(mirrorCanvas);
    const backMat = new THREE.MeshStandardMaterial({ map: mirrorTex, flatShading: true });

    // Face order: +X, -X, +Y, -Y, +Z, -Z
    const materials = [
      solidMat,  // +X (right side)
      solidMat,  // -X (left side)
      solidMat,  // +Y (top)
      solidMat,  // -Y (bottom)
      frontMat,  // +Z (front, away from initial camera)
      backMat,   // -Z (back, faces initial camera)
    ];

    const geo = new THREE.BoxGeometry(size, size * 1.4, size * 0.5);
    const mesh = new THREE.Mesh(geo, materials);
    mesh.castShadow = true;

    // Reversed X so letters read left-to-right from camera behind car
    const x = cx + (totalWidth - spacing) / 2 - i * spacing;
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
