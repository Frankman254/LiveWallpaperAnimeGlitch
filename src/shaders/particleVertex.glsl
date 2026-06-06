attribute float aSize;
attribute vec3 aColor;
attribute float aOffset;
attribute float aLife;

uniform float uTime;
uniform float uOpacity;
uniform float uGlowStrength;
uniform float uAmplitude;
uniform float uAudioSizeBoost;
uniform float uMaxPointSize;
uniform float uAudioOpacityBoost;
uniform float uDepthAmplitude;
uniform float uDepthSizeBoost;
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
    size += pow(clamp(uAmplitude, 0.0, 1.0), 0.82) * uAudioSizeBoost;
    alpha += uAmplitude * uAudioOpacityBoost;
  }
  size += pow(clamp(uDepthAmplitude, 0.0, 1.0), 0.9) * uDepthSizeBoost;
  alpha += uDepthAmplitude * 0.12;
  vAlpha = clamp(alpha, 0.0, 1.0);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  // Direct pixel size — no distance attenuation (works for flat 2D wallpaper)
  gl_PointSize = min(size, uMaxPointSize);
  gl_Position = projectionMatrix * mvPosition;
}
