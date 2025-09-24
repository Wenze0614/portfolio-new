uniform sampler2D terrainColorMap;
uniform float uWindSpeed;
uniform vec2 uWindDirection;
uniform sampler2D windNoise;
uniform float time;
uniform sampler2D grassMask;

varying vec3 vNormalWS;
varying vec3 vPosWS;
varying vec2 vUv;


float getWindNoiseSample(vec2 uv) {
    vec2 flow = normalize(uWindDirection)*uWindSpeed*time;
    vec2 uvWind = uv+flow*0.03;
    float windNoiseSample = texture2D(windNoise, uvWind).r;
    return windNoiseSample;
}

vec3 addWindEffect(vec3 baseColor, float windNoiseSample) {
    float brightness = mix(0.7, 1.1, windNoiseSample);
    float edgeFactor = smoothstep(0.2, 0.5, abs(windNoiseSample-0.5));
    float windEffectiveness = mix(0.1, 0.341, edgeFactor);
    return 0.9*baseColor+windEffectiveness*baseColor*brightness;

}
void main() {
    // // simple diffuse for preview
    // vec3 N = normalize(vNormalWS);
    // vec3 L = normalize(vec3(0.4, 1.0, 0.3));
    // float ndl = max(dot(N, L), 0.0);
    // vec3 col = mix(vec3(0.16, 0.3, 0.14), vec3(0.35, 0.6, 0.3), ndl);
    vec3 baseColor = texture2D(terrainColorMap, vUv).rgb;
    float windNoiseSample = getWindNoiseSample(vUv);
    float grassMask = texture2D(grassMask, vUv).r;
    vec3 color = addWindEffect(baseColor, windNoiseSample);
    color = mix(baseColor, color, grassMask); //remove wind effect where no grass
    gl_FragColor = vec4(color, 1.0);
}