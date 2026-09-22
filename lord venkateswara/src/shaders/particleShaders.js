// particleShaders.js
// Custom GLSL shaders for 10-second particle noise morphing, dynamic shimmer, and divine bloom

export const particleVertexShader = /* glsl */`
  uniform float uTime;
  uniform float uProgress; // 0.0 to 1.0 (0-2s: 0.0, 2-6s: 0.0->1.0, 6-10s: 1.0)
  uniform float uPixelRatio;

  attribute vec3 aStartPosition;
  attribute vec3 aTargetPosition;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  attribute float aCategory;

  varying vec3 vColor;
  varying float vCategory;
  varying float vAlpha;
  varying float vShimmer;

  // 3D Simplex Noise Helper
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Smooth quintic interpolation
  float easeInOutQuint(float x) {
    return x < 0.5 ? 16.0 * x * x * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 5.0) / 2.0;
  }

  void main() {
    vColor = aColor;
    vCategory = aCategory;

    // Timeline progress with smooth step curve
    float tProg = easeInOutQuint(clamp(uProgress, 0.0, 1.0));

    // Turbulence / Curl Noise calculation
    vec3 noisePos = aStartPosition * 0.2 + vec3(uTime * 0.2, uTime * 0.15, aPhase);
    vec3 turbulence = vec3(
      snoise(noisePos),
      snoise(noisePos + vec3(17.1, 31.4, 4.3)),
      snoise(noisePos + vec3(5.2, 12.8, 93.1))
    ) * (1.0 - tProg * 0.85);

    // Position morphing from swirling space positions to divine silhouette target
    vec3 currentPos = mix(aStartPosition + turbulence * 1.5, aTargetPosition, tProg);

    // Micro breathing & aura shimmer when fully assembled (6s-10s)
    if (tProg > 0.7) {
      float shimmerPhase = sin(uTime * 3.5 + aPhase * 2.5);
      currentPos += vec3(
        sin(uTime * 1.2 + aPhase) * 0.012,
        cos(uTime * 1.5 + aPhase * 1.2) * 0.015,
        sin(uTime * 1.8 + aPhase * 0.5) * 0.012
      ) * (tProg - 0.7) * 2.5;

      vShimmer = 0.9 + 0.25 * shimmerPhase;
    } else {
      vShimmer = 1.0;
    }

    // Alpha fade in from darkness immediately within first 0.5s
    vAlpha = smoothstep(0.0, 0.04, uTime / 10.0) * (0.8 + 0.2 * sin(uTime * 2.5 + aPhase));

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Elegant delicate particle size attenuation (1px to 14px max)
    float finalSize = aSize * (1.0 + tProg * 0.3) * vShimmer;
    gl_PointSize = clamp(finalSize * (60.0 / max(0.1, -mvPosition.z)) * uPixelRatio, 1.0, 16.0);
  }
`;

export const particleFragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uProgress;

  varying vec3 vColor;
  varying float vCategory;
  varying float vAlpha;
  varying float vShimmer;

  void main() {
    // Distance from center of point sprite (0.0 to 0.5)
    vec2 circCoord = gl_PointCoord - vec2(0.5);
    float distSq = dot(circCoord, circCoord);
    if (distSq > 0.25) discard; // Smooth circular point sprite

    // Soft Gaussian-like radial glow falloff
    float glow = exp(-distSq * 12.0);
    float core = smoothstep(0.1, 0.0, sqrt(distSq));

    // Divine luminescence booster for Namam, Garlands, and Crown
    float categoryBoost = 1.0;
    if (vCategory > 0.5 && vCategory < 1.5) {
      // White Garland & Namam (Pure Diamond White)
      categoryBoost = 1.5;
    } else if (vCategory > 1.5 && vCategory < 2.5) {
      // Shankha / Chakra (Cosmic Sapphire / Cyan)
      categoryBoost = 1.4;
    } else if (vCategory > 2.5) {
      // Red Garlands & Ruby Jewels (Crimson Red)
      categoryBoost = 1.35;
    }

    vec3 finalColor = vColor * (glow * 1.1 + core * 1.4) * vShimmer * categoryBoost;

    // Sparkle starburst flash effect
    float sparkle = pow(max(0.0, sin(uTime * 5.0 + vAlpha * 40.0)), 14.0) * 0.6;
    finalColor += vec3(sparkle);

    gl_FragColor = vec4(finalColor, clamp(vAlpha * (glow * 0.85 + core * 0.4), 0.0, 1.0));
  }
`;
