export class PromptUI {
  constructor() {
    this.el = document.getElementById('prompt-ui');
  }

  show(isMobile) {
    if (!this.el) return;
    this.el.textContent = isMobile ? 'Tap ✨ to view' : 'Press Enter to view';
    this.el.style.display = 'flex';
  }

  hide() {
    if (!this.el) return;
    this.el.style.display = 'none';
  }
}
