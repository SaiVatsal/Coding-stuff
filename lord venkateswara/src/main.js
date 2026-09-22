// main.js
// 10-Second Ultra-Cinematic Lord Venkateswara Swamy Particle Animation Engine

import * as THREE from 'three';
import { generateBalajiPoints } from './balajiPoints.js';
import { particleVertexShader, particleFragmentShader } from './shaders/particleShaders.js';
import { TimelineController } from './timeline.js';

class DivineParticleEngine {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.fpsCounterEl = document.getElementById('fps-counter');

    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();

    this.initScene();
    this.initParticles();
    this.initTimeline();
    this.initEvents();

    this.animate(performance.now());
  }

  initScene() {
    // Scene setup with pure black background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Perspective Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0.6, 8.5); // Initial camera distance
    this.camera.lookAt(0, 0.6, 0);

    // Renderer setup with retina device pixel ratio support
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.container.appendChild(this.renderer.domElement);

    // Interactive mouse parallax variables
    this.mouse = new THREE.Vector2(0, 0);
    this.targetMouse = new THREE.Vector2(0, 0);
  }

  initParticles() {
    // Generate 100,000 sacred particle points for Lord Venkateswara Swamy
    const pointData = generateBalajiPoints(100000);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pointData.targetPositions, 3));
    this.geometry.setAttribute('aStartPosition', new THREE.BufferAttribute(pointData.startPositions, 3));
    this.geometry.setAttribute('aTargetPosition', new THREE.BufferAttribute(pointData.targetPositions, 3));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(pointData.particleColors, 3));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(pointData.particleSizes, 1));
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(pointData.particlePhases, 1));
    this.geometry.setAttribute('aCategory', new THREE.BufferAttribute(pointData.particleCategories, 1));

    this.geometry.computeBoundingSphere();
    this.geometry.boundingSphere.radius = 50.0; // Ensure sphere covers scene

    // Custom Shader Material setup
    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.particleSystem.frustumCulled = false; // Disable frustum culling to guarantee visibility
    this.scene.add(this.particleSystem);
  }

  initTimeline() {
    this.timeline = new TimelineController({
      onUpdate: () => {},
      onStateChange: () => {}
    });
  }

  initEvents() {
    window.addEventListener('resize', () => this.onWindowResize());

    // Mouse move for subtle 3D camera parallax
    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
  }

  animate(now) {
    requestAnimationFrame((t) => this.animate(t));

    const deltaTime = this.lastFrameTime ? (now - this.lastFrameTime) / 1000 : 0.016;
    this.lastFrameTime = now;

    // Update FPS Counter
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      if (this.fpsCounterEl) this.fpsCounterEl.textContent = `${fps}`;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Update 10-Second Timeline State
    this.timeline.update(deltaTime);

    const currentTime = this.timeline.currentTime;
    const { morphProgress, dollyProgress } = this.timeline.getPhaseMetrics();

    // Update Shader Uniforms
    this.material.uniforms.uTime.value = currentTime;
    this.material.uniforms.uProgress.value = morphProgress;

    // Smooth Mouse Parallax
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

    // Cinematic Camera Path (Dolly-In with gentle 3D parallax)
    if (this.timeline.cameraMode === 'cinematic') {
      // Dolly in along Z axis from 8.5 down to 5.2 as form emerges
      const targetZ = 8.5 - dollyProgress * 3.3;
      const targetY = 0.6 + Math.sin(currentTime * 0.8) * 0.15;
      const targetX = Math.sin(currentTime * 0.5) * 0.25 + this.mouse.x * 0.4;

      this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetY + this.mouse.y * 0.3 - this.camera.position.y) * 0.05;
      this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;
      this.camera.lookAt(0, 0.6, 0);
    } else {
      // 3D Orbit Mouse Interaction
      const radius = 6.5;
      this.camera.position.x = radius * Math.sin(this.mouse.x * 1.2);
      this.camera.position.z = radius * Math.cos(this.mouse.x * 1.2);
      this.camera.position.y = 0.6 + this.mouse.y * 2.0;
      this.camera.lookAt(0, 0.6, 0);
    }

    // Gentle particle system rotation
    this.particleSystem.rotation.y = Math.sin(currentTime * 0.3) * 0.08;

    // Render Frame
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new DivineParticleEngine();
});
