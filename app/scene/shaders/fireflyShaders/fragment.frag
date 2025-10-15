void main () {
    float w = distance(gl_PointCoord, vec2(0.5));
    // w = smoothstep(0.5, 0.0, w);
    w = (0.05/w) - 0.1;
    gl_FragColor = vec4(1.0, 1.0, 0.8, w);
}