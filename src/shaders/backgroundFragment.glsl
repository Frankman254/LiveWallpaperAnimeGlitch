uniform sampler2D tImage;
uniform float uTime;
uniform float uGlitchIntensity;
uniform float uRgbShift;
uniform float uScanlineIntensity;
uniform bool uHasImage;
uniform float uImageScale;
uniform float uImageOffsetX;
uniform float uImageOffsetY;
uniform float uImageBassBoost;
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
    // Apply image scale (zoom) + position offset + bass reactive zoom
    float totalScale = uImageScale + uImageBassBoost;
    vec2 centeredUV = uv - 0.5;
    centeredUV /= max(totalScale, 0.01);
    centeredUV += vec2(uImageOffsetX, -uImageOffsetY); // Y flipped to match UI convention
    vec2 imgUV = centeredUV + 0.5;

    // RGB split applied to scaled UV
    float shift = uRgbShift * (sin(uTime * 3.0) * 0.5 + 0.5);
    float r = texture2D(tImage, imgUV + vec2(shift, 0.0)).r;
    float g = texture2D(tImage, imgUV).g;
    float b = texture2D(tImage, imgUV - vec2(shift, 0.0)).b;
    float a = texture2D(tImage, imgUV).a;
    color = vec4(r, g, b, a);

    // Transparent areas fall back to gradient
    if (color.a < 0.01) {
      vec3 bg = mix(vec3(0.02, 0.0, 0.1), vec3(0.0, 0.05, 0.2), vUv.y);
      color = vec4(bg, 1.0);
    } else {
      color.a = 1.0;
    }
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
