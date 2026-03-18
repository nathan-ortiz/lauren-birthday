import * as THREE from 'three';

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(0, 14, -18);
    this.lookOffset = new THREE.Vector3(0, 2, 0);
    this.lerpFactor = 0.08;
    this.currentLookTarget = new THREE.Vector3();
  }

  update(carPosition, carRotationY) {
    // Rotate offset by car rotation
    const rotatedOffset = this.offset
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotationY);

    const targetPos = carPosition.clone().add(rotatedOffset);
    this.camera.position.lerp(targetPos, this.lerpFactor);

    const lookTarget = carPosition.clone().add(this.lookOffset);
    this.currentLookTarget.lerp(lookTarget, this.lerpFactor);
    this.camera.lookAt(this.currentLookTarget);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
