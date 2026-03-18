import { dist2D } from '../utils/Helpers.js';

export class StationManager {
  constructor(stations, promptUI, photoOverlay, keyboard, mobileControls, isMobile) {
    this.stations = stations;
    this.promptUI = promptUI;
    this.photoOverlay = photoOverlay;
    this.keyboard = keyboard;
    this.mobileControls = mobileControls;
    this.isMobile = isMobile;
    this.activeStation = null;
    this.overlayOpen = false;

    // Discovery tracking — only photo stations (not video/treasure chest)
    this.discoverable = stations.filter((s) => s.photo);
    this.discovered = new Set();
    this._pendingDiscovery = null;

    this._createToast();
  }

  _createToast() {
    const toast = document.createElement('div');
    toast.id = 'discovery-toast';
    toast.innerHTML = '<p id="discovery-text"></p>';
    document.body.appendChild(toast);
    this._toast = toast;
    this._toastText = document.getElementById('discovery-text');
  }

  _showDiscoveryToast(count, total) {
    if (!this._toast) return;
    if (count === total) {
      this._toastText.textContent = `You found them all! ${count}/${total} discoveries!`;
      this._burstConfetti();
    } else {
      this._toastText.textContent = `You've made ${count}/${total} discoveries!`;
    }
    this._toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toast.classList.remove('show');
    }, count === total ? 4500 : 3000);
  }

  _burstConfetti() {
    const colors = ['#e84545', '#f4c542', '#4fa4e8', '#7ec850', '#ff69b4', '#ffaa33'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;z-index:61;pointer-events:none;overflow:hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.6;
      const duration = 1.8 + Math.random() * 1.2;
      const size = 6 + Math.random() * 6;
      const drift = (Math.random() - 0.5) * 120;
      const spin = Math.random() * 720 - 360;
      piece.style.cssText = `
        position:absolute;top:-10px;left:${left}%;
        width:${size}px;height:${size * 0.6}px;
        background:${color};border-radius:1px;
        animation:confetti-fall ${duration}s ${delay}s ease-in forwards;
        --drift:${drift}px;--spin:${spin}deg;
      `;
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 4000);
  }

  update(carPosition, time) {
    if (this.overlayOpen) {
      if (this.keyboard.escape) {
        this.keyboard.consumeEscape();
        this.closeOverlay();
      }
      return;
    }

    // Update station animations
    this.stations.forEach((s) => {
      if (s.update) s.update(time);
      if (s.ring) {
        s.ring.material.emissiveIntensity = 0.4 + Math.sin(time * 3) * 0.3;
      }
    });

    // Check proximity
    let closestStation = null;
    let closestDist = Infinity;

    for (const station of this.stations) {
      const d = dist2D(carPosition.x, carPosition.z, station.position.x, station.position.z);
      if (d < station.radius && d < closestDist) {
        closestDist = d;
        closestStation = station;
      }
    }

    if (closestStation) {
      this.activeStation = closestStation;
      this.promptUI.show(this.isMobile);
      if (this.isMobile) {
        this.mobileControls.showActionButton();
      }

      if (this.keyboard.interact || this.mobileControls.consumeInteract()) {
        this.keyboard.consumeInteract();
        this.openOverlay(closestStation);
      }
    } else {
      this.activeStation = null;
      this.promptUI.hide();
      if (this.isMobile) {
        this.mobileControls.hideActionButton();
      }
    }
  }

  openOverlay(station) {
    this.overlayOpen = true;
    this.keyboard.enabled = false;
    this.mobileControls.enabled = false;

    // Track discovery if it's a photo station (not treasure chest)
    if (station.photo && !this.discovered.has(station)) {
      this.discovered.add(station);
      this._pendingDiscovery = true;
    } else {
      this._pendingDiscovery = false;
    }

    if (station.video) {
      this.photoOverlay.showVideo(station.video, station.caption);
    } else {
      this.photoOverlay.show(station.photo, station.caption);
    }
  }

  closeOverlay() {
    this.overlayOpen = false;
    this.keyboard.enabled = true;
    this.mobileControls.enabled = true;
    this.photoOverlay.hide();

    // Show discovery toast after overlay closes (if this was a new find)
    if (this._pendingDiscovery) {
      this._pendingDiscovery = false;
      setTimeout(() => {
        this._showDiscoveryToast(this.discovered.size, this.discoverable.length);
      }, 400); // slight delay after overlay fade-out
    }
  }
}
