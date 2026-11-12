uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;
uniform float uStrength;

varying vec2 vUv;

vec3 screenBlend(vec3 a, vec3 b) {
    return vec3(1.0) - (vec3(1.0) - a) * (vec3(1.0) - b);
}
void main(){
    vec4 baseColor = texture2D(baseTexture, vUv);
    vec4 bloomColor = vec4(uStrength) * texture2D(bloomTexture, vUv);
    // vec4 bloomColor = texture2D(bloomTexture, vUv);
    // Screen blend assumes 0..1 inputs: if both are above 1 (bright firefly cores in the half-float
    // buffers), (1 - a) * (1 - b) turns positive again and the pixel goes black. Clamp first; values
    // already inside 0..1, i.e. everything else in the scene, are unchanged.
    vec3 blend = screenBlend(clamp(baseColor.rgb, 0.0, 1.0), clamp(bloomColor.rgb, 0.0, 1.0));
    gl_FragColor = vec4(blend, 1.0);
    // gl_FragColor = texture2D(baseTexture, vUv);
}