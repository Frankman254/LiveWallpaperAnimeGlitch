uniform float uShape;

varying vec3 vColor;
varying float vAlpha;
varying float vOffset;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);

  int shape = int(uShape);
  // shape 4 = all: vary per particle using vOffset
  if (shape == 4) {
    shape = int(mod(vOffset * 17.3, 4.0));
  }

  float d;
  if (shape == 1) {
    // Square
    d = max(abs(uv.x), abs(uv.y)) - 0.38;
  } else if (shape == 2) {
    // Diamond
    d = abs(uv.x) + abs(uv.y) - 0.43;
  } else if (shape == 3) {
    // 4-pointed star via polar modulation
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    float starR = 0.22 + 0.2 * abs(cos(2.0 * a));
    d = r - starR;
  } else {
    // Circle (shape == 0 default)
    d = length(uv) - 0.42;
  }

  float alpha = 1.0 - smoothstep(-0.01, 0.06, d);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, vAlpha * alpha);
}
