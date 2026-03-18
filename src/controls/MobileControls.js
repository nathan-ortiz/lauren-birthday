import nipplejs from 'nipplejs';

export class MobileControls {
  constructor() {
    this.forwardAmount = 0;
    this.steerAmount = 0;
    this.interactPressed = false;
    this.jumpPressed = false;
    this.enabled = true;
    this.joystick = null;
    this.actionBtn = null;
  }

  init() {
    const container = document.getElementById('mobile-controls');
    if (!container) return;
    container.style.display = 'block';

    // Joystick zone (left side)
    const joystickZone = document.createElement('div');
    joystickZone.id = 'joystick-zone';
    container.appendChild(joystickZone);

    this.joystick = nipplejs.create({
      zone: joystickZone,
      mode: 'static',
      position: { left: '80px', bottom: '80px' },
      color: 'rgba(255,255,255,0.5)',
      size: 120,
    });

    this.joystick.on('move', (evt, data) => {
      if (!this.enabled) return;
      const force = Math.min(data.force, 2) / 2;
      const angle = data.angle.radian;
      this.forwardAmount = Math.sin(angle) * force;
      this.steerAmount = -Math.cos(angle) * force;
    });

    this.joystick.on('end', () => {
      this.forwardAmount = 0;
      this.steerAmount = 0;
    });

    // Tap anywhere (outside joystick) = jump
    let tapStart = 0;
    let tapMoved = false;
    window.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      const t = e.touches[0];
      const inJoystick = t.clientX < 200 && t.clientY > window.innerHeight - 200;
      if (!inJoystick) {
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

    // Action button (right side)
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
