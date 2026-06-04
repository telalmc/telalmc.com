class AlTilal3DVortex {
  constructor() {
    this.canvas = document.getElementById('cursor-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    
    this.mouse = { x: null, y: null, active: false };
    this.maxParticles = 300; // Optimal particle density for performance and aesthetics
    
    // 3D Projection parameters
    this.fov = 400;
    this.tilt = 0.5; // 3D tilt angle (radians) to create the beautiful concentric orbital layout
    this.yRotationOffset = 0; // Mouse drag spin
    this.tiltOffset = 0; // Mouse drag tilt
    
    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Track mouse coordinate for interactive 3D rotation offsets
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (e.clientY < rect.bottom + 100) {
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.active = true;

        // Map mouse offsets to clean angular rotation shifts
        const dx = x - this.canvas.width / 2;
        const dy = y - this.canvas.height / 2;
        this.yRotationOffset = dx * 0.0006;
        this.tiltOffset = dy * 0.0004;
      }
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
      this.mouse.active = false;
      this.yRotationOffset = 0;
      this.tiltOffset = 0;
    });

    this.create3DVortex();
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    
    if (this.canvas.width < 768) {
      this.maxParticles = 120; // Mobile performance optimization
    } else {
      this.maxParticles = 300;
    }
    this.create3DVortex();
  }

  create3DVortex() {
    this.particles = [];
    const heightRange = this.canvas.height * 0.85;

    for (let i = 0; i < this.maxParticles; i++) {
      // Height value distributed from top to bottom
      const y = (Math.random() - 0.5) * heightRange;
      
      // Radius expands at top/bottom to form a subtle hourglass funnel shape
      const baseR = 150 + Math.random() * 200;
      const r = baseR * (1.0 + Math.pow(Math.abs(y) / (heightRange / 2), 2) * 0.35);
      
      const angle = Math.random() * Math.PI * 2;
      
      // Speed of rotation (slower for outer rings)
      const baseSpeed = 0.002 + (150 / r) * 0.003;
      const speed = baseSpeed * (0.8 + Math.random() * 0.4);

      this.particles.push({
        r: r,
        y: y,
        angle: angle,
        speed: speed,
        size: 0.9 + Math.random() * 1.5, // Delicate sparkles
        alpha: 0.12 + Math.random() * 0.38
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.draw3DVortex();
    requestAnimationFrame(() => this.animate());
  }

  draw3DVortex() {
    const pLen = this.particles.length;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    
    // Interpolated tilt with mouse offset
    const activeTilt = this.tilt + this.tiltOffset;
    const cosTilt = Math.cos(activeTilt);
    const sinTilt = Math.sin(activeTilt);

    for (let i = 0; i < pLen; i++) {
      const p = this.particles[i];

      // Update rotation angle (plus mouse rotation drag)
      p.angle += p.speed + this.yRotationOffset * 0.025;

      // 1. Calculate 3D coordinates (rotates around vertical Y axis)
      const x3d = Math.sin(p.angle) * p.r;
      const z3d = Math.cos(p.angle) * p.r;
      const y3d = p.y;

      // 2. Rotate coordinates around X axis to apply the 3D tilt angle
      const yRotated = y3d * cosTilt - z3d * sinTilt;
      const zRotated = y3d * sinTilt + z3d * cosTilt;

      // 3. Perspective Projection calculations
      const scale = this.fov / (this.fov + zRotated);
      const screenX = cx + x3d * scale;
      const screenY = cy + yRotated * scale;

      // Skip drawing if outside rendering bounds
      if (screenX < -50 || screenX > this.canvas.width + 50 || screenY < -50 || screenY > this.canvas.height + 50) {
        continue;
      }

      // Calculate previous frame position to render dynamic trailing lines (dashes)
      const prevAngle = p.angle - p.speed;
      const prevX3d = Math.sin(prevAngle) * p.r;
      const prevZ3d = Math.cos(prevAngle) * p.r;
      
      const prevYRotated = y3d * cosTilt - prevZ3d * sinTilt;
      const prevZRotated = y3d * sinTilt + prevZ3d * cosTilt;
      
      const prevScale = this.fov / (this.fov + prevZRotated);
      const prevScreenX = cx + prevX3d * prevScale;
      const prevScreenY = cy + prevYRotated * prevScale;

      // 4. Color mapping based on vertical Y position
      // Dynamic based on CSS --primary-hue to match theme changes
      let brandHue = 38;
      const rootStyles = getComputedStyle(document.documentElement);
      const customHue = rootStyles.getPropertyValue('--primary-hue').trim();
      if (customHue) {
        brandHue = parseInt(customHue, 10);
      }

      const heightRange = this.canvas.height * 0.85;
      const pct = (p.y + heightRange / 2) / heightRange; // 0 to 1
      
      let hue, sat = 85, light = 50;
      if (pct < 0.4) {
        // Top: Bright brand color
        hue = brandHue;
        sat = 90;
        light = 55;
      } else if (pct < 0.7) {
        // Middle: Soft gradient shift
        hue = brandHue + 5; 
        sat = 85;
        light = 48;
      } else {
        // Bottom: Deep brand variant
        hue = brandHue - 5; 
        sat = 75;
        light = 40;
      }

      // Brightness shifts based on depth (zRotated: front is brighter, back is darker)
      const depthRatio = (zRotated + p.r) / (2 * p.r); // 0 to 1
      const activeAlpha = p.alpha * (1.3 - depthRatio * 0.85);

      // Draw the dash segment
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, screenY);
      this.ctx.lineTo(prevScreenX, prevScreenY);

      this.ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${activeAlpha})`;
      this.ctx.lineWidth = p.size * scale;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.cursorParticleSystem = new AlTilal3DVortex();
});
