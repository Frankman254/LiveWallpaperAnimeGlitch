uniform sampler2D tImage;
uniform sampler2D tImagePrev;
uniform float uTime;
uniform float uGlitchIntensity;
uniform float uGlitchFrequency;
uniform int   uGlitchStyle;
uniform float uRgbShift;
uniform float uScanlineIntensity;
uniform int   uScanlineMode;
uniform float uScanlineSpacing;
uniform float uScanlineThickness;
uniform float uAudioLevel;
uniform float uNoiseIntensity;
uniform bool uHasImage;
uniform bool uImageRequested;
uniform bool uHasPrevImage;
uniform float uImageScale;
uniform float uImageOffsetX;
uniform float uImageOffsetY;
uniform float uImageBassBoost;
uniform float uImageBlend;
uniform float uImageAspect;   // image width / height
uniform float uPrevImageAspect;
uniform float uCanvasAspect;  // canvas width / height
uniform int   uFitMode;       // 0=stretch 1=cover 2=contain 3=fit-width 4=fit-height
uniform float uPrevImageScale;
uniform float uPrevImageOffsetX;
uniform float uPrevImageOffsetY;
uniform int   uPrevFitMode;
uniform int   uTransitionType; // 0=fade 1=slide-left 2=slide-right 3=zoom-in 4=dissolve 5=bars-h 6=bars-v 7=rgb-shift 8=distortion
uniform float uTransitionForce;
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
vec2 applyFitMode(vec2 c, int fitMode, float imageAspect) {
  float ia = max(imageAspect, 0.001);
  float ca = max(uCanvasAspect, 0.001);
  if (fitMode == 1) {
    // cover — fill canvas, maintain ratio, crop excess
    if (ca > ia) { c.y *= ca / ia; } else { c.x *= ia / ca; }
  } else if (fitMode == 2) {
    // contain — fit inside canvas, maintain ratio, letterbox
    if (ca > ia) { c.x *= ca / ia; } else { c.y *= ia / ca; }
  } else if (fitMode == 3) {
    // fit-width — match canvas width, preserve ratio vertically
    c.y *= ca / ia;
  } else if (fitMode == 4) {
    // fit-height — match canvas height, preserve ratio horizontally
    c.x *= ia / ca;
  }
  // fitMode == 0 → stretch: no change
  return c;
}

// Sample a texture at canvas UV (0-1), applying fit mode, scale, and position.
// Returns fallback color if the canvas UV is outside [0,1] or out of image bounds.
vec4 sampleTexAtCanvasUV(sampler2D tex, vec2 canvasUV, float scale, float offX, float offY, int fitMode, float imageAspect, float shift, vec3 fallback) {
  if (canvasUV.x < 0.0 || canvasUV.x > 1.0 || canvasUV.y < 0.0 || canvasUV.y > 1.0) {
    return vec4(fallback, 1.0);
  }
  vec2 c = applyFitMode(canvasUV - 0.5, fitMode, imageAspect);
  c /= max(scale, 0.01);
  c += vec2(offX, -offY);
  vec2 imgUV = c + 0.5;
  bool outOfBounds = (fitMode == 2) && (imgUV.x < 0.0 || imgUV.x > 1.0 || imgUV.y < 0.0 || imgUV.y > 1.0);
  if (outOfBounds) return vec4(fallback, 1.0);
  return vec4(sampleImage(tex, imgUV, shift).rgb, 1.0);
}

