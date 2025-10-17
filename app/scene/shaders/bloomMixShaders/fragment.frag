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
    vec3 blend = screenBlend(baseColor.rgb, bloomColor.rgb);
    gl_FragColor = vec4(blend, 1.0);
    // gl_FragColor = texture2D(baseTexture, vUv);
}