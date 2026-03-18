export class PhotoOverlay {
  constructor(onClose) {
    this.el = document.getElementById('photo-overlay');
    this.imgEl = document.getElementById('photo-img');
    this.captionEl = document.getElementById('photo-caption');
    this.onClose = onClose;

    // Close handlers
    const closeBtn = document.getElementById('photo-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.onClose());

    if (this.el) {
      this.el.addEventListener('click', (e) => {
        if (e.target === this.el) this.onClose();
      });
    }
  }

  show(photoUrl, caption) {
    if (!this.el) return;

    if (this.imgEl) {
      this.imgEl.src = photoUrl;
      this.imgEl.onerror = () => {
        this.imgEl.style.display = 'none';
      };
      this.imgEl.onload = () => {
        this.imgEl.style.display = 'block';
      };
    }
    if (this.captionEl) {
      this.captionEl.textContent = caption;
    }

    this.el.style.display = 'flex';
    requestAnimationFrame(() => {
      this.el.style.opacity = '1';
      const card = this.el.querySelector('.photo-card');
      if (card) card.style.transform = 'scale(1) rotate(-1deg)';
    });
  }

  hide() {
    if (!this.el) return;
    this.el.style.opacity = '0';
    const card = this.el.querySelector('.photo-card');
    if (card) card.style.transform = 'scale(0.8) rotate(0deg)';
    setTimeout(() => {
      this.el.style.display = 'none';
    }, 300);
  }
}
