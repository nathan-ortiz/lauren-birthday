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
    this._cleanupVideo();

    if (this.imgEl) {
      this.imgEl.style.display = 'none';
      this.imgEl.src = photoUrl;
      this.imgEl.onerror = () => {
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

  showVideo(videoUrl, caption) {
    if (!this.el) return;
    this.isOpen = true;
    this._cleanupVideo();

    // Hide the image element
    if (this.imgEl) this.imgEl.style.display = 'none';

    // Create video element in place of image
    const card = this.el.querySelector('.photo-card');
    if (card) {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.muted = false;
      video.style.maxWidth = '80vw';
      video.style.maxHeight = '60vh';
      video.style.objectFit = 'contain';
      video.style.borderRadius = '2px';
      video.style.display = 'block';
      card.insertBefore(video, this.captionEl);
      this._videoEl = video;
      video.play().catch(() => {});
    }

    if (this.captionEl) {
      this.captionEl.textContent = caption;
    }

    this.el.style.display = 'flex';
    requestAnimationFrame(() => {
      this.el.style.opacity = '1';
      if (card) card.style.transform = 'scale(1) rotate(-1deg)';
    });
  }

  _cleanupVideo() {
    if (this._videoEl) {
      this._videoEl.pause();
      this._videoEl.remove();
      this._videoEl = null;
    }
  }

  hide() {
    if (!this.el) return;
    this.isOpen = false;
    this._cleanupVideo();
    this.el.style.opacity = '0';
    const card = this.el.querySelector('.photo-card');
    if (card) card.style.transform = 'scale(0.8) rotate(0deg)';
    setTimeout(() => {
      this.el.style.display = 'none';
    }, 300);
  }
}
