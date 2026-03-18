import * as THREE from 'three';

export class FollowCamera {
  constructor(camera, isMobile) {
    this.camera = camera;
    this.isMobile = isMobile;
    this.baseOffset = new THREE.Vector3(0, 13, -22);
    this.lookOffset = new THREE.Vector3(0, 1, 3);
    this.lerpFactor = 0.08;
    this.currentLookTarget = new THREE.Vector3();

    // Horizontal orbit
    this.orbitAngle = 0;
    this.orbitTarget = 0;

    // Vertical orbit (pitch adjustment)
    this.pitchOffset = 0;
    this.pitchTarget = 0;

    this.orbitSpeed = 0.08;

    this.setupControls();
  }

  setupControls() {
    if (this.isMobile) {
      let touchStartX = 0;
      let touchStartY = 0;
      let isCameraTouch = false;

      window.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          if (touch.clientX > window.innerWidth * 0.4) {
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isCameraTouch = true;
          }
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!isCameraTouch || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        const rawH = -(dx / window.innerWidth) * Math.PI * 0.6;
        this.orbitTarget = Math.max(-Math.PI * 0.5, Math.min(Math.PI * 0.5, rawH));
        // Vertical: swipe up = look up (negative pitch offset lowers camera)
        const rawV = (dy / window.innerHeight) * 6;
        this.pitchTarget = Math.max(-4, Math.min(6, rawV));
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isCameraTouch = false;
        this.orbitTarget = 0;
        this.pitchTarget = 0;
      }, { passive: true });
    } else {
      window.addEventListener('mousemove', (e) => {
        // Horizontal: mouse X position
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        this.orbitTarget = -nx * Math.PI * 0.15;
        // Vertical: mouse Y position — subtle, just shifts camera height slightly
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        this.pitchTarget = ny * 2; // ±2 units — subtle, won't disorient
      });
    }
  }

  update(carPosition, carRotationY) {
    this.orbitAngle += (this.orbitTarget - this.orbitAngle) * this.orbitSpeed;
    this.pitchOffset += (this.pitchTarget - this.pitchOffset) * this.orbitSpeed;

    // Camera always follows behind the car based on car's rotation
    // In portrait mode, zoom out more so the scene isn't too tight
    const portrait = window.innerHeight > window.innerWidth;
    const zoomScale = portrait ? 1.45 : 1;
    const adjustedOffset = this.baseOffset.clone().multiplyScalar(zoomScale);
    adjustedOffset.y = this.baseOffset.y * zoomScale + this.pitchOffset;

    // Only car rotation determines camera orbit — mouse orbit is additive
    const totalRotation = carRotationY + this.orbitAngle;
    const rotatedOffset = adjustedOffset
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), totalRotation);

    const targetPos = carPosition.clone().add(rotatedOffset);
    this.camera.position.lerp(targetPos, this.lerpFactor);

    // ALWAYS look at the car — keeps car centered in frame
    const lookTarget = carPosition.clone();
    lookTarget.y += 1.5; // look at car body height, not ground
    this.currentLookTarget.lerp(lookTarget, this.lerpFactor);
    this.camera.lookAt(this.currentLookTarget);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
