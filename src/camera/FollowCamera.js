import * as THREE from 'three';

export class FollowCamera {
  constructor(camera, isMobile) {
    this.camera = camera;
    this.isMobile = isMobile;
    this.baseOffset = new THREE.Vector3(0, 14, -18);
    this.lookOffset = new THREE.Vector3(0, 2, 0);
    this.lerpFactor = 0.08;
    this.currentLookTarget = new THREE.Vector3();

    // Look-around: user can orbit the camera slightly
    this.orbitAngle = 0; // horizontal orbit offset in radians
    this.orbitTarget = 0;
    this.orbitSpeed = 0.08; // lerp speed

    this.setupControls();
  }

  setupControls() {
    if (this.isMobile) {
      // Two-finger or edge-swipe camera rotation on mobile
      let touchStartX = 0;
      let isCameraTouch = false;

      window.addEventListener('touchstart', (e) => {
        // Only use right-side touches (above joystick area) for camera
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          // Right half of screen, or upper portion — camera drag
          if (touch.clientX > window.innerWidth * 0.4) {
            touchStartX = touch.clientX;
            isCameraTouch = true;
          }
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!isCameraTouch || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - touchStartX;
        const raw = -(dx / window.innerWidth) * Math.PI * 0.6;
        this.orbitTarget = Math.max(-Math.PI * 0.5, Math.min(Math.PI * 0.5, raw));
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isCameraTouch = false;
        this.orbitTarget = 0;
      }, { passive: true });
    } else {
      // Desktop: mouse position nudges camera
      window.addEventListener('mousemove', (e) => {
        // Map mouse X from screen center to orbit angle
        const normalizedX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
        this.orbitTarget = -normalizedX * Math.PI * 0.15; // subtle, max ~27 degrees
      });
    }
  }

  update(carPosition, carRotationY) {
    // Smoothly interpolate orbit angle
    this.orbitAngle += (this.orbitTarget - this.orbitAngle) * this.orbitSpeed;

    // Apply orbit angle + car rotation to camera offset
    const totalRotation = carRotationY + this.orbitAngle;
    const rotatedOffset = this.baseOffset
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
