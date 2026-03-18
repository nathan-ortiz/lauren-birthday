import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial, getEmissiveMaterial } from '../utils/Materials.js';

export class Car {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.engineForce = 0;
    this.steerValue = 0;
    this.brakeForce = 0;

    this.mesh = this.createMesh();
    scene.add(this.mesh);

    this.wheelMeshes = this.createWheels();
    this.wheelMeshes.forEach((w) => scene.add(w));

    this.setupPhysics();

    // Antenna wobble
    this.antenna = null;
    this.createAntenna();
  }

  createMesh() {
    const group = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(2, 0.8, 3.5);
    const body = new THREE.Mesh(bodyGeo, getMaterial(COLORS.carBody));
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.7, 2);
    const cabin = new THREE.Mesh(cabinGeo, getMaterial(COLORS.carBody));
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Windshield
    const windshieldGeo = new THREE.PlaneGeometry(1.5, 0.55);
    const windshieldMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.5,
      flatShading: true,
    });
    const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
    windshield.position.set(0, 1.2, 0.85);
    windshield.rotation.x = -0.15;
    group.add(windshield);

    // Bumpers
    const bumperGeo = new THREE.BoxGeometry(2.1, 0.25, 0.3);
    const bumperMat = getMaterial(COLORS.carAccent);
    const frontBumper = new THREE.Mesh(bumperGeo, bumperMat);
    frontBumper.position.set(0, 0.3, 1.8);
    group.add(frontBumper);
    const rearBumper = new THREE.Mesh(bumperGeo, bumperMat);
    rearBumper.position.set(0, 0.3, -1.8);
    group.add(rearBumper);

    // Headlights — bright glow
    const lightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: COLORS.carLights,
      emissive: COLORS.carLights,
      emissiveIntensity: 2.0,
      flatShading: true,
    });
    const hl1 = new THREE.Mesh(lightGeo, headlightMat);
    hl1.position.set(-0.7, 0.5, 1.85);
    group.add(hl1);
    const hl2 = new THREE.Mesh(lightGeo, headlightMat);
    hl2.position.set(0.7, 0.5, 1.85);
    group.add(hl2);

    // Headlight strip (like Bruno's car — glowing bar across front)
    const stripGeo = new THREE.BoxGeometry(1.8, 0.08, 0.08);
    const stripMat = new THREE.MeshStandardMaterial({
      color: COLORS.carLights,
      emissive: COLORS.carLights,
      emissiveIntensity: 1.5,
      flatShading: true,
    });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, 0.5, 1.88);
    group.add(strip);

    // Taillights — red glow
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xff2222,
      emissiveIntensity: 1.8,
      flatShading: true,
    });
    const tl1 = new THREE.Mesh(lightGeo, tlMat);
    tl1.position.set(-0.7, 0.5, -1.85);
    group.add(tl1);
    const tl2 = new THREE.Mesh(lightGeo, tlMat);
    tl2.position.set(0.7, 0.5, -1.85);
    group.add(tl2);

    // Taillight strip
    const tlStrip = new THREE.Mesh(stripGeo.clone(), tlMat);
    tlStrip.position.set(0, 0.5, -1.88);
    group.add(tlStrip);

    // Roof rack (adds Bruno-like chunkiness)
    const rackGeo = new THREE.BoxGeometry(1.4, 0.06, 1.4);
    const rackMat = getMaterial(COLORS.carAccent);
    const rack = new THREE.Mesh(rackGeo, rackMat);
    rack.position.set(0, 1.55, -0.2);
    group.add(rack);
    // Rack rails
    for (const rx of [-0.65, 0.65]) {
      const railGeo = new THREE.BoxGeometry(0.06, 0.12, 1.4);
      const rail = new THREE.Mesh(railGeo, rackMat);
      rail.position.set(rx, 1.58, -0.2);
      group.add(rail);
    }

    return group;
  }

  createAntenna() {
    const group = new THREE.Group();
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1, 4),
      getMaterial(COLORS.carAccent)
    );
    rod.position.y = 0.5;
    group.add(rod);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 4),
      getMaterial(COLORS.gold)
    );
    ball.position.y = 1.0;
    group.add(ball);

    group.position.set(-0.5, 1.5, -0.8);
    this.mesh.add(group);
    this.antenna = group;
  }

  createWheels() {
    const wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = getMaterial(COLORS.carAccent);

    for (let i = 0; i < 4; i++) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.castShadow = true;
      wheels.push(wheel);
    }
    return wheels;
  }

  setupPhysics() {
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.4, 1.75));
    this.chassisBody = new CANNON.Body({ mass: 80 });
    this.chassisBody.addShape(chassisShape);
    this.chassisBody.position.set(0, 4, 0); // start above ground, will drop
    this.chassisBody.linearDamping = 0.1;
    this.chassisBody.angularDamping = 0.4;

    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.chassisBody,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2,
    });

    const wheelOpts = {
      radius: 0.4,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 55,
      suspensionRestLength: 0.3,
      frictionSlip: 2.5,
      dampingRelaxation: 2.3,
      dampingCompression: 4.4,
      maxSuspensionForce: 100000,
      rollInfluence: 0.01,
      axleLocal: new CANNON.Vec3(-1, 0, 0),
      maxSuspensionTravel: 0.3,
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true,
    };

    const positions = [
      new CANNON.Vec3(-0.85, 0, 1.2),
      new CANNON.Vec3(0.85, 0, 1.2),
      new CANNON.Vec3(-0.85, 0, -1.2),
      new CANNON.Vec3(0.85, 0, -1.2),
    ];

    positions.forEach((pos) => {
      wheelOpts.chassisConnectionPointLocal = pos;
      this.vehicle.addWheel({ ...wheelOpts });
    });

    this.vehicle.addToWorld(this.world);

    // Create wheel bodies
    this.wheelBodies = [];
    this.vehicle.wheelInfos.forEach((wheel) => {
      const shape = new CANNON.Cylinder(wheel.radius, wheel.radius, 0.3, 8);
      const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
      body.addShape(shape);
      this.wheelBodies.push(body);
      this.world.addBody(body);
    });
  }

  applyInput(forward, backward, left, right) {
    const maxForce = 1500;
    const maxSteer = 0.6;
    const brakeForce = 80;

    // Engine
    if (forward) {
      this.engineForce = maxForce;
      this.brakeForce = 0;
    } else if (backward) {
      this.engineForce = -maxForce * 0.6;
      this.brakeForce = 0;
    } else {
      this.engineForce = 0;
      this.brakeForce = 3; // very gentle slow down
    }

    // Steering
    if (left) {
      this.steerValue = maxSteer;
    } else if (right) {
      this.steerValue = -maxSteer;
    } else {
      this.steerValue *= 0.85; // auto-center
    }

    // Apply to vehicle
    this.vehicle.applyEngineForce(this.engineForce, 2);
    this.vehicle.applyEngineForce(this.engineForce, 3);
    this.vehicle.setBrake(this.brakeForce, 0);
    this.vehicle.setBrake(this.brakeForce, 1);
    this.vehicle.setBrake(this.brakeForce, 2);
    this.vehicle.setBrake(this.brakeForce, 3);
    this.vehicle.setSteeringValue(this.steerValue, 0);
    this.vehicle.setSteeringValue(this.steerValue, 1);
  }

  applyJoystickInput(forwardAmount, steerAmount) {
    const maxForce = 1500;
    const maxSteer = 0.6;

    this.engineForce = forwardAmount * maxForce;
    this.steerValue = -steerAmount * maxSteer;

    if (Math.abs(forwardAmount) < 0.1 && Math.abs(steerAmount) < 0.1) {
      this.brakeForce = 3;
    } else {
      this.brakeForce = 0;
    }

    this.vehicle.applyEngineForce(this.engineForce, 2);
    this.vehicle.applyEngineForce(this.engineForce, 3);
    this.vehicle.setBrake(this.brakeForce, 0);
    this.vehicle.setBrake(this.brakeForce, 1);
    this.vehicle.setBrake(this.brakeForce, 2);
    this.vehicle.setBrake(this.brakeForce, 3);
    this.vehicle.setSteeringValue(this.steerValue, 0);
    this.vehicle.setSteeringValue(this.steerValue, 1);
  }

  update() {
    // Check for flip or out-of-bounds — auto-reset
    const pos = this.chassisBody.position;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);

    if (pos.y < -5 || up.y < 0.3) {
      // Car is flipped or fell through the world — reset
      this.resetToSpawn();
      return;
    }

    // Sync mesh to physics
    this.mesh.position.copy(pos);
    this.mesh.quaternion.copy(this.chassisBody.quaternion);

    // Sync wheel meshes
    for (let i = 0; i < 4; i++) {
      this.vehicle.updateWheelTransform(i);
      const t = this.vehicle.wheelInfos[i].worldTransform;
      this.wheelMeshes[i].position.copy(t.position);
      this.wheelMeshes[i].quaternion.copy(t.quaternion);
    }

    // Antenna wobble based on velocity
    if (this.antenna) {
      const vel = this.chassisBody.velocity;
      const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      this.antenna.rotation.x = Math.sin(Date.now() * 0.01) * 0.1 * Math.min(speed * 0.1, 1);
      this.antenna.rotation.z = Math.cos(Date.now() * 0.013) * 0.08 * Math.min(speed * 0.1, 1);
    }
  }

  resetToSpawn() {
    this.chassisBody.position.set(0, 3, 0);
    this.chassisBody.quaternion.set(0, 0, 0, 1);
    this.chassisBody.velocity.set(0, 0, 0);
    this.chassisBody.angularVelocity.set(0, 0, 0);
    this.engineForce = 0;
    this.steerValue = 0;
    this.brakeForce = 0;
  }

  getPosition() {
    return this.mesh.position;
  }

  getRotationY() {
    const euler = new THREE.Euler().setFromQuaternion(this.mesh.quaternion, 'YXZ');
    return euler.y;
  }
}
