uniform float uTime;
uniform float uRainIntensity;
uniform int   uDropCount;
uniform float uRainAngle;    // radians
uniform float uRainSpeed;
uniform float uRainLength;   // UV units, streak length
uniform float uRainWidth;    // UV units, half-width of each drop
uniform float uRainBlur;     // edge feather width
uniform vec3  uRainColor;
uniform int   uParticleType; // 0=lines 1=drops 2=dots 3=bars
varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // Rotate UV around center for rain angle
  float cosA = cos(uRainAngle);
  float sinA = sin(uRainAngle);
  vec2 centered = vUv - 0.5;
  vec2 rotUV = vec2(
    cosA * centered.x + sinA * centered.y,
    -sinA * centered.x + cosA * centered.y
  ) + 0.5;

  float rain = 0.0;
  float halfW = max(uRainWidth, 0.0005);
  float blur  = max(uRainBlur, 0.0001);

  for (int i = 0; i < 100; i++) {
    if (i >= uDropCount) break;

    float fi = float(i);
    float n  = float(uDropCount);

    // Even distribution across full [0,1] width with per-drop jitter
    float dropX = (fi + 0.5 + (random(vec2(fi, 9.3)) - 0.5) * 0.6) / n;

    float spd    = uRainSpeed * (0.55 + random(vec2(fi, 1.1)) * 0.9);
    float phase  = random(vec2(fi, 2.7));
    // headY: leading edge, falls 1→0 (top to bottom in Three.js UV)
    float headY  = 1.0 - fract(uTime * spd * 0.22 + phase);

    float dx      = rotUV.x - dropX;
    float trailDY = rotUV.y - headY; // > 0 means pixel is above head = in trail

    // Horizontal proximity weight (common to all types)
    float xW = 1.0 - smoothstep(halfW, halfW + blur, abs(dx));
    if (xW <= 0.001) continue;

    float contrib = 0.0;

    if (uParticleType == 0) {
      // Lines: tapered streak trailing above the head
      if (trailDY >= 0.0 && trailDY < uRainLength) {
        contrib = xW * (1.0 - trailDY / uRainLength);
      }
    } else if (uParticleType == 1) {
      // Drops: teardrop — wide at head, narrow tail
      float stretchY = max(trailDY, 0.0) / max(uRainLength * 0.4, 0.001);
      float dist = sqrt(dx * dx * 3.0 + stretchY * stretchY);
      contrib = (1.0 - smoothstep(0.0, halfW + blur, dist)) * xW;
      if (trailDY < 0.0 || trailDY > uRainLength * 0.55) contrib = 0.0;
    } else if (uParticleType == 2) {
      // Dots: circular splat at head position
      float dist = sqrt(dx * dx + (trailDY - halfW) * (trailDY - halfW));
      contrib = 1.0 - smoothstep(0.0, halfW + blur, dist);
    } else {
      // Bars: uniform solid rectangle
      if (trailDY >= 0.0 && trailDY < uRainLength) {
        contrib = xW;
      }
    }

    rain += contrib;
  }

  rain = clamp(rain, 0.0, 1.0);
  gl_FragColor = vec4(uRainColor, rain * uRainIntensity * 0.7);
}
