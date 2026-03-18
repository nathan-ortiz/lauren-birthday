export class LoadingScreen {
  constructor() {
    this.el = document.getElementById('loading-screen');
  }

  hide() {
    if (!this.el) return;
    this.el.style.opacity = '0';
    setTimeout(() => {
      this.el.style.display = 'none';
    }, 600);
  }
}
