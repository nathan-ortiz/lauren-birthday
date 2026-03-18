import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial } from '../utils/Materials.js';

export function createBirthdayText(scene, world) {
  const letters = [];
  const bodies = [];

  // Build block letters from boxes since TextGeometry needs font loading
  // Each letter is a group of small cubes forming the letter shape
  const text1 = 'HAPPY BIRTHDAY';
  const text2 = 'LAUREN';

  const letterSize = 1.2;
  const spacing = 1.6;

  // Row 1: "HAPPY BIRTHDAY"
  createTextRow(text1, 0, 0.6, 6, letterSize, spacing, scene, world, letters, bodies);

  // Row 2: "LAUREN" - bigger, centered
  createTextRow(text2, 0, 0.6, 3, letterSize * 1.3, spacing * 1.3, scene, world, letters, bodies);

  return { letters, bodies };
}

function createTextRow(text, cx, y, cz, size, spacing, scene, world, letters, bodies) {
  const totalWidth = text.length * spacing;
  const startX = cx - totalWidth / 2;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') continue;

    const group = new THREE.Group();

    // Main letter block
    const geo = new THREE.BoxGeometry(size, size * 1.4, size * 0.5);
    const colors = [COLORS.red, COLORS.gold, COLORS.treeLeavesAlt, 0xff6b8a, 0x4fa4e8, 0xe8a63a];
    const color = colors[i % colors.length];
    const mat = getMaterial(color);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);

    // Letter label on front face using a small canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text[i], 32, 42);
    const tex = new THREE.CanvasTexture(canvas);

    const labelGeo = new THREE.PlaneGeometry(size * 0.8, size * 1.1);
    const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.z = size * 0.26;
    group.add(label);

    // Back label too
    const labelBack = label.clone();
    labelBack.position.z = -size * 0.26;
    labelBack.rotation.y = Math.PI;
    group.add(labelBack);

    const x = startX + i * spacing;
    group.position.set(x, y + size * 0.7, cz);
    scene.add(group);

    // Physics body
    const halfExtents = new CANNON.Vec3(size / 2, size * 0.7, size * 0.25);
    const body = new CANNON.Body({
      mass: 8,
      shape: new CANNON.Box(halfExtents),
      position: new CANNON.Vec3(x, y + size * 0.7, cz),
      linearDamping: 0.4,
      angularDamping: 0.6,
    });
    world.addBody(body);

    letters.push(group);
    bodies.push(body);
  }
}

export function updateBirthdayText(letters, bodies) {
  for (let i = 0; i < letters.length; i++) {
    letters[i].position.copy(bodies[i].position);
    letters[i].quaternion.copy(bodies[i].quaternion);
  }
}
