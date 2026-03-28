uniform sampler2D tImage;
uniform float uTime;
uniform float uGlitchIntensity;
uniform float uRgbShift;
uniform float uScanlineIntensity;
uniform bool uHasImage;
varying vec2 vUv;

float random(float x) {
  return fract(sin(x * 127.1) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // wave distortion + glitch bands
  float band = floor(uv.y * 20.0);
  float offset = random(band + floor(uTime * 8.0)) * uGlitchIntensity;
  offset *= step(0.95, random(band + floor(uTime * 4.0)));
  uv.x += offset;
  uv.x += sin(uv.y * 15.0 + uTime * 2.0) * 0.003 * uGlitchIntensity;

  vec4 color;
  if (uHasImage) {
    // RGB split
    float shift = uRgbShift * (sin(uTime * 3.0) * 0.5 + 0.5);
    float r = texture2D(tImage, uv + vec2(shift, 0.0)).r;
    float g = texture2D(tImage, uv).g;
    float b = texture2D(tImage, uv - vec2(shift, 0.0)).b;
    color = vec4(r, g, b, 1.0);
  } else {
    // fallback gradient
    vec3 col = mix(vec3(0.02, 0.0, 0.1), vec3(0.0, 0.05, 0.2), uv.y);
    col += vec3(0.05, 0.0, 0.1) * random(uv.x + uTime * 0.1) * 0.3;
    color = vec4(col, 1.0);
  }

  // scanlines
  float scanline = sin(vUv.y * 800.0) * 0.5 + 0.5;
  color.rgb -= pow(scanline, 1.2) * uScanlineIntensity;

  gl_FragColor = color;
}
