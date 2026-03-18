import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';

export function createBirthdayText(scene, world) {
  const letters = [];
  const bodies = [];

  const letterSize = 1.2;
  const spacing = 1.6;

  // REVERSED strings — camera's right direction is -X, so reversed input reads correctly
  // Text placed BEHIND the car (negative Z) on dry land, like Bruno Simon's layout
  createTextRow('YADHTRIB YPPAH', 0, 0, -6, letterSize, spacing, scene, world, letters, bodies);
  createTextRow('NERUAL', 0, 0, -3, letterSize * 1.3, spacing * 1.3, scene, world, letters, bodies);

  return { letters, bodies };
}

function createTextRow(text, cx, y, cz, size, spacing, scene, world, letters, bodies) {
  const totalWidth = text.length * spacing;
  const startX = cx - totalWidth / 2;
  const blockColors = [COLORS.red, COLORS.gold, COLORS.treeLeavesAlt, 0xff6b8a, 0x4fa4e8, 0xe8a63a];

  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') continue;

    const color = blockColors[i % blockColors.length];
    const group = new THREE.Group();

    // Solid colored block
    const geo = new THREE.BoxGeometry(size, size * 1.4, size * 0.5);
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);

    // Letter as a Sprite — always faces camera, never mirrored
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 160);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text[i], 64, 82);
    const texture = new THREE.CanvasTexture(canvas);

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false, // render on top of block so always visible
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(size * 0.9, size * 1.2, 1);
    sprite.position.set(0, 0, 0);
    group.add(sprite);

    const x = startX + i * spacing;
    // Blocks sit ON the ground — center at half-height above y=0
    const blockY = y + size * 0.7;
    group.position.set(x, blockY, cz);
    scene.add(group);

    // Physics body
    const halfExtents = new CANNON.Vec3(size / 2, size * 0.7, size * 0.25);
    const body = new CANNON.Body({
      mass: 3,
      shape: new CANNON.Box(halfExtents),
      position: new CANNON.Vec3(x, blockY, cz),
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
