import * as THREE from 'three';
import { rand } from '../utils/Helpers.js';

export function createParticles(scene) {
  const count = 200;
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-50, 50);
    positions[i * 3 + 1] = rand(1, 15);
    positions[i * 3 + 2] = rand(-50, 50);
    velocities.push({
      x: rand(-0.01, 0.01),
      y: rand(0.01, 0.04),
      z: rand(-0.01, 0.01),
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  return {
    update(delta) {
      const pos = geo.attributes.position;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + velocities[i].y;
        let x = pos.getX(i) + velocities[i].x;
        let z = pos.getZ(i) + velocities[i].z;

        // Reset particles that go too high
        if (y > 18) {
          y = 1;
          x = rand(-50, 50);
          z = rand(-50, 50);
        }

        pos.setX(i, x);
        pos.setY(i, y);
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    },
  };
}

export function createPetalParticles(scene) {
  const count = 50;
  const positions = new Float32Array(count * 3);
  const velocities = [];

  // Near cherry blossom area (spawn)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-12, -2);
    positions[i * 3 + 1] = rand(3, 10);
    positions[i * 3 + 2] = rand(-6, 6);
    velocities.push({
      x: rand(-0.02, 0.02),
      y: rand(-0.02, -0.005),
      z: rand(-0.02, 0.02),
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffb6c1,
    size: 0.2,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  return {
    update(delta) {
      const pos = geo.attributes.position;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + velocities[i].y;
        let x = pos.getX(i) + velocities[i].x + Math.sin(Date.now() * 0.001 + i) * 0.005;
        let z = pos.getZ(i) + velocities[i].z;

        if (y < 0.1) {
          y = rand(6, 10);
          x = rand(-12, -2);
          z = rand(-6, 6);
        }

        pos.setX(i, x);
        pos.setY(i, y);
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    },
  };
}
