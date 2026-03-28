uniform float uTime;
uniform float uRainIntensity;
varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float rain = 0.0;

  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 offset = vec2(random(vec2(fi, 0.0)), 0.0);
    float speed = 0.5 + random(vec2(fi, 1.0)) * 0.5;
    float streak = fract(uv.y - uTime * speed + random(vec2(fi, 2.0)));
    float width = random(vec2(fi, 3.0)) * 0.002;
    float x = random(vec2(fi, 4.0));
    float dist = abs(uv.x - x + offset.x);
    rain += (1.0 - smoothstep(0.0, width, dist)) * (1.0 - streak);
  }

  gl_FragColor = vec4(0.6, 0.8, 1.0, rain * uRainIntensity * 0.3);
}
