export class KeyboardControls {
  constructor() {
    this.keys = {};
    this.enabled = true;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      // Prevent Space from scrolling the page
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  get forward() {
    return this.enabled && (this.keys['ArrowUp'] || this.keys['KeyW']);
  }
  get backward() {
    return this.enabled && (this.keys['ArrowDown'] || this.keys['KeyS']);
  }
  get left() {
    return this.enabled && (this.keys['ArrowLeft'] || this.keys['KeyA']);
  }
  get right() {
    return this.enabled && (this.keys['ArrowRight'] || this.keys['KeyD']);
  }
  get interact() {
    return this.keys['Enter'] || this.keys['KeyE'];
  }
  get jump() {
    return this.enabled && this.keys['Space'];
  }
  get reset() {
    return this.keys['KeyR'];
  }
  get escape() {
    return this.keys['Escape'];
  }

  consumeInteract() {
    this.keys['Enter'] = false;
    this.keys['KeyE'] = false;
  }
  consumeJump() {
    this.keys['Space'] = false;
  }
  consumeReset() {
    this.keys['KeyR'] = false;
  }
  consumeEscape() {
    this.keys['Escape'] = false;
  }
}
