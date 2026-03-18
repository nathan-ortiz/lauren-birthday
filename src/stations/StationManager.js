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
      // Pulse the ring
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

      // Check for interaction
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
    this.photoOverlay.show(station.photo, station.caption);
  }

  closeOverlay() {
    this.overlayOpen = false;
    this.keyboard.enabled = true;
    this.mobileControls.enabled = true;
    this.photoOverlay.hide();
  }
}
