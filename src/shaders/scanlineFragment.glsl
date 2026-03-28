uniform sampler2D tDiffuse;
uniform float uScanlineIntensity;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  float scanline = sin(vUv.y * 800.0) * 0.5 + 0.5;
  scanline = pow(scanline, 1.2);
  color.rgb -= scanline * uScanlineIntensity;
  gl_FragColor = color;
}
