attribute float aSize;
attribute vec3 aColor;
attribute float aOffset;
attribute float aLife;

uniform float uTime;
uniform float uOpacity;
uniform float uGlowStrength;
uniform float uAmplitude;
uniform float uAudioSizeBoost;
uniform bool uAudioReactive;
uniform bool uFadeInOut;

varying vec3 vColor;
varying float vAlpha;
varying float vOffset;

void main() {
  vColor = aColor;
  vOffset = aOffset;

  // Twinkle
  float twinkle = sin(uTime * 1.5 + aOffset * 6.28) * 0.3 + 0.7;
  float alpha = uOpacity * twinkle;

  // Fade in / fade out based on life cycle
  if (uFadeInOut) {
    float fadeIn  = smoothstep(0.0, 0.12, aLife);
    float fadeOut = 1.0 - smoothstep(0.82, 1.0, aLife);
    alpha *= fadeIn * fadeOut;
  }

  float size = aSize;
  if (uAudioReactive) {
    size += uAmplitude * uAudioSizeBoost;
    alpha += uAmplitude * 0.3;
  }
  vAlpha = clamp(alpha, 0.0, 1.0);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  // Direct pixel size — no distance attenuation (works for flat 2D wallpaper)
  gl_PointSize = size;
  gl_Position = projectionMatrix * mvPosition;
}
