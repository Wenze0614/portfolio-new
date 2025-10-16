uniform float uTime;

varying vec3 vPosWS;

void main () {
    float w = distance(gl_PointCoord, vec2(0.5));
    // w = smoothstep(0.5, 0.0, w);
    w = (0.05/w) - 0.1;
    w *= abs(sin(uTime + vPosWS.x * 10.0));
    if(w<0.3) discard;
    gl_FragColor = vec4(1.0, 1.0, 0.8, w);
}