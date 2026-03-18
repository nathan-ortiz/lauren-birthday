import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial } from '../utils/Materials.js';

export class Car {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.steering = 0;
    this.speed = 0;

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

    const windshieldGeo = new THREE.PlaneGeometry(1.5, 0.55);
    const windshieldMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.5, flatShading: true,
    });
    const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
    windshield.position.set(0, 1.2, 0.85);
    windshield.rotation.x = -0.15;
    group.add(windshield);

    const bumperGeo = new THREE.BoxGeometry(2.1, 0.25, 0.3);
    const bumperMat = getMaterial(COLORS.carAccent);
    group.add(Object.assign(new THREE.Mesh(bumperGeo, bumperMat), { position: new THREE.Vector3(0, 0.3, 1.8) }));
    group.add(Object.assign(new THREE.Mesh(bumperGeo, bumperMat), { position: new THREE.Vector3(0, 0.3, -1.8) }));

    const lightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    const hlMat = new THREE.MeshStandardMaterial({ color: COLORS.carLights, emissive: COLORS.carLights, emissiveIntensity: 2.0, flatShading: true });
    group.add(Object.assign(new THREE.Mesh(lightGeo, hlMat), { position: new THREE.Vector3(-0.7, 0.5, 1.85) }));
    group.add(Object.assign(new THREE.Mesh(lightGeo, hlMat), { position: new THREE.Vector3(0.7, 0.5, 1.85) }));

    const stripGeo = new THREE.BoxGeometry(1.8, 0.08, 0.08);
    group.add(Object.assign(new THREE.Mesh(stripGeo, hlMat), { position: new THREE.Vector3(0, 0.5, 1.88) }));

    const tlMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 1.8, flatShading: true });
    group.add(Object.assign(new THREE.Mesh(lightGeo, tlMat), { position: new THREE.Vector3(-0.7, 0.5, -1.85) }));
    group.add(Object.assign(new THREE.Mesh(lightGeo, tlMat), { position: new THREE.Vector3(0.7, 0.5, -1.85) }));
    group.add(Object.assign(new THREE.Mesh(stripGeo.clone(), tlMat), { position: new THREE.Vector3(0, 0.5, -1.88) }));

    const rackMat = getMaterial(COLORS.carAccent);
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.4), rackMat), { position: new THREE.Vector3(0, 1.55, -0.2) }));

    return group;
  }

  createAntenna() {
    const group = new THREE.Group();
    group.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 4), getMaterial(COLORS.carAccent)), { position: new THREE.Vector3(0, 0.5, 0) }));
    group.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), getMaterial(COLORS.gold)), { position: new THREE.Vector3(0, 1.0, 0) }));
    group.position.set(-0.5, 1.5, -0.8);
    this.mesh.add(group);
    this.antenna = group;
  }

  createWheels() {
    const wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = getMaterial(COLORS.carAccent);
    const positions = [
      [-0.85, 0.4, 1.2], [0.85, 0.4, 1.2],
      [-0.85, 0.4, -1.2], [0.85, 0.4, -1.2],
    ];
    for (const [x, y, z] of positions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.castShadow = true;
      wheel._localPos = new THREE.Vector3(x, y, z);
      wheels.push(wheel);
    }
    return wheels;
  }

  setupPhysics() {
    // Simple box body — NO RaycastVehicle. Direct force driving.
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 1.75));
    this.body = new CANNON.Body({ mass: 50 });
    this.body.addShape(chassisShape, new CANNON.Vec3(0, 0.5, 0));
    this.body.position.set(0, 1, -2);
    this.body.linearDamping = 0.5;
    this.body.angularDamping = 0.95;
    this.body.allowSleep = false;
    // Prevent tipping by locking X and Z rotation
    this.body.fixedRotation = false;
    this.world.addBody(this.body);
  }

  applyInput(forward, backward, left, right) {
    // Get car's forward direction from its Y rotation
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w),
      'YXZ'
    );
    const yRot = euler.y;

    // Forward/backward: apply velocity in car's forward direction
    const moveForce = 35;
    if (forward) {
      const fx = -Math.sin(yRot) * moveForce;
      const fz = -Math.cos(yRot) * moveForce;
      this.body.applyForce(new CANNON.Vec3(fx, 0, fz));
    } else if (backward) {
      const fx = Math.sin(yRot) * moveForce * 0.6;
      const fz = Math.cos(yRot) * moveForce * 0.6;
      this.body.applyForce(new CANNON.Vec3(fx, 0, fz));
    }

    // Steering: apply torque around Y axis
    const steerTorque = 15;
    if (left) {
      this.body.angularVelocity.y = Math.min(this.body.angularVelocity.y + 0.15, 3);
    } else if (right) {
      this.body.angularVelocity.y = Math.max(this.body.angularVelocity.y - 0.15, -3);
    }

    // Clamp horizontal speed
    const vel = this.body.velocity;
    const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    const maxSpeed = 20;
    if (hSpeed > maxSpeed) {
      const scale = maxSpeed / hSpeed;
      vel.x *= scale;
      vel.z *= scale;
    }

    // Keep the car from tipping over — lock X and Z rotation
    const q = this.body.quaternion;
    const e2 = new CANNON.Vec3();
    // Extract just the Y rotation and re-apply
    const threeQ = new THREE.Quaternion(q.x, q.y, q.z, q.w);
    const threeE = new THREE.Euler().setFromQuaternion(threeQ, 'YXZ');
    threeE.x = 0;
    threeE.z = 0;
    threeQ.setFromEuler(threeE);
    q.set(threeQ.x, threeQ.y, threeQ.z, threeQ.w);
    this.body.angularVelocity.x = 0;
    this.body.angularVelocity.z = 0;
  }

  applyJoystickInput(forwardAmount, steerAmount) {
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w),
      'YXZ'
    );
    const yRot = euler.y;

    const moveForce = 35 * forwardAmount;
    if (Math.abs(forwardAmount) > 0.1) {
      const fx = -Math.sin(yRot) * moveForce;
      const fz = -Math.cos(yRot) * moveForce;
      this.body.applyForce(new CANNON.Vec3(fx, 0, fz));
    }

    if (Math.abs(steerAmount) > 0.1) {
      this.body.angularVelocity.y += steerAmount * 0.15;
      this.body.angularVelocity.y = Math.max(-3, Math.min(3, this.body.angularVelocity.y));
    }

    const vel = this.body.velocity;
    const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (hSpeed > 20) {
      const scale = 20 / hSpeed;
      vel.x *= scale;
      vel.z *= scale;
    }

    const q = this.body.quaternion;
    const threeQ = new THREE.Quaternion(q.x, q.y, q.z, q.w);
    const threeE = new THREE.Euler().setFromQuaternion(threeQ, 'YXZ');
    threeE.x = 0;
    threeE.z = 0;
    threeQ.setFromEuler(threeE);
    q.set(threeQ.x, threeQ.y, threeQ.z, threeQ.w);
    this.body.angularVelocity.x = 0;
    this.body.angularVelocity.z = 0;
  }

  update() {
    const pos = this.body.position;

    // Fell through the world
    if (pos.y < -10) {
      this.resetToSpawn();
      return;
    }

    // Sync mesh to physics
    this.mesh.position.copy(pos);
    this.mesh.quaternion.copy(this.body.quaternion);

    // Position wheels relative to car
    for (const wheel of this.wheelMeshes) {
      const wp = wheel._localPos.clone().applyQuaternion(this.mesh.quaternion).add(this.mesh.position);
      wheel.position.copy(wp);
      wheel.quaternion.copy(this.mesh.quaternion);
    }

    // Antenna wobble
    if (this.antenna) {
      const vel = this.body.velocity;
      const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      this.antenna.rotation.x = Math.sin(Date.now() * 0.01) * 0.1 * Math.min(speed * 0.05, 1);
      this.antenna.rotation.z = Math.cos(Date.now() * 0.013) * 0.08 * Math.min(speed * 0.05, 1);
    }
  }

  jump() {
    if (this.body.position.y < 3) {
      this.body.velocity.y = 5;
    }
  }

  resetToSpawn() {
    this.body.position.set(0, 1, -2);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
  }

  getPosition() {
    return this.mesh.position;
  }

  getRotationY() {
    const euler = new THREE.Euler().setFromQuaternion(this.mesh.quaternion, 'YXZ');
    return euler.y;
  }
}
