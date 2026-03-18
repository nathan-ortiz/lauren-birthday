import nipplejs from 'nipplejs';

export class MobileControls {
  constructor() {
    this.forwardAmount = 0;
    this.steerAmount = 0;
    this.interactPressed = false;
    this.jumpPressed = false;
    this.enabled = true;
    this.leftJoystick = null;
    this.rightJoystick = null;
    this.actionBtn = null;
  }

  init() {
    const container = document.getElementById('mobile-controls');
    if (!container) return;
    container.style.display = 'block';

    // ── Left joystick — steering (left/right) ──
    const leftZone = document.createElement('div');
    leftZone.id = 'joystick-zone';
    container.appendChild(leftZone);

    this.leftJoystick = nipplejs.create({
      zone: leftZone,
      mode: 'static',
      position: { left: '80px', bottom: '80px' },
      color: 'rgba(255,255,255,0.5)',
      size: 120,
    });

    this.leftJoystick.on('move', (evt, data) => {
      if (!this.enabled) return;
      const force = Math.min(data.force, 2) / 2;
      const angle = data.angle.radian;
      // Horizontal axis only — steering
      this.steerAmount = -Math.cos(angle) * force;
    });

    this.leftJoystick.on('end', () => {
      this.steerAmount = 0;
    });

    // ── Right joystick — throttle (forward/backward) ──
    const rightZone = document.createElement('div');
    rightZone.id = 'joystick-zone-right';
    container.appendChild(rightZone);

    this.rightJoystick = nipplejs.create({
      zone: rightZone,
      mode: 'static',
      position: { right: '80px', bottom: '80px' },
      color: 'rgba(255,255,255,0.5)',
      size: 120,
    });

    this.rightJoystick.on('move', (evt, data) => {
      if (!this.enabled) return;
      const force = Math.min(data.force, 2) / 2;
      const angle = data.angle.radian;
      // Vertical axis only — forward/backward
      this.forwardAmount = Math.sin(angle) * force;
    });

    this.rightJoystick.on('end', () => {
      this.forwardAmount = 0;
    });

    // ── Tap to jump (center area between joysticks) ──
    let tapStart = 0;
    let tapMoved = false;
    window.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      const t = e.touches[0];
      const inLeftJoystick = t.clientX < 200 && t.clientY > window.innerHeight - 200;
      const inRightJoystick = t.clientX > window.innerWidth - 200 && t.clientY > window.innerHeight - 200;
      if (!inLeftJoystick && !inRightJoystick) {
        tapStart = Date.now();
        tapMoved = false;
      }
    }, { passive: true });
    window.addEventListener('touchmove', () => { tapMoved = true; }, { passive: true });
    window.addEventListener('touchend', () => {
      if (!this.enabled) return;
      if (!tapMoved && Date.now() - tapStart < 200) {
        this.jumpPressed = true;
      }
    }, { passive: true });

    // ── Action button — positioned above right joystick ──
    this.actionBtn = document.createElement('button');
    this.actionBtn.id = 'action-btn';
    this.actionBtn.textContent = '✨';
    this.actionBtn.style.display = 'none';
    container.appendChild(this.actionBtn);

    this.actionBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.interactPressed = true;
    });
    this.actionBtn.addEventListener('click', () => {
      this.interactPressed = true;
    });
  }

  showActionButton() {
    if (this.actionBtn) this.actionBtn.style.display = 'flex';
  }

  hideActionButton() {
    if (this.actionBtn) this.actionBtn.style.display = 'none';
  }

  consumeJump() {
    const was = this.jumpPressed;
    this.jumpPressed = false;
    return was;
  }

  consumeInteract() {
    const was = this.interactPressed;
    this.interactPressed = false;
    return was;
  }
}
