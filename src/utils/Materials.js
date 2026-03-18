import * as THREE from 'three';
import { COLORS } from './Colors.js';

const cache = {};

export function getMaterial(color, opts = {}) {
  const key = `${color}-${JSON.stringify(opts)}`;
  if (cache[key]) return cache[key];
  const mat = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    ...opts,
  });
  cache[key] = mat;
  return mat;
}

export function getEmissiveMaterial(color, intensity = 0.5) {
  return getMaterial(color, { emissive: color, emissiveIntensity: intensity });
}
