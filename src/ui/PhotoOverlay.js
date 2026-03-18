export class PhotoOverlay {
  constructor(onClose) {
    this.el = document.getElementById('photo-overlay');
    this.imgEl = document.getElementById('photo-img');
    this.captionEl = document.getElementById('photo-caption');
    this.onClose = onClose;
    this.isOpen = false;

    // Close handlers
    const closeBtn = document.getElementById('photo-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.onClose());
      closeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onClose();
      }, { passive: false });
    }

    if (this.el) {
      this.el.addEventListener('click', (e) => {
        if (e.target === this.el) this.onClose();
      });
    }

    // ESC key handling directly in overlay
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.onClose();
      }
    });
  }

  show(photoUrl, caption) {
    if (!this.el) return;
    this.isOpen = true;

    if (this.imgEl) {
      this.imgEl.style.display = 'none';
      this.imgEl.src = photoUrl;
      this.imgEl.onerror = () => {
        // Show a warm placeholder gradient when photo fails to load
        this.imgEl.style.display = 'none';
        const card = this.el.querySelector('.photo-card');
        if (card) card.style.minHeight = '200px';
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
    this.isOpen = false;
    this.el.style.opacity = '0';
    const card = this.el.querySelector('.photo-card');
    if (card) card.style.transform = 'scale(0.8) rotate(0deg)';
    setTimeout(() => {
      this.el.style.display = 'none';
    }, 300);
  }
}
