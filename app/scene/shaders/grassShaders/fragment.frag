#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <fog_pars_fragment>

uniform vec2 u_resolution;
uniform sampler2D diffusel;
uniform sampler2D grassTexture;
uniform sampler2D terrainTexture;
uniform sampler2D windNoise;
uniform float time;
uniform float uWindSpeed;
uniform vec2 uWindDirection;
uniform sampler2D grassMask;

varying vec2 tilePosition;
varying vec3 vColor;
varying vec4 vGrassData;
varying vec2 vGrassTerrainUVPosition;
varying vec3 vNormalWS;
varying float vGrassHeightPercent;
varying vec3 vPosWS;

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
    //vec3 baseColor = texture2D(terrainTexture, vGrassTerrainUVPosition).rgb;

    float grassMask = texture2D(grassMask, vGrassTerrainUVPosition).r;
    vec3 grassColor = texture2D(grassTexture, tilePosition).rgb;
    vec3 terrainColor = texture2D(terrainTexture, tilePosition).rgb;
    //vec3 baseColor = grassMask >= 0.7 ? grassColor: mix(terrainColor, grassColor, grassMask);
    //vec3 baseColor = grassMask>= 0.35 ? grassColor : mix(terrainColor,grassColor, grassMask);
    vec3 baseColor = mix(terrainColor, grassColor, grassMask);

    //make the color brighter in the middle and darker on the side
    //slowly increase the brightness from +-0.125 to the middle of the grass 0.0
    //vec3 color = mix(baseColor * 0.75, baseColor, smoothstep(0.125, 0.0, abs(grassX)));

    float windNoiseSample = getWindNoiseSample(vGrassTerrainUVPosition);

    vec3 color = addWindEffect(baseColor, windNoiseSample);
    //vec3 color = mix( baseColor, baseColor * brightness, windEffectiveness);

    //add light
    vec3 N = normalize(vNormalWS);
    vec3 L = normalize(directionalLights[0].direction);

    float ndl = dot(N, L);
    //float brighdness = remap(ndl,-1.0, 1.0, 0.25, 0.75);
    float brightness = mix(0.0, 0.13, ndl*vGrassHeightPercent);
    //vec3 ambienLight = 0.25*color;
    //color = color + directionalLights[0].color*brightness;

    //add shadow
    // float shadowFactor = 1.0;
    // #if NUM_DIR_LIGHTS > 0
    // shadowFactor *= getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
    // #endif
    // vec3 ambient = 0.314*color;
    // color = mix(ambient, color, shadowFactor);

    float shadowFactor = 1.0;
    #if NUM_DIR_LIGHTS > 0
    shadowFactor *= getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
    #endif

    vec3 ambient = 0.431*color;
    color = mix(ambient, color, shadowFactor);

    // --- Spotlight params ---
    float spotDistance = 20.0;      // max reach (0 = infinite)
    float spotAngle = PI*0.25; // outer cone angle (radians), e.g. 45°
    float spotPenumbra = 0.5;       // 0..1 (0 = hard edge, 1 = wide soft edge)
    float spotDecay = 0.0;       // remove distance decay for better visibility

    vec3 spotPos = vec3(10.0, 10.0, 50.0); // light position (WS)
    vec3 spotTarget = vec3(10.0, 0.0, 50.0); // target point (WS)
    vec3 spotAxis = normalize(spotTarget-spotPos); // light->target axis (WS)
    vec3 spotColor = vec3(1.0);

// Precompute cosines for falloff region
    float outerCos = cos(spotAngle);                          // outer
    float innerCos = cos(spotAngle*(1.0-spotPenumbra));   // inner (>= outer)

// Per-fragment lighting data
    vec3 P = vPosWS;
    vec3 NSpot = normalize(vNormalWS);
    vec3 Lv = spotPos-P;                       // vector from P to light
    float distLv = length(Lv);
    vec3 LSpot = (distLv>0.0) ? (Lv/distLv) : vec3(0.0);

// Angular falloff: angle between axis and -L (pointing from light to P)
    float cosTheta = dot(-LSpot, spotAxis);

// 0 outside outer cone, 1 inside inner cone
    float coneAtt = smoothstep(outerCos, innerCos, cosTheta);

// Distance attenuation
    float distAtt = 1.0/max(1.0, pow(distLv, spotDecay));
    if(spotDistance>0.0) {
    // Smooth cutoff at max distance
        distAtt *= smoothstep(spotDistance, 0.0, distLv);
    }

// Lambert term
    float ndlSpot = max(dot(NSpot, LSpot), 0.0);

// Final irradiance (no shadow in this custom light)
    vec3 irradiance = vec3(0.8, 0.7, 0.4)*(ndlSpot * coneAtt * distAtt);

// Apply to your albedo/base color
// (assumes 'color' currently holds your sampled albedo)
    color = color + irradiance * 1.2;  // or: color = color * (ambient + irradiance);


    gl_FragColor = vec4(vec3(color), 1.0);

    // #include <colorspace_fragment>
    #include <fog_fragment>

}