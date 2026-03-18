export class StartScreen {
  constructor(isMobile) {
    this.el = document.getElementById('start-screen');
    this.resolved = false;

    // Show mobile-specific instructions
    if (this.el && isMobile) {
      const instructions = this.el.querySelector('.instructions');
      if (instructions) {
        instructions.innerHTML = 'Use the joystick to drive<br />Swipe right side to look around<br />Drive up to glowing rings to interact';
      }
      const btn = this.el.querySelector('.start-btn');
      if (btn) btn.textContent = 'Tap to Start';
    }
  }

  show() {
    if (!this.el) return Promise.resolve();
    this.el.style.display = 'flex';

    return new Promise((resolve) => {
      const handler = () => {
        if (this.resolved) return;
        this.resolved = true;
        this.el.style.opacity = '0';
        setTimeout(() => {
          this.el.style.display = 'none';
        }, 500);
        resolve();
      };
      this.el.addEventListener('click', handler);
      this.el.addEventListener('touchstart', handler, { passive: true });
    });
  }
}
