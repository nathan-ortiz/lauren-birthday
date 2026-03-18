import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial } from '../utils/Materials.js';
import { getTerrainHeight } from '../scene/Terrain.js';

export class Car {
  constructor(scene, world, carMaterial) {
    this.scene = scene;
    this.world = world;
    this.carMaterial = carMaterial;

    this.mesh = this.createMesh();
    scene.add(this.mesh);

    this.wheelMeshes = this.createWheels();
    this.wheelMeshes.forEach((w) => scene.add(w));

    this.setupPhysics();
    this.antenna = null;
    this.createAntenna();
  }

  createMesh() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 3.5), getMaterial(COLORS.carBody));
    body.position.y = 0.5; body.castShadow = true; group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 2), getMaterial(COLORS.carBody));
    cabin.position.set(0, 1.15, -0.2); cabin.castShadow = true; group.add(cabin);

    const wsMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5, flatShading: true });
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.55), wsMat);
    ws.position.set(0, 1.2, 0.85); ws.rotation.x = -0.15; group.add(ws);

    const bMat = getMaterial(COLORS.carAccent);
    const fb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 0.3), bMat);
    fb.position.set(0, 0.3, 1.8); group.add(fb);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 0.3), bMat);
    rb.position.set(0, 0.3, -1.8); group.add(rb);

    const lGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    const hlM = new THREE.MeshStandardMaterial({ color: COLORS.carLights, emissive: COLORS.carLights, emissiveIntensity: 2.0, flatShading: true });
    const hl1 = new THREE.Mesh(lGeo, hlM); hl1.position.set(-0.7, 0.5, 1.85); group.add(hl1);
    const hl2 = new THREE.Mesh(lGeo, hlM); hl2.position.set(0.7, 0.5, 1.85); group.add(hl2);
    const sGeo = new THREE.BoxGeometry(1.8, 0.08, 0.08);
    const s = new THREE.Mesh(sGeo, hlM); s.position.set(0, 0.5, 1.88); group.add(s);

    const tlM = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 1.8, flatShading: true });
    const tl1 = new THREE.Mesh(lGeo, tlM); tl1.position.set(-0.7, 0.5, -1.85); group.add(tl1);
    const tl2 = new THREE.Mesh(lGeo, tlM); tl2.position.set(0.7, 0.5, -1.85); group.add(tl2);
    const ts = new THREE.Mesh(sGeo.clone(), tlM); ts.position.set(0, 0.5, -1.88); group.add(ts);

    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.4), bMat);
    rack.position.set(0, 1.55, -0.2); group.add(rack);

    return group;
  }

  createAntenna() {
    const g = new THREE.Group();
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 4), getMaterial(COLORS.carAccent));
    r.position.y = 0.5; g.add(r);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), getMaterial(COLORS.gold));
    b.position.y = 1.0; g.add(b);
    g.position.set(-0.5, 1.5, -0.8);
    this.mesh.add(g);
    this.antenna = g;
  }

  createWheels() {
    const wheels = [];
    const mat = getMaterial(COLORS.carAccent);
    // Use simple box wheels — no cylinder rotation artifacts
    for (const [x, y, z] of [[-1.05, 0.35, 1.2], [1.05, 0.35, 1.2], [-1.05, 0.35, -1.2], [1.05, 0.35, -1.2]]) {
      const geo = new THREE.BoxGeometry(0.25, 0.7, 0.7);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh._lp = new THREE.Vector3(x, y, z);
      wheels.push(mesh);
    }
    return wheels;
  }

  setupPhysics() {
    this.body = new CANNON.Body({ mass: 30, material: this.carMaterial });
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(1, 0.5, 1.75)), new CANNON.Vec3(0, 0.5, 0));
    this.body.position.set(0, 0.5, 0);
    this.body.linearDamping = 0.4;
    this.body.angularDamping = 0.85;
    this.body.allowSleep = false;
    this.world.addBody(this.body);
  }

  applyInput(forward, backward, left, right) {
    const q = this.body.quaternion;
    const tq = new THREE.Quaternion(q.x, q.y, q.z, q.w);
    const e = new THREE.Euler().setFromQuaternion(tq, 'YXZ');
    const yr = e.y;

    // FORWARD = +Z direction (away from camera, toward headlights)
    const accel = 1.8;
    if (forward) {
      this.body.velocity.x += Math.sin(yr) * accel;
      this.body.velocity.z += Math.cos(yr) * accel;
    } else if (backward) {
      this.body.velocity.x -= Math.sin(yr) * accel * 0.6;
      this.body.velocity.z -= Math.cos(yr) * accel * 0.6;
    } else {
      // Active braking — quickly reduce horizontal velocity for snappy stop
      this.body.velocity.x *= 0.92;
      this.body.velocity.z *= 0.92;
    }

    // Steering
    if (left) {
      this.body.angularVelocity.y = 2.5;
    } else if (right) {
      this.body.angularVelocity.y = -2.5;
    } else {
      this.body.angularVelocity.y *= 0.8;
    }

    // Speed cap
    const v = this.body.velocity;
    const hs = Math.sqrt(v.x * v.x + v.z * v.z);
    if (hs > 18) { const s = 18 / hs; v.x *= s; v.z *= s; }

    // Keep upright
    e.x = 0; e.z = 0;
    tq.setFromEuler(e);
    q.set(tq.x, tq.y, tq.z, tq.w);
    this.body.angularVelocity.x = 0;
    this.body.angularVelocity.z = 0;
  }

  applyJoystickInput(fa, sa) {
    const q = this.body.quaternion;
    const tq = new THREE.Quaternion(q.x, q.y, q.z, q.w);
    const e = new THREE.Euler().setFromQuaternion(tq, 'YXZ');
    const yr = e.y;

    if (Math.abs(fa) > 0.1) {
      this.body.velocity.x += Math.sin(yr) * fa * 1.8;
      this.body.velocity.z += Math.cos(yr) * fa * 1.8;
    } else {
      // Active braking when joystick released — stops drift
      this.body.velocity.x *= 0.9;
      this.body.velocity.z *= 0.9;
    }
    if (Math.abs(sa) > 0.1) {
      this.body.angularVelocity.y = sa * 2.5;
    } else {
      this.body.angularVelocity.y *= 0.8;
    }

    const v = this.body.velocity;
    const hs = Math.sqrt(v.x * v.x + v.z * v.z);
    if (hs > 18) { const s = 18 / hs; v.x *= s; v.z *= s; }

    e.x = 0; e.z = 0; tq.setFromEuler(e);
    q.set(tq.x, tq.y, tq.z, tq.w);
    this.body.angularVelocity.x = 0;
    this.body.angularVelocity.z = 0;
  }

  update() {
    if (this.body.position.y < -10) { this.resetToSpawn(); return; }

    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
    if (up.y < 0.2) {
      this.body.quaternion.set(0, 0, 0, 1);
      this.body.velocity.set(0, 4, 0);
      this.body.angularVelocity.set(0, 0, 0);
      return;
    }

    // Ride terrain height — car follows the ground/hill surface
    const pos = this.body.position;
    const terrainY = getTerrainHeight(pos.x, pos.z);
    const carBottom = terrainY + 0.5; // half the chassis height above terrain
    if (pos.y < carBottom) {
      pos.y = carBottom;
      if (this.body.velocity.y < 0) this.body.velocity.y = 0;
    }

    this.mesh.position.copy(pos);
    this.mesh.quaternion.copy(this.body.quaternion);

    // Wheels follow car body exactly
    for (const w of this.wheelMeshes) {
      const wp = w._lp.clone().applyQuaternion(this.mesh.quaternion).add(this.mesh.position);
      w.position.copy(wp);
      w.quaternion.copy(this.mesh.quaternion);
    }

    if (this.antenna) {
      const sp = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.z ** 2);
      this.antenna.rotation.x = Math.sin(Date.now() * 0.01) * 0.1 * Math.min(sp * 0.05, 1);
    }
  }

  jump() { if (this.body.position.y < 3) this.body.velocity.y = 5; }

  resetToSpawn() {
    this.body.position.set(0, 0.5, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
  }

  addMiniTreasureChest() {
    if (this._hasChest) return;
    this._hasChest = true;

    const g = new THREE.Group();
    const S = 0.35;
    const woodDark = getMaterial(0x5c3518);
    const woodMid = getMaterial(0x7a4a2a);
    const woodLight = getMaterial(0x9b6b3e);
    const gold = getMaterial(0xd4a843);
    const goldShiny = new THREE.MeshStandardMaterial({
      color: 0xf4c542, emissive: 0xf4c542, emissiveIntensity: 0.6, flatShading: true,
    });

    // ── Base box ──
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2 * S, 1.0 * S, 1.4 * S), woodDark);
    base.position.y = 0.5 * S;
    g.add(base);
    // Inner lighter panel
    const inset = new THREE.Mesh(new THREE.BoxGeometry(2.0 * S, 0.8 * S, 1.2 * S), woodMid);
    inset.position.y = 0.55 * S;
    g.add(inset);

    // ── Metal bands ──
    for (const xOff of [-0.8, 0, 0.8]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.08 * S, 1.05 * S, 1.45 * S), gold);
      band.position.set(xOff * S, 0.52 * S, 0);
      g.add(band);
    }

    // ── Lid — opens toward camera (+z direction) ──
    const lidPivot = new THREE.Group();
    // Pivot point at back top edge of base
    lidPivot.position.set(0, 1.0 * S, -0.7 * S);
    const lidGeo = new THREE.CylinderGeometry(
      0.7 * S, 0.7 * S, 2.2 * S, 8, 1, false, 0, Math.PI);
    lidGeo.rotateZ(Math.PI / 2);
    lidGeo.rotateY(Math.PI / 2);
    const lid = new THREE.Mesh(lidGeo, woodLight);
    // Offset so the flat edge sits at the pivot
    lid.position.set(0, 0, 0.7 * S);
    lidPivot.add(lid);
    // Gold band on lid
    const lidBand = new THREE.Mesh(new THREE.BoxGeometry(0.08 * S, 0.08 * S, 1.45 * S), gold);
    lidBand.position.set(0, 0.05 * S, 0.35 * S);
    lidPivot.add(lidBand);
    // Open toward camera: rotate around X so lid swings forward
    lidPivot.rotation.x = 2.0; // ~115° open toward +z (camera)
    g.add(lidPivot);

    // ── Gold treasure spilling out ──
    for (let i = 0; i < 8; i++) {
      const sz = 0.12 * S * (0.7 + Math.random() * 0.6);
      const coin = new THREE.Mesh(new THREE.SphereGeometry(sz, 5, 4), goldShiny);
      coin.position.set(
        (Math.random() - 0.5) * 1.4 * S,
        0.7 * S + Math.random() * 0.4 * S,
        (Math.random() - 0.5) * 0.8 * S,
      );
      g.add(coin);
    }
    // Red gem centerpiece
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13 * S, 0),
      new THREE.MeshStandardMaterial({
        color: 0xe84545, emissive: 0xe84545, emissiveIntensity: 0.4, flatShading: true,
      }),
    );
    gem.position.set(0, 1.05 * S, 0.15 * S);
    g.add(gem);

    // ── Corner studs ──
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.06 * S, 4, 3), gold);
        stud.position.set(sx * 1.0 * S, 0.1 * S, sz * 0.6 * S);
        g.add(stud);
      }
    }

    // Mount on roof rack — rotated so open side faces backward (toward camera)
    g.rotation.y = Math.PI; // face the camera (camera is behind the car)
    g.position.set(0, 1.6, -0.2);
    this.mesh.add(g);
  }

  getPosition() { return this.mesh.position; }
  getRotationY() { return new THREE.Euler().setFromQuaternion(this.mesh.quaternion, 'YXZ').y; }
}
