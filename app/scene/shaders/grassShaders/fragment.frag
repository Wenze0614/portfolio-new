// fragment.frag

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D diffusel;
uniform sampler2D grassTexture;
uniform sampler2D terrainTexture;

varying vec2 tilePosition;
varying vec3 vColor;
varying vec4 vGrassData;
varying vec2 vGrassTerrainUVPosition;

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
    float grassX = vGrassData.x;
    vec3 baseColor = texture2D(terrainTexture, vGrassTerrainUVPosition).rgb;
    //make the color brighter in the middle and darker on the side
    //slowly increase the brightness from +-0.125 to the middle of the grass 0.0
    //vec3 color = mix(baseColor * 0.75, baseColor, smoothstep(0.125, 0.0, abs(grassX)));
    gl_FragColor = vec4(baseColor, 1.0);
}