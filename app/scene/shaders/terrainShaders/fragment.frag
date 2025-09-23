uniform sampler2D terrainColorMap;

varying vec3 vNormalWS;
varying vec3 vPosWS;
varying vec2 vUv;

void main() {
    // simple diffuse for preview
    vec3 N = normalize(vNormalWS);
    vec3 L = normalize(vec3(0.4, 1.0, 0.3));
    float ndl = max(dot(N, L), 0.0);
    vec3 col = mix(vec3(0.16, 0.3, 0.14), vec3(0.35, 0.6, 0.3), ndl);
    vec3 color = texture2D(terrainColorMap, vUv).rgb;
    gl_FragColor = vec4(color, 1.0);
}