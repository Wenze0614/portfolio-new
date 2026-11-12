uniform vec3 uColor;

varying float vAlpha;

void main() {
    // small bright core + a wide soft halo (the halo is what reads as "glowing" at a distance)
    float d = length(gl_PointCoord - 0.5);
    // (1 - smoothstep(lo, hi, x) rather than smoothstep(hi, lo, x): reversed edges are undefined in GLSL)
    float core = 1.0 - smoothstep(0.0, 0.12, d);
    float halo = pow(1.0 - smoothstep(0.0, 0.5, d), 2.0) * 0.6;
    float a = (core + halo) * vAlpha;
    if (a < 0.004) discard;
    // additive blending in three.js is (src.rgb * src.a + dst), so alpha carries the strength
    gl_FragColor = vec4(uColor, a);
}
