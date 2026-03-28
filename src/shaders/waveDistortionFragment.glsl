uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uGlitchIntensity;
varying vec2 vUv;

float random(float x) {
  return fract(sin(x * 127.1) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  float band = floor(uv.y * 20.0);
  float offset = random(band + floor(uTime * 8.0)) * uGlitchIntensity;
  offset *= step(0.95, random(band + floor(uTime * 4.0)));

  uv.x += offset;

  float wave = sin(uv.y * 15.0 + uTime * 2.0) * 0.003 * uGlitchIntensity;
  uv.x += wave;

  gl_FragColor = texture2D(tDiffuse, uv);
}
