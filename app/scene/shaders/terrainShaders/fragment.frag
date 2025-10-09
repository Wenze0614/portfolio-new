#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>

uniform sampler2D terrainColorMap;
uniform float uWindSpeed;
uniform vec2 uWindDirection;
uniform sampler2D windNoise;
uniform float time;
uniform sampler2D grassMask;
uniform sampler2D terrainTexture;
uniform sampler2D grassTexture;

varying vec3 vNormalWS;
varying vec3 vPosWS;
varying vec2 vUv;
varying vec2 worldUv;

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

    float windNoiseSample = getWindNoiseSample(worldUv);
    float grassMask = texture2D(grassMask, worldUv).r;
    vec3 grassColor = texture2D(grassTexture, vUv).rgb;
    vec3 terrainColor = texture2D(terrainTexture, vUv).rgb;
    vec3 baseColor = mix(terrainColor, grassColor, grassMask);
    //vec3 baseColor = texture2D(terrainTexture, vUv).rgb;
    vec3 color = addWindEffect(baseColor, windNoiseSample);
    color = mix(baseColor, color, grassMask); //remove wind effect where no grass

    float shadowFactor = 1.0;
    #if NUM_DIR_LIGHTS > 0
    shadowFactor *= getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
    #endif

    vec3 ambient = 0.431*color;
    color = mix(ambient, color, shadowFactor);
    gl_FragColor = vec4(color, 1.0);
}