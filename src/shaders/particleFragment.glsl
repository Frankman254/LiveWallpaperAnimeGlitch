uniform float uTime;
uniform float uShape;
uniform float uGlowStrength;
uniform float uRotationIntensity;
uniform float uRotationDirection;
uniform float uRotateRgb;

varying vec3 vColor;
varying float vAlpha;
varying float vOffset;
varying float vGlowScale;
varying float vGlowReach;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  float glowScale = max(vGlowScale, 1.0);
  vec2 uv = (gl_PointCoord - vec2(0.5)) * glowScale;
  float rotationAngle = (uTime * uRotationIntensity * 1.45 + vOffset * 2.6) * uRotationDirection;
  float s = sin(rotationAngle);
  float c = cos(rotationAngle);
  vec2 rotatedUv = uRotationIntensity > 0.001
    ? mat2(c, -s, s, c) * uv
    : uv;

  int shape = int(uShape + 0.5);
  if (shape == 8) {
    shape = int(mod(vOffset * 31.7, 8.0));
  }

  float d;
  if (shape == 1) {
    d = max(abs(rotatedUv.x), abs(rotatedUv.y)) - 0.38;
  } else if (shape == 2) {
    vec2 tri = vec2(rotatedUv.x, rotatedUv.y + 0.08);
    d = max(abs(tri.x) * 1.15 + tri.y * 0.78, -tri.y) - 0.24;
  } else if (shape == 3) {
    float r = length(rotatedUv);
    float a = atan(rotatedUv.y, rotatedUv.x);
    float starR = 0.22 + 0.2 * abs(cos(2.0 * a));
    d = r - starR;
  } else if (shape == 4) {
    d = min(sdBox(rotatedUv, vec2(0.13, 0.4)), sdBox(rotatedUv, vec2(0.4, 0.13)));
  } else if (shape == 5) {
    d = sdBox(rotatedUv, vec2(0.4, 0.11));
  } else if (shape == 6) {
    d = abs(rotatedUv.x) + abs(rotatedUv.y) - 0.43;
  } else if (shape == 7) {
    vec2 rot = mat2(0.70710678, -0.70710678, 0.70710678, 0.70710678) * rotatedUv;
    d = min(sdBox(rot, vec2(0.11, 0.38)), sdBox(rot, vec2(0.38, 0.11)));
  } else {
    d = length(rotatedUv) - 0.42;
  }

  float coreAlpha = 1.0 - smoothstep(-0.012, 0.045, d);
  float glowDistance = max(d, 0.0);
  float glowMix = clamp(uGlowStrength / 1.2, 0.0, 1.0);
  float reachMix = clamp((vGlowReach - 1.0) / 2.0, 0.0, 1.0);
  float glowSpread = mix(10.5, 2.7, glowMix) * mix(1.0, 0.38, reachMix);
  float haloAlpha = exp(-glowSpread * glowDistance) * uGlowStrength * (0.58 + reachMix * 0.34);
  float alpha = max(coreAlpha, haloAlpha * 0.85);
  if (alpha < 0.01) discard;

  vec3 color = vColor;
  if (uRotateRgb > 0.5) {
    // Full visible-spectrum HSV cycle (S=1, V=1) so pure reds, oranges,
    // yellows, greens, blues and violets are all reachable — same quality
    // as the spectrum visualiser's rainbow mode.
    float h = fract(uTime * 0.12 + vOffset * 0.159);
    color = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  }

  vec3 haloTint = mix(color, vec3(1.0), 0.28);
  vec3 glowColor = color * coreAlpha + haloTint * haloAlpha * 2.4;
  gl_FragColor = vec4(glowColor, vAlpha * alpha);
}
