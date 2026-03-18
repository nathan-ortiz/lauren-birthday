export class StartScreen {
  constructor() {
    this.el = document.getElementById('start-screen');
    this.resolved = false;
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
