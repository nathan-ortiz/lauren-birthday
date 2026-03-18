import * as THREE from 'three';

export class FollowCamera {
  constructor(camera, isMobile) {
    this.camera = camera;
    this.isMobile = isMobile;
    this.baseOffset = new THREE.Vector3(0, 10, -14);
    this.lookOffset = new THREE.Vector3(0, 1.5, 2);
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
        // Vertical: mouse Y position — top of screen = look up, bottom = look down
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        this.pitchTarget = ny * 4; // ±4 units of height adjustment
      });
    }
  }

  update(carPosition, carRotationY) {
    this.orbitAngle += (this.orbitTarget - this.orbitAngle) * this.orbitSpeed;
    this.pitchOffset += (this.pitchTarget - this.pitchOffset) * this.orbitSpeed;

    // Apply orbit + pitch to camera offset
    const totalRotation = carRotationY + this.orbitAngle;
    const adjustedOffset = this.baseOffset.clone();
    adjustedOffset.y += this.pitchOffset; // raise/lower camera based on mouse Y

    const rotatedOffset = adjustedOffset
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), totalRotation);

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
