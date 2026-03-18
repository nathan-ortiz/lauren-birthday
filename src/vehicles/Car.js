import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial } from '../utils/Materials.js';

export class Car {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;

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

    const bodyGeo = new THREE.BoxGeometry(2, 0.8, 3.5);
    const body = new THREE.Mesh(bodyGeo, getMaterial(COLORS.carBody));
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const cabinGeo = new THREE.BoxGeometry(1.7, 0.7, 2);
    const cabin = new THREE.Mesh(cabinGeo, getMaterial(COLORS.carBody));
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    const windshieldMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5, flatShading: true });
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.55), windshieldMat);
    windshield.position.set(0, 1.2, 0.85);
    windshield.rotation.x = -0.15;
    group.add(windshield);

    const bumperMat = getMaterial(COLORS.carAccent);
    const fb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 0.3), bumperMat);
    fb.position.set(0, 0.3, 1.8); group.add(fb);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 0.3), bumperMat);
    rb.position.set(0, 0.3, -1.8); group.add(rb);

    const lightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    const hlMat = new THREE.MeshStandardMaterial({ color: COLORS.carLights, emissive: COLORS.carLights, emissiveIntensity: 2.0, flatShading: true });
    const hl1 = new THREE.Mesh(lightGeo, hlMat); hl1.position.set(-0.7, 0.5, 1.85); group.add(hl1);
    const hl2 = new THREE.Mesh(lightGeo, hlMat); hl2.position.set(0.7, 0.5, 1.85); group.add(hl2);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.08), hlMat);
    strip.position.set(0, 0.5, 1.88); group.add(strip);

    const tlMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 1.8, flatShading: true });
    const tl1 = new THREE.Mesh(lightGeo, tlMat); tl1.position.set(-0.7, 0.5, -1.85); group.add(tl1);
    const tl2 = new THREE.Mesh(lightGeo, tlMat); tl2.position.set(0.7, 0.5, -1.85); group.add(tl2);
    const tlStrip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.08), tlMat);
    tlStrip.position.set(0, 0.5, -1.88); group.add(tlStrip);

    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.4), getMaterial(COLORS.carAccent));
    rack.position.set(0, 1.55, -0.2); group.add(rack);

    return group;
  }

  createAntenna() {
    const group = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 4), getMaterial(COLORS.carAccent));
    rod.position.set(0, 0.5, 0); group.add(rod);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), getMaterial(COLORS.gold));
    ball.position.set(0, 1.0, 0); group.add(ball);
    group.position.set(-0.5, 1.5, -0.8);
    this.mesh.add(group);
    this.antenna = group;
  }

  createWheels() {
    const wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = getMaterial(COLORS.carAccent);
    const positions = [[-0.85, 0.4, 1.2], [0.85, 0.4, 1.2], [-0.85, 0.4, -1.2], [0.85, 0.4, -1.2]];
    for (const [x, y, z] of positions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.castShadow = true;
      wheel._localPos = new THREE.Vector3(x, y, z);
      wheels.push(wheel);
    }
    return wheels;
  }

  setupPhysics() {
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 1.75));
    this.body = new CANNON.Body({ mass: 30 });
    this.body.addShape(chassisShape, new CANNON.Vec3(0, 0.5, 0));
    this.body.position.set(0, 1, 0);
    this.body.linearDamping = 0.35;
    this.body.angularDamping = 0.8;
    this.body.allowSleep = false;
    this.world.addBody(this.body);
  }

  applyInput(forward, backward, left, right) {
    const q = this.body.quaternion;
    const threeQ = new THREE.Quaternion(q.x, q.y, q.z, q.w);
    const euler = new THREE.Euler().setFromQuaternion(threeQ, 'YXZ');
    const yRot = euler.y;

    // Drive force — strong enough to feel responsive
    const driveForce = 800;
    if (forward) {
      this.body.velocity.x += -Math.sin(yRot) * driveForce / 30 * (1 / 60);
      this.body.velocity.z += -Math.cos(yRot) * driveForce / 30 * (1 / 60);
    } else if (backward) {
      this.body.velocity.x += Math.sin(yRot) * driveForce * 0.5 / 30 * (1 / 60);
      this.body.velocity.z += Math.cos(yRot) * driveForce * 0.5 / 30 * (1 / 60);
    }

    // Steering — set angular velocity directly
    if (left) {
      this.body.angularVelocity.y = 2.5;
    } else if (right) {
      this.body.angularVelocity.y = -2.5;
    } else {
      this.body.angularVelocity.y *= 0.85;
    }

    // Speed cap
    const vel = this.body.velocity;
    const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (hSpeed > 18) {
      vel.x *= 18 / hSpeed;
      vel.z *= 18 / hSpeed;
    }

    // Keep upright — lock X/Z rotation
    euler.x = 0;
    euler.z = 0;
    threeQ.setFromEuler(euler);
    q.set(threeQ.x, threeQ.y, threeQ.z, threeQ.w);
    this.body.angularVelocity.x = 0;
    this.body.angularVelocity.z = 0;
  }

  applyJoystickInput(forwardAmount, steerAmount) {
    const q = this.body.quaternion;
    const threeQ = new THREE.Quaternion(q.x, q.y, q.z, q.w);
    const euler = new THREE.Euler().setFromQuaternion(threeQ, 'YXZ');
    const yRot = euler.y;

    if (Math.abs(forwardAmount) > 0.1) {
      const f = -forwardAmount * 800 / 30 * (1 / 60);
      this.body.velocity.x += Math.sin(yRot) * f;
      this.body.velocity.z += Math.cos(yRot) * f;
    }
    if (Math.abs(steerAmount) > 0.1) {
      this.body.angularVelocity.y = steerAmount * 2.5;
    } else {
      this.body.angularVelocity.y *= 0.85;
    }

    const vel = this.body.velocity;
    const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (hSpeed > 18) { vel.x *= 18 / hSpeed; vel.z *= 18 / hSpeed; }

    euler.x = 0; euler.z = 0;
    threeQ.setFromEuler(euler);
    q.set(threeQ.x, threeQ.y, threeQ.z, threeQ.w);
    this.body.angularVelocity.x = 0;
    this.body.angularVelocity.z = 0;
  }

  update() {
    if (this.body.position.y < -10) { this.resetToSpawn(); return; }

    // Auto-upright
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
    if (up.y < 0.2) {
      this.body.quaternion.set(0, 0, 0, 1);
      this.body.velocity.set(0, 4, 0);
      this.body.angularVelocity.set(0, 0, 0);
      return;
    }

    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);

    // Position wheels attached to car body — wheels just follow, no spin
    for (const wheel of this.wheelMeshes) {
      const wp = wheel._localPos.clone().applyQuaternion(this.mesh.quaternion).add(this.mesh.position);
      wheel.position.copy(wp);
      // Only apply Y rotation so wheels stay oriented correctly (Z-rotated geometry)
      const yOnly = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, new THREE.Euler().setFromQuaternion(this.mesh.quaternion, 'YXZ').y, 0)
      );
      wheel.quaternion.copy(yOnly);
    }

    if (this.antenna) {
      const vel = this.body.velocity;
      const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      this.antenna.rotation.x = Math.sin(Date.now() * 0.01) * 0.1 * Math.min(speed * 0.05, 1);
      this.antenna.rotation.z = Math.cos(Date.now() * 0.013) * 0.08 * Math.min(speed * 0.05, 1);
    }
  }

  jump() {
    if (this.body.position.y < 3) this.body.velocity.y = 5;
  }

  resetToSpawn() {
    this.body.position.set(0, 1, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
  }

  getPosition() { return this.mesh.position; }

  getRotationY() {
    return new THREE.Euler().setFromQuaternion(this.mesh.quaternion, 'YXZ').y;
  }
}
