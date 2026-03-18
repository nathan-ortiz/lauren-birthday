import * as THREE from 'three';
import { rand } from '../utils/Helpers.js';

export function createParticles(scene) {
  // Warm golden firefly-like motes — sparse and subtle
  const count = 60;
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-40, 40);
    positions[i * 3 + 1] = rand(2, 8);
    positions[i * 3 + 2] = rand(-40, 40);
    velocities.push({
      x: rand(-0.005, 0.005),
      y: rand(0.005, 0.02),
      z: rand(-0.005, 0.005),
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffcc44, // warm amber-gold
    size: 0.08,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  return {
    update(delta) {
      const pos = geo.attributes.position;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + velocities[i].y;
        let x = pos.getX(i) + velocities[i].x + Math.sin(Date.now() * 0.0005 + i) * 0.003;
        let z = pos.getZ(i) + velocities[i].z;

        if (y > 12) {
          y = 2;
          x = rand(-40, 40);
          z = rand(-40, 40);
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
  // Soft pink petals near cherry blossoms — gentle drift down
  const count = 25;
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-12, -2);
    positions[i * 3 + 1] = rand(3, 8);
    positions[i * 3 + 2] = rand(-6, 6);
    velocities.push({
      x: rand(-0.01, 0.01),
      y: rand(-0.015, -0.005),
      z: rand(-0.01, 0.01),
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffa0b0,
    size: 0.12,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  return {
    update(delta) {
      const pos = geo.attributes.position;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + velocities[i].y;
        let x = pos.getX(i) + velocities[i].x + Math.sin(Date.now() * 0.0008 + i) * 0.004;
        let z = pos.getZ(i) + velocities[i].z;

        if (y < 0.1) {
          y = rand(5, 8);
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
