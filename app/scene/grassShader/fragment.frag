// fragment.frag

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D diffusel;
uniform sampler2D grassTexture;

varying vec2 tilePosition;
varying vec3 vColor;

float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

float hash(vec2 p){
    p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0*fract(p.x*p.y*(p.x+p.y));
}
void main() {
    vec3 color = texture2D(grassTexture, tilePosition).rgb;
    gl_FragColor = vec4(color, 1.0);
}