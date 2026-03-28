varying vec3 vColor;
varying float vAlpha;

void main() {
  // Soft circle
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  float alpha = 1.0 - smoothstep(0.35, 0.5, d);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, vAlpha * alpha);
}
