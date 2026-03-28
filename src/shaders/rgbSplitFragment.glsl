uniform sampler2D tDiffuse;
uniform float uRgbShift;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float shift = uRgbShift * (sin(uTime * 3.0) * 0.5 + 0.5);

  float r = texture2D(tDiffuse, uv + vec2(shift, 0.0)).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv - vec2(shift, 0.0)).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
