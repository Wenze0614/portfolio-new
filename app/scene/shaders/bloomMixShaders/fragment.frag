uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;
uniform float uStrength;

varying vec2 vUv;

void main(){
    vec4 baseColor = texture2D(baseTexture, vUv);
    vec4 bloomColor = vec4(uStrength) * texture2D(bloomTexture, vUv);
    // vec4 bloomColor = texture2D(bloomTexture, vUv);
    gl_FragColor = (baseColor + bloomColor);
    // gl_FragColor = texture2D(baseTexture, vUv);
}