void main() {
  vec2 uv = vUv;

  if (uGlitchStyle == 0) {
    float band = floor(uv.y * 20.0);
    float offset = random(band + floor(uTime * 8.0)) * uGlitchIntensity;
    offset *= step(1.0 - uGlitchFrequency, random(band + floor(uTime * 4.0)));
    uv.x += offset;
    uv.x += sin(uv.y * 15.0 + uTime * 2.0) * 0.003 * uGlitchIntensity;
  } else if (uGlitchStyle == 1) {
    vec2 block = floor(uv * vec2(18.0, 10.0));
    float active = step(1.0 - uGlitchFrequency, random2(block + floor(uTime * 6.0)));
    float blockOffset = (random2(block + 17.0 + floor(uTime * 9.0)) - 0.5) * 0.18 * uGlitchIntensity;
    uv.x += blockOffset * active;
    uv.y += (random2(block + 9.0 + floor(uTime * 7.0)) - 0.5) * 0.03 * uGlitchIntensity * active;
  } else {
    vec2 pixelGrid = vec2(280.0, 160.0);
    vec2 pxUV = floor(uv * pixelGrid) / pixelGrid;
    float active = step(1.0 - uGlitchFrequency, random2(vec2(floor(uTime * 11.0), floor(uv.y * 60.0))));
    float pixelOffset = (random2(vec2(floor(uv.y * 120.0), floor(uTime * 5.0))) - 0.5) * 0.12 * uGlitchIntensity;
    uv = mix(uv, pxUV, min(1.0, uGlitchIntensity * 2.0));
    uv.x += pixelOffset * active;
  }

  vec3 fallbackBg = mix(vec3(0.02, 0.0, 0.1), vec3(0.0, 0.05, 0.2), vUv.y);

  vec4 color;
  if (uHasImage) {
    float blend = uImageBlend;
    float shift = uRgbShift * (sin(uTime * 3.0) * 0.5 + 0.5);
    float transitionEnergy = 1.0 - blend;
    float transitionForce = max(0.2, uTransitionForce);

    // Compute canvas UV offsets and scale adjustments based on transition type
    vec2 currCanvasUV = uv;
    vec2 prevCanvasUV = uv;
    float currScale = uImageScale + uImageBassBoost;

    if (uHasPrevImage && blend < 1.0) {
      if (uTransitionType == 1) {
        // Slide left: curr enters from right, prev exits to left
        currCanvasUV.x = uv.x - (1.0 - blend) * mix(0.9, 1.2, min(1.0, (transitionForce - 0.2) / 2.2));
        prevCanvasUV.x = uv.x + blend * mix(1.0, 1.14, min(1.0, (transitionForce - 0.2) / 2.2));
      } else if (uTransitionType == 2) {
        // Slide right: curr enters from left, prev exits to right
        currCanvasUV.x = uv.x + (1.0 - blend) * mix(0.9, 1.2, min(1.0, (transitionForce - 0.2) / 2.2));
        prevCanvasUV.x = uv.x - blend * mix(1.0, 1.14, min(1.0, (transitionForce - 0.2) / 2.2));
      } else if (uTransitionType == 3) {
        // Zoom in: curr grows from 50% to full size; prev stays normal
        currScale *= mix(max(0.2, 0.55 - transitionForce * 0.14), 1.0, blend);
      }
    }

    if (uTransitionType == 7 && uHasPrevImage && blend < 1.0) {
      float wobble = sin(uv.y * 19.0 + uTime * 7.0) * 0.02 * transitionEnergy * transitionForce;
      currCanvasUV.x += wobble;
      prevCanvasUV.x -= wobble * 0.7;
    } else if (uTransitionType == 8 && uHasPrevImage && blend < 1.0) {
      vec2 centered = uv - 0.5;
      float radius = length(centered);
      vec2 wave = vec2(
        sin(uv.y * 20.0 + uTime * 4.0 + radius * 18.0),
        cos(uv.x * 14.0 - uTime * 3.5 - radius * 12.0)
      ) * (0.035 * transitionEnergy * transitionForce);
      currCanvasUV += wave;
      prevCanvasUV -= wave * 0.65;
    }

    float currShift = shift;
    float prevShift = shift;
    if (uTransitionType == 7 && uHasPrevImage && blend < 1.0) {
      float exaggeratedShift = max(uRgbShift * 4.0, 0.01) + transitionEnergy * 0.028 * transitionForce;
      currShift = exaggeratedShift;
      prevShift = exaggeratedShift * 0.7;
    }

    vec4 curr = sampleTexAtCanvasUV(tImage, currCanvasUV, currScale, uImageOffsetX, uImageOffsetY, uFitMode, uImageAspect, currShift, fallbackBg);

    if (uHasPrevImage && blend < 1.0) {
      vec4 prev = sampleTexAtCanvasUV(tImagePrev, prevCanvasUV, uPrevImageScale, uPrevImageOffsetX, uPrevImageOffsetY, uPrevFitMode, uPrevImageAspect, prevShift, fallbackBg);

      if (uTransitionType == 1 || uTransitionType == 2) {
        // Slide: hard seam with a small smooth zone at the boundary
        float seamPos = (uTransitionType == 1) ? (1.0 - blend) : blend;
        float edge = 0.015;
        float alpha = (uTransitionType == 1)
          ? smoothstep(seamPos - edge, seamPos + edge, uv.x)
          : 1.0 - smoothstep(seamPos - edge, seamPos + edge, uv.x);
        color = mix(prev, curr, alpha);
      } else if (uTransitionType == 3) {
        // Zoom in: fade + zoom
        color = mix(prev, curr, blend);
      } else if (uTransitionType == 4) {
        // Dissolve: soft noisy reveal with warped cells to avoid hard black gaps
        vec2 cells = floor(uv * vec2(48.0 + transitionForce * 18.0, 28.0 + transitionForce * 10.0));
        float noise = random2(cells + floor(uTime * 2.0) * 0.17);
        float edge = mix(0.24, 0.12, min(1.0, transitionForce / 2.5));
        float mask = smoothstep(blend - edge, blend + edge, noise);
        float burst = smoothstep(0.0, 0.65, blend) * (1.0 - smoothstep(0.72, 1.0, blend));
        vec3 edgeTint = vec3(0.22, 0.42, 0.95) * burst * (1.0 - abs(noise - blend) / max(edge, 0.001));
        color = mix(prev, curr, mask);
        color.rgb += edgeTint * (0.12 + transitionForce * 0.04);
      } else if (uTransitionType == 5 || uTransitionType == 6) {
        // Bars H/V: stripe-based reveal with per-stripe delay and subtle jitter
        float stripes = (uTransitionType == 5)
          ? (14.0 + transitionForce * 3.0)
          : (18.0 + transitionForce * 5.0);
        float index = floor(((uTransitionType == 5) ? uv.y : uv.x) * stripes);
        float delay = random(index * 1.73 + 3.1) * 0.46;
        float local = clamp((blend - delay) / max(0.2, 1.0 - delay), 0.0, 1.0);
        float soft = smoothstep(0.0, 1.0, local);
        float jitter = (random(index * 7.31 + floor(uTime * 7.0)) - 0.5) * 0.16 * (1.0 - soft) * transitionForce;
        vec2 currStripeUV = currCanvasUV;
        vec2 prevStripeUV = prevCanvasUV;
        if (uTransitionType == 5) {
          currStripeUV.x += jitter;
          prevStripeUV.x -= jitter * 0.55;
        } else {
          currStripeUV.y += jitter;
          prevStripeUV.y -= jitter * 0.55;
        }
        vec4 currStripe = sampleTexAtCanvasUV(tImage, currStripeUV, currScale, uImageOffsetX, uImageOffsetY, uFitMode, uImageAspect, currShift, fallbackBg);
        vec4 prevStripe = sampleTexAtCanvasUV(tImagePrev, prevStripeUV, uPrevImageScale, uPrevImageOffsetX, uPrevImageOffsetY, uPrevFitMode, uPrevImageAspect, prevShift, fallbackBg);
        color = mix(prevStripe, currStripe, soft);
      } else if (uTransitionType == 7) {
        // RGB Split: exaggerated channel separation that resolves into the next image
        float glow = transitionEnergy * 0.28 * transitionForce;
        color = mix(prev, curr, blend);
        color.rgb += vec3(glow * 0.65, glow * 0.2, glow * 0.75) * 0.22;
      } else if (uTransitionType == 8) {
        // Distortion: wave-warp blend with slight highlight
        float shimmer = sin((uv.x + uv.y + uTime) * 18.0) * 0.5 + 0.5;
        color = mix(prev, curr, blend);
        color.rgb += shimmer * transitionEnergy * transitionForce * vec3(0.05, 0.08, 0.16);
      } else {
        // Fade (type 0): simple crossfade
        color = mix(prev, curr, blend);
      }
    } else {
      color = curr;
    }
  } else {
    if (uImageRequested) {
      color = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      vec3 col = fallbackBg;
      col += vec3(0.05, 0.0, 0.1) * random(uv.x + uTime * 0.1) * 0.3;
      color = vec4(col, 1.0);
    }
  }

  // Scanlines
  float spacing = max(1.0, uScanlineSpacing);
  float line = sin(vUv.y * spacing) * 0.5 + 0.5;
  float scanline = pow(line, max(0.1, uScanlineThickness));
  float scanlineAmount = uScanlineIntensity;
  if (uScanlineMode == 1) {
    scanlineAmount *= 0.45 + 0.55 * (sin(uTime * 2.6) * 0.5 + 0.5);
  } else if (uScanlineMode == 2) {
    float burst = step(0.72, random(floor(uTime * 2.0) + 11.0));
    scanlineAmount *= mix(0.18, 1.35, burst * (0.55 + 0.45 * (sin(uTime * 38.0) * 0.5 + 0.5)));
  } else if (uScanlineMode == 3) {
    scanlineAmount *= 0.3 + min(1.6, uAudioLevel * 1.4);
  }
  color.rgb -= scanline * scanlineAmount;

  // Film noise
  if (uNoiseIntensity > 0.0) {
    float noise = (random2(uv + fract(uTime * 7.3)) - 0.5) * uNoiseIntensity;
    color.rgb += noise;
  }

  gl_FragColor = color;
}
