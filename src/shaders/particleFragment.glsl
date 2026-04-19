uniform float uTime;
uniform float uShape;
uniform float uGlowStrength;
uniform float uScanlineIntensity;
uniform float uScanlineSpacing;
uniform float uScanlineThickness;
uniform float uRotationIntensity;
uniform float uRotationDirection;
uniform float uRotateRgb;

varying vec3 vColor;
varying float vAlpha;
varying float vOffset;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
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

  float alpha = 1.0 - smoothstep(-0.01, 0.06, d);
  alpha = max(alpha, exp(-16.0 * max(d, 0.0)) * uGlowStrength * 0.35);
  if (alpha < 0.01) discard;

  vec3 color = vColor;
  if (uRotateRgb > 0.5) {
    color = 0.52 + 0.48 * cos(vec3(0.0, 2.094395, 4.18879) + uTime * 1.05 + vOffset * 5.5);
  }
  if (uScanlineIntensity > 0.001) {
    float spacing = max(2.0, uScanlineSpacing);
    float lineThickness = clamp(uScanlineThickness / spacing, 0.01, 0.9);
    float line = fract(gl_FragCoord.y / spacing);
    float darkBand = 1.0 - smoothstep(0.0, lineThickness, line);
    color *= 1.0 - darkBand * uScanlineIntensity * 0.72;
    color += vec3(darkBand * uScanlineIntensity * 0.08);
  }

  gl_FragColor = vec4(color, vAlpha * alpha);
}
