// timeline.js
// 10-Second Master Cinematic Timeline Controller

export class TimelineController {
  constructor(options = {}) {
    this.duration = 10.0; // 10 seconds exact
    this.currentTime = 0.0;
    this.isPlaying = true;
    this.cameraMode = 'cinematic'; // 'cinematic' or 'interactive'

    this.onUpdate = options.onUpdate || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.trackEl = document.getElementById('timeline-track');
    this.progressEl = document.getElementById('timeline-progress');
    this.handleEl = document.getElementById('timeline-handle');
    this.timeCurrentEl = document.getElementById('time-current');
    this.btnPlay = document.getElementById('btn-play');
    this.btnReplay = document.getElementById('btn-replay');
    this.btnCamera = document.getElementById('btn-camera');
    this.cameraLabel = document.getElementById('camera-label');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    this.iconPlay = document.getElementById('icon-play');
    this.iconPause = document.getElementById('icon-pause');

    // Play / Pause Toggle
    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => this.togglePlay());
    }

    // Replay Button (0s)
    if (this.btnReplay) {
      this.btnReplay.addEventListener('click', () => {
        this.seek(0);
        this.play();
      });
    }

    // Camera Switcher Toggle
    if (this.btnCamera) {
      this.btnCamera.addEventListener('click', () => {
        this.cameraMode = this.cameraMode === 'cinematic' ? 'interactive' : 'cinematic';
        if (this.cameraLabel) {
          this.cameraLabel.textContent = this.cameraMode === 'cinematic' ? 'CINEMATIC DOLLY' : '3D ORBIT MODE';
        }
        this.onStateChange({ cameraMode: this.cameraMode });
      });
    }

    // Fullscreen Toggle
    if (this.btnFullscreen) {
      this.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Timeline Scrubber Dragging
    if (this.trackEl) {
      let isDragging = false;

      const handleScrub = (e) => {
        const rect = this.trackEl.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const progress = offsetX / rect.width;
        this.seek(progress * this.duration);
      };

      this.trackEl.addEventListener('mousedown', (e) => {
        isDragging = true;
        handleScrub(e);
      });

      window.addEventListener('mousemove', (e) => {
        if (isDragging) handleScrub(e);
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });
    }
  }

  play() {
    this.isPlaying = true;
    if (this.iconPlay && this.iconPause) {
      this.iconPlay.classList.add('hidden');
      this.iconPause.classList.remove('hidden');
    }
    this.onStateChange({ isPlaying: true });
  }

  pause() {
    this.isPlaying = false;
    if (this.iconPlay && this.iconPause) {
      this.iconPlay.classList.remove('hidden');
      this.iconPause.classList.add('hidden');
    }
    this.onStateChange({ isPlaying: false });
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  seek(time) {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this.updateUI();
    this.onUpdate(this.currentTime, this.getNormalizedProgress());
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    this.currentTime += deltaTime;

    // Loop back to 0 at 10s smoothly
    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
    }

    this.updateUI();
    this.onUpdate(this.currentTime, this.getNormalizedProgress());
  }

  getNormalizedProgress() {
    return this.currentTime / this.duration; // 0.0 to 1.0
  }

  // Returns exact phase metrics for particle shaders & camera dolly
  getPhaseMetrics() {
    const t = this.currentTime;

    // Phase 0 (0s - 2s): Morph progress = 0.0
    // Phase 1 (2s - 6s): Morph progress 0.0 -> 1.0
    // Phase 2 (6s - 10s): Morph progress = 1.0 (Full Divine Emergence)
    let morphProgress = 0.0;
    if (t >= 2.0 && t <= 6.0) {
      morphProgress = (t - 2.0) / 4.0;
    } else if (t > 6.0) {
      morphProgress = 1.0;
    }

    // Volumetric Rays & Bloom Progress
    let raysProgress = 0.0;
    if (t >= 3.0) {
      raysProgress = Math.min(1.0, (t - 3.0) / 3.0);
    }

    // Dolly Zoom Progress (0.0 at z=7.5, 1.0 at z=4.8)
    let dollyProgress = 0.0;
    if (t >= 4.0) {
      dollyProgress = Math.min(1.0, (t - 4.0) / 6.0);
    }

    return { morphProgress, raysProgress, dollyProgress };
  }

  updateUI() {
    const progressPct = (this.currentTime / this.duration) * 100;
    if (this.progressEl) this.progressEl.style.width = `${progressPct}%`;
    if (this.handleEl) this.handleEl.style.left = `${progressPct}%`;

    if (this.timeCurrentEl) {
      const secs = Math.floor(this.currentTime);
      const millis = Math.floor((this.currentTime % 1) * 100);
      const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
      const millisStr = millis < 10 ? `0${millis}` : `${millis}`;
      this.timeCurrentEl.textContent = `${secsStr}:${millisStr}`;
    }
  }
}
