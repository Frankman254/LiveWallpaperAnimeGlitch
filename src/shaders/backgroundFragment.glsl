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
uniform float uImageAspect;   // image width / height
uniform float uCanvasAspect;  // canvas width / height
uniform int   uFitMode;       // 0=stretch 1=cover 2=contain 3=fit-width 4=fit-height
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

// Apply fit-mode UV transform to centered UV (already minus 0.5)
vec2 applyFitMode(vec2 c) {
  float ia = max(uImageAspect, 0.001);
  float ca = max(uCanvasAspect, 0.001);
  if (uFitMode == 1) {
    // cover — fill canvas, maintain ratio, crop excess
    if (ca > ia) { c.y *= ca / ia; } else { c.x *= ia / ca; }
  } else if (uFitMode == 2) {
    // contain — fit inside canvas, maintain ratio, letterbox
    if (ca > ia) { c.x *= ca / ia; } else { c.y *= ia / ca; }
  } else if (uFitMode == 3) {
    // fit-width — match canvas width, preserve ratio vertically
    c.y *= ca / ia;
  } else if (uFitMode == 4) {
    // fit-height — match canvas height, preserve ratio horizontally
    c.x *= ia / ca;
  }
  // uFitMode == 0 → stretch: no change
  return c;
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

    // Build image UV with fit mode
    vec2 c = applyFitMode(uv - 0.5);
    c /= max(totalScale, 0.01);
    c += vec2(uImageOffsetX, -uImageOffsetY);
    vec2 imgUV = c + 0.5;

    // Contain mode: pixels outside image bounds → fallback
    bool outOfBounds = (uFitMode == 2) &&
      (imgUV.x < 0.0 || imgUV.x > 1.0 || imgUV.y < 0.0 || imgUV.y > 1.0);

    float shift = uRgbShift * (sin(uTime * 3.0) * 0.5 + 0.5);

    vec4 curr;
    if (outOfBounds) {
      curr = vec4(fallbackBg, 1.0);
    } else {
      curr = sampleImage(tImage, imgUV, shift);
      if (curr.a < 0.01) curr = vec4(fallbackBg, 1.0);
      else curr.a = 1.0;
    }

    if (uHasPrevImage && uImageBlend < 1.0) {
      vec2 cp = applyFitMode(uv - 0.5);
      cp /= max(uImageScale, 0.01);
      cp += vec2(uImageOffsetX, -uImageOffsetY);
      vec2 prevUV = cp + 0.5;
      bool prevOut = (uFitMode == 2) &&
        (prevUV.x < 0.0 || prevUV.x > 1.0 || prevUV.y < 0.0 || prevUV.y > 1.0);

      vec4 prev;
      if (prevOut) {
        prev = vec4(fallbackBg, 1.0);
      } else {
        prev = sampleImage(tImagePrev, prevUV, shift);
        if (prev.a < 0.01) prev = vec4(fallbackBg, 1.0);
        else prev.a = 1.0;
      }
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
