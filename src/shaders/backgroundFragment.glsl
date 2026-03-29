uniform sampler2D tImage;
uniform sampler2D tImagePrev;
uniform float uTime;
uniform float uGlitchIntensity;
uniform float uGlitchFrequency;
uniform float uRgbShift;
uniform float uScanlineIntensity;
uniform float uNoiseIntensity;
uniform bool uHasImage;
uniform bool uHasPrevImage;
uniform float uImageScale;
uniform float uImageOffsetX;
uniform float uImageOffsetY;
uniform float uImageBassBoost;
uniform float uImageBlend;
varying vec2 vUv;

float random(float x) {
  return fract(sin(x * 127.1) * 43758.5453);
}

float random2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec4 sampleImage(sampler2D tex, vec2 uv, float shift) {
  float r = texture2D(tex, uv + vec2(shift, 0.0)).r;
  float g = texture2D(tex, uv).g;
  float b = texture2D(tex, uv - vec2(shift, 0.0)).b;
  float a = texture2D(tex, uv).a;
  return vec4(r, g, b, a);
}

vec2 applyScale(vec2 uv, float scale) {
  float totalScale = max(scale, 0.01);
  vec2 c = uv - 0.5;
  c /= totalScale;
  return c + 0.5;
}

void main() {
  vec2 uv = vUv;

  // Glitch bands
  float band = floor(uv.y * 20.0);
  float offset = random(band + floor(uTime * 8.0)) * uGlitchIntensity;
  offset *= step(1.0 - uGlitchFrequency, random(band + floor(uTime * 4.0)));
  uv.x += offset;
  uv.x += sin(uv.y * 15.0 + uTime * 2.0) * 0.003 * uGlitchIntensity;

  vec3 fallbackBg = mix(vec3(0.02, 0.0, 0.1), vec3(0.0, 0.05, 0.2), vUv.y);

  vec4 color;
  if (uHasImage) {
    float totalScale = uImageScale + uImageBassBoost;
    vec2 centeredUV = uv - 0.5;
    centeredUV /= max(totalScale, 0.01);
    centeredUV += vec2(uImageOffsetX, -uImageOffsetY);
    vec2 imgUV = centeredUV + 0.5;

    float shift = uRgbShift * (sin(uTime * 3.0) * 0.5 + 0.5);
    vec4 curr = sampleImage(tImage, imgUV, shift);
    if (curr.a < 0.01) curr = vec4(fallbackBg, 1.0);
    else curr.a = 1.0;

    if (uHasPrevImage && uImageBlend < 1.0) {
      vec2 prevUV = applyScale(uv, uImageScale) - 0.5 + vec2(uImageOffsetX, -uImageOffsetY) + 0.5;
      vec4 prev = sampleImage(tImagePrev, prevUV, shift);
      if (prev.a < 0.01) prev = vec4(fallbackBg, 1.0);
      else prev.a = 1.0;
      color = mix(prev, curr, uImageBlend);
    } else {
      color = curr;
    }
  } else {
    vec3 col = fallbackBg;
    col += vec3(0.05, 0.0, 0.1) * random(uv.x + uTime * 0.1) * 0.3;
    color = vec4(col, 1.0);
  }

  // Scanlines
  float scanline = sin(vUv.y * 800.0) * 0.5 + 0.5;
  color.rgb -= pow(scanline, 1.2) * uScanlineIntensity;

  // Film noise
  if (uNoiseIntensity > 0.0) {
    float noise = (random2(uv + fract(uTime * 7.3)) - 0.5) * uNoiseIntensity;
    color.rgb += noise;
  }

  gl_FragColor = color;
}
