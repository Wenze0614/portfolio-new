#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <fog_pars_fragment>

uniform sampler2D uTrunkTexture;

varying vec2 vUv;
varying vec3 vNormalWS;
varying vec3 vPosWS;
// varying vec4 vTerrainShadowCoord;

float inverseLerp(float v, float minValue, float maxValue) {
    return (v-minValue)/(maxValue-minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

void main() {

    vec3 color =texture2D(uTrunkTexture, vUv).rgb;

    //add light
    vec3 N = normalize(vNormalWS);
    vec3 L = normalize(directionalLights[0].direction);

    float ndl = dot(N, L);
    float brightness = remap(ndl, -1.0, 1.0, 0.25, 0.75);
    vec3 ambienLight = 0.25*color;
    color = ambienLight+color*directionalLights[0].color*brightness;
    // if(ndl<-0.9) {
    //     color = ambienLight+color*directionalLights[0].color*0.1;
    // }
    // if (ndl > uBrightnessThresholds[0])
    //     color = uColorMap[0];
    //   else if (ndl > uBrightnessThresholds[1])
    //     color = uColorMap[1];
    //   else if (ndl > uBrightnessThresholds[2])
    //     color = uColorMap[2];
    //   else
    //     color = uColorMap[3];

    //add shadow
    float shadowFactor = 1.0;
    #if NUM_DIR_LIGHTS > 0
    shadowFactor *= getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius,  vDirectionalShadowCoord[0]);
    // ✅ ignore self-shadowing:
    // only apply strong shadow if another solid occluder blocks the light
    // trick: clamp out near-1.0 alpha shadows
    //shadowFactor = mix(1.0, shadowFactor, 0.5); // or use smoothstep to soften
    #endif

    vec3 ambient = 0.7*color;
    color = mix(ambient, color, shadowFactor);

    gl_FragColor = vec4(color, 1.0);

    #include <fog_fragment>
}