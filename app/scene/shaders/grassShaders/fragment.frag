// fragment.frag

uniform vec2 u_resolution;
uniform sampler2D diffusel;
uniform sampler2D grassTexture;
uniform sampler2D terrainTexture;
uniform sampler2D windNoise;
uniform float time;
uniform float uWindSpeed;
uniform vec2 uWindDirection;

varying vec2 tilePosition;
varying vec3 vColor;
varying vec4 vGrassData;
varying vec2 vGrassTerrainUVPosition;

float inverseLerp(float v, float minValue, float maxValue) {
    return (v-minValue)/(maxValue-minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

float hash(vec2 p) {
    p = 50.0*fract(p*0.3183099+vec2(0.71, 0.113));
    return -1.0+2.0*fract(p.x*p.y*(p.x+p.y));
}

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
    float grassX = vGrassData.x;
    vec3 baseColor = texture2D(terrainTexture, vGrassTerrainUVPosition).rgb;

    //make the color brighter in the middle and darker on the side
    //slowly increase the brightness from +-0.125 to the middle of the grass 0.0
    //vec3 color = mix(baseColor * 0.75, baseColor, smoothstep(0.125, 0.0, abs(grassX)));

    float windNoiseSample = getWindNoiseSample(vGrassTerrainUVPosition);

    vec3 color = addWindEffect(baseColor, windNoiseSample);
    //vec3 color = mix( baseColor, baseColor * brightness, windEffectiveness);
    gl_FragColor = vec4(color, 1.0);
}