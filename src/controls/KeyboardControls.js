export class KeyboardControls {
  constructor() {
    this.keys = {};
    this.enabled = true;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
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
    return this.keys['Enter'] || this.keys['Space'];
  }
  get escape() {
    return this.keys['Escape'];
  }

  consumeInteract() {
    this.keys['Enter'] = false;
    this.keys['Space'] = false;
  }
  consumeEscape() {
    this.keys['Escape'] = false;
  }
}
