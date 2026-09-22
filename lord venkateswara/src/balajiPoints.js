// balajiPoints.js
// Generates ultra-precise sacred 3D point cloud data matching the exact image of Lord Venkateswara Swamy

export function generateBalajiPoints(totalCount = 120000) {
  const targetPositions = new Float32Array(totalCount * 3);
  const startPositions = new Float32Array(totalCount * 3);
  const particleColors = new Float32Array(totalCount * 3);
  const particleSizes = new Float32Array(totalCount);
  const particlePhases = new Float32Array(totalCount);
  const particleCategories = new Float32Array(totalCount);

  // Color Definitions (RGB) matching the exact idol image
  const COLOR_GOLD = [1.0, 0.82, 0.1];        // Brilliant Gold #FFD11A
  const COLOR_DEEP_GOLD = [0.95, 0.6, 0.02];  // Rich Amber Gold #F29905
  const COLOR_WHITE = [1.0, 0.98, 0.95];       // Jasmine Diamond White
  const COLOR_RED = [0.95, 0.05, 0.15];        // Crimson Red Flower #F20D26
  const COLOR_PURPLE = [0.65, 0.08, 0.7];     // Royal Magenta Drape #A614B3
  const COLOR_BODY = [0.15, 0.2, 0.3];        // Dark Obsidian Stone Body Glow
  const COLOR_RUBY = [0.9, 0.0, 0.25];        // Crown Ruby Gem #E60040
  const COLOR_CYAN = [0.2, 0.85, 1.0];        // Chakra Sparkle

  let index = 0;

  function addPoint(x, y, z, color, size = 1.0, category = 0, jitter = 0.02) {
    if (index >= totalCount) return;

    targetPositions[index * 3] = x + (Math.random() - 0.5) * jitter;
    targetPositions[index * 3 + 1] = y + (Math.random() - 0.5) * jitter;
    targetPositions[index * 3 + 2] = z + (Math.random() - 0.5) * jitter;

    // Initial space positions for 0s-2s cosmic swirling nebula
    const radius = 2.2 + Math.random() * 4.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    startPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    startPositions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 0.5;
    startPositions[index * 3 + 2] = radius * Math.cos(phi) * 0.6;

    particleColors[index * 3] = color[0];
    particleColors[index * 3 + 1] = color[1];
    particleColors[index * 3 + 2] = color[2];

    particleSizes[index] = size * (0.8 + Math.random() * 0.8);
    particlePhases[index] = Math.random() * Math.PI * 2;
    particleCategories[index] = category;

    index++;
  }

  // Distribution allocations matching image elements
  const countArch = Math.floor(totalCount * 0.15);         // Golden Prabhavali Arch
  const countCrown = Math.floor(totalCount * 0.14);        // Kiritam (Crown) + Ruby Jewels
  const countNamam = Math.floor(totalCount * 0.06);        // White Tilakam + Red Churnam
  const countHandsHands = Math.floor(totalCount * 0.14);    // Chakra, Shankha, Hands
  const countChestNecklaces = Math.floor(totalCount * 0.15); // Circular chest medallions & necklaces
  const countGarlandRed = Math.floor(totalCount * 0.12);    // Outer Red Flower Garland
  const countGarlandWhite = Math.floor(totalCount * 0.10);  // Inner White Flower Garland
  const countDhotiPurple = Math.floor(totalCount * 0.10);   // Golden Dhoti & Magenta Drape
  const countBaseLamps = Math.floor(totalCount * 0.04);     // Pedestal & Diya Lamps

  // ----------------------------------------------------
  // 1. PRABHAVALI (Golden Arch framing the deity) (Y: -2.6 to +4.5, X: ±2.4)
  // ----------------------------------------------------
  for (let i = 0; i < countArch; i++) {
    const u = Math.random(); // 0 to 1 along arch angle
    const angle = Math.PI * (0.05 + u * 0.9); // Semi-circle arch on top, straight pillars down
    const isPillar = Math.random() < 0.4;
    
    if (isPillar) {
      // Left & Right Golden Pillars
      const side = Math.random() > 0.5 ? 1 : -1;
      const py = -2.6 + Math.random() * 4.8;
      const px = side * (2.25 + Math.sin(py * 4.0) * 0.06);
      const pz = -0.1 + (Math.random() - 0.5) * 0.1;
      addPoint(px, py, pz, COLOR_DEEP_GOLD, 1.1, 0, 0.03);
    } else {
      // Ornate Golden Arch Top with filigree wave curves
      const r = 2.3 + Math.sin(angle * 16.0) * 0.08;
      const ax = r * Math.cos(angle);
      const ay = 1.8 + r * Math.sin(angle) * 1.05;
      const az = -0.15 + (Math.random() - 0.5) * 0.1;
      addPoint(ax, ay, az, COLOR_GOLD, 1.2, 0, 0.03);
    }
  }

  // ----------------------------------------------------
  // 2. KIRITAM (Ornate Tall Golden Crown with Ruby Jewels) (Y: 2.2 to 4.3)
  // ----------------------------------------------------
  for (let i = 0; i < countCrown; i++) {
    const u = Math.random();
    const y = 2.25 + u * 2.05;
    const baseR = 0.8 * (1.0 - u * 0.55);
    const angle = Math.random() * Math.PI * 2;
    const r = baseR * (0.95 + Math.random() * 0.1);
    
    const cx = r * Math.sin(angle);
    const cz = r * Math.cos(angle) * 0.7;

    // Center Ruby Gem motif on crown
    const isRuby = Math.cos(angle) > 0.6 && Math.abs(Math.sin(angle)) < 0.25 && u > 0.35 && u < 0.65;
    const color = isRuby ? COLOR_RUBY : (u > 0.88 ? COLOR_WHITE : (Math.random() > 0.3 ? COLOR_GOLD : COLOR_DEEP_GOLD));
    const cat = isRuby ? 3 : 0;

    addPoint(cx, y, cz, color, isRuby ? 1.6 : 1.2, cat, 0.02);
  }

  // Crown Kalasa Top Jewel
  for (let i = 0; i < 600; i++) {
    const r = Math.random() * 0.15;
    const a = Math.random() * Math.PI * 2;
    const y = 4.3 + Math.random() * 0.3;
    addPoint(r * Math.sin(a), y, r * Math.cos(a) * 0.7, COLOR_GOLD, 1.8, 0, 0.015);
  }

  // ----------------------------------------------------
  // 3. VAISHNAVA NAMAM (Tilakam) (Y: 1.35 to 2.2)
  // ----------------------------------------------------
  for (let i = 0; i < countNamam; i++) {
    const u = Math.random();
    const y = 1.35 + u * 0.85;
    const side = Math.random() > 0.5 ? 1 : -1;
    const isCenterLine = Math.random() < 0.25;

    if (isCenterLine) {
      // Red Churnam center line between eyebrows down to nose
      const x = (Math.random() - 0.5) * 0.05;
      const z = 0.44 + Math.random() * 0.02;
      const cy = 1.25 + Math.random() * 0.85;
      addPoint(x, cy, z, COLOR_RED, 1.5, 3, 0.01);
    } else {
      // Thick White Kasturi U-limbs
      const width = 0.1 + Math.pow(u, 1.2) * 0.35;
      const thickness = 0.07 + u * 0.04;
      const x = side * (width + (Math.random() - 0.5) * thickness);
      const z = 0.4 + (1.0 - u * 0.3) * 0.08;
      addPoint(x, y, z, COLOR_WHITE, 1.8, 1, 0.012);
    }
  }

  // Face Skin Contour (Dark Obsidian Stone)
  for (let i = 0; i < 4000; i++) {
    const angle = (Math.random() - 0.5) * Math.PI * 0.95;
    const r = 0.55;
    const fx = r * Math.sin(angle);
    const fy = 1.1 + Math.cos(angle) * 0.45;
    const fz = r * Math.cos(angle) * 0.35;
    addPoint(fx, fy, fz, COLOR_BODY, 1.0, 0, 0.02);
  }

  // ----------------------------------------------------
  // 4. CHAKRA (Upper Right) & SHANKHA (Upper Left) & HANDS
  // ----------------------------------------------------
  // Sudarshana Chakra (Upper Right: X: +1.9, Y: +2.1)
  for (let i = 0; i < countHandsHands * 0.35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.15 + Math.random() * 0.5;
    const cx = 1.9 + r * Math.cos(angle);
    const cy = 2.15 + r * Math.sin(angle);
    const cz = (Math.random() - 0.5) * 0.1;
    const isCenter = r < 0.2;
    addPoint(cx, cy, cz, isCenter ? COLOR_RED : COLOR_GOLD, 1.4, 0, 0.02);
  }

  // Panchajanya Shankha (Upper Left: X: -1.9, Y: +2.1)
  for (let i = 0; i < countHandsHands * 0.35; i++) {
    const t = Math.random() * Math.PI * 3.5;
    const r = 0.08 + (t / (Math.PI * 3.5)) * 0.5;
    const angle = t + (Math.random() - 0.5) * 0.2;
    const sx = -1.9 + r * Math.cos(angle) * 0.85;
    const sy = 2.15 + r * Math.sin(angle) * 1.1;
    const sz = (Math.random() - 0.5) * 0.15;
    addPoint(sx, sy, sz, Math.random() > 0.4 ? COLOR_GOLD : COLOR_WHITE, 1.4, 1, 0.02);
  }

  // Lower Right Hand (Varada Mudra pointing down at X: +0.9, Y: -0.1)
  for (let i = 0; i < countHandsHands * 0.15; i++) {
    const u = Math.random();
    const hx = 0.85 + (Math.random() - 0.5) * 0.2;
    const hy = -0.1 - u * 0.6;
    const hz = 0.35 + u * 0.1;
    addPoint(hx, hy, hz, COLOR_GOLD, 1.3, 0, 0.02);
  }

  // Lower Left Hand (Katyavalambita pose on hip at X: -0.9, Y: 0.0)
  for (let i = 0; i < countHandsHands * 0.15; i++) {
    const u = Math.random();
    const hx = -0.85 + (Math.random() - 0.5) * 0.2;
    const hy = 0.0 - u * 0.5;
    const hz = 0.35 + (Math.random() - 0.5) * 0.1;
    addPoint(hx, hy, hz, COLOR_GOLD, 1.3, 0, 0.02);
  }

  // ----------------------------------------------------
  // 5. CIRCULAR CHEST MEDALLIONS & GOLDEN NECKLACES (Y: -0.5 to +1.2)
  // ----------------------------------------------------
  for (let i = 0; i < countChestNecklaces; i++) {
    const u = Math.random();
    
    // Two prominent circular golden chest plates (Kaustubha / Lakshmi motifs)
    const isMedallion = u < 0.35;
    if (isMedallion) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const mAngle = Math.random() * Math.PI * 2;
      const mR = Math.random() * 0.22;
      const mx = side * 0.35 + mR * Math.cos(mAngle);
      const my = 0.95 + mR * Math.sin(mAngle);
      const mz = 0.38 + (Math.random() - 0.5) * 0.05;
      addPoint(mx, my, mz, COLOR_GOLD, 1.5, 0, 0.015);
    } else {
      // Cascading Salagrama mala gold necklace loops
      const tier = Math.floor(Math.random() * 6);
      const angle = (Math.random() - 0.5) * Math.PI * 0.85;
      const radius = 0.38 + tier * 0.14;
      const nx = radius * Math.sin(angle);
      const ny = 0.7 - tier * 0.26 - (1.0 - Math.cos(angle)) * 0.3;
      const nz = 0.36 - tier * 0.03;
      addPoint(nx, ny, nz, COLOR_GOLD, 1.2, 0, 0.02);
    }
  }

  // ----------------------------------------------------
  // 6. GARLANDS (Vanamala) - Dual Layer: Crimson Red Outer + White Inner
  // ----------------------------------------------------
  // Outer Crimson Red Flower Garland
  for (let i = 0; i < countGarlandRed; i++) {
    const t = Math.random(); // 0 (top shoulders) to 1 (past knees)
    const side = Math.random() > 0.5 ? 1 : -1;
    const gy = 1.4 - t * 4.3; // Y: +1.4 down to -2.9
    const width = 1.35 + Math.sin(t * Math.PI) * 0.35;
    const gx = side * (width + (Math.random() - 0.5) * 0.2);
    const gz = 0.25 + Math.sin(t * Math.PI) * 0.2;
    addPoint(gx, gy, gz, COLOR_RED, 1.4, 3, 0.03);
  }

  // Inner Jasmine White Flower Garland
  for (let i = 0; i < countGarlandWhite; i++) {
    const t = Math.random();
    const side = Math.random() > 0.5 ? 1 : -1;
    const gy = 1.4 - t * 4.3;
    const width = 1.05 + Math.sin(t * Math.PI) * 0.32;
    const gx = side * (width + (Math.random() - 0.5) * 0.16);
    const gz = 0.3 + Math.sin(t * Math.PI) * 0.2;
    addPoint(gx, gy, gz, COLOR_WHITE, 1.5, 1, 0.025);
  }

  // ----------------------------------------------------
  // 7. GOLDEN DHOTI & MAGENTA / PURPLE WAIST DRAPE
  // ----------------------------------------------------
  for (let i = 0; i < countDhotiPurple; i++) {
    const u = Math.random();
    const isPurpleDrape = u < 0.35; // Magenta drape on left waist/hip

    if (isPurpleDrape) {
      const dy = 0.0 - Math.random() * 2.2;
      const dx = -0.4 - Math.random() * 0.5;
      const dz = 0.35 + (Math.random() - 0.5) * 0.1;
      addPoint(dx, dy, dz, COLOR_PURPLE, 1.3, 3, 0.025);
    } else {
      // Golden Dhoti pleated folds
      const dy = -0.4 - u * 2.2;
      const dWidth = (0.65 + u * 0.35) * (1.0 + Math.sin(u * Math.PI * 14) * 0.05);
      const angle = (Math.random() - 0.5) * Math.PI * 0.75;
      const dx = dWidth * Math.sin(angle);
      const dz = dWidth * Math.cos(angle) * 0.45;
      addPoint(dx, dy, dz, COLOR_GOLD, 1.2, 0, 0.025);
    }
  }

  // ----------------------------------------------------
  // 8. BASE PEDESTAL & DIYA OIL LAMPS (Y: -3.2 to -2.6)
  // ----------------------------------------------------
  for (let i = 0; i < countBaseLamps; i++) {
    const part = Math.random();
    if (part < 0.7) {
      // Lotus Base Pedestal (Padma Peetham)
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.6;
      const px = r * Math.cos(angle);
      const py = -2.7 - Math.pow(r / 1.6, 2) * 0.45;
      const pz = r * Math.sin(angle) * 0.6;
      addPoint(px, py, pz, COLOR_GOLD, 1.2, 0, 0.03);
    } else {
      // Left & Right Golden Diya Lamps with glowing flame tips
      const side = Math.random() > 0.5 ? 1 : -1;
      const lx = side * 1.7 + (Math.random() - 0.5) * 0.2;
      const ly = -2.8 + Math.random() * 0.5;
      const lz = 0.3 + (Math.random() - 0.5) * 0.1;
      const isFlame = ly > -2.45;
      addPoint(lx, ly, lz, isFlame ? COLOR_RED : COLOR_GOLD, isFlame ? 1.6 : 1.2, isFlame ? 3 : 0, 0.02);
    }
  }

  // Ambient Space Particles
  while (index < totalCount) {
    const radius = 0.8 + Math.random() * 5.0;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const ax = radius * Math.sin(phi) * Math.cos(theta);
    const ay = radius * Math.sin(phi) * Math.sin(theta) * 0.8 + 0.5;
    const az = radius * Math.cos(phi) * 0.6;

    const rCol = Math.random();
    const color = rCol < 0.4 ? COLOR_GOLD : (rCol < 0.7 ? COLOR_WHITE : (rCol < 0.9 ? COLOR_RED : COLOR_PURPLE));
    const cat = rCol < 0.4 ? 0 : (rCol < 0.7 ? 1 : 3);

    addPoint(ax, ay, az, color, 0.9, cat, 0.04);
  }

  return {
    targetPositions,
    startPositions,
    particleColors,
    particleSizes,
    particlePhases,
    particleCategories,
    count: totalCount
  };
}
