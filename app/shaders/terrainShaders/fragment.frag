#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <fog_pars_fragment>

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
    vec3 irradiance = vec3(0.8, 0.7, 0.4)*(ndlSpot*coneAtt*distAtt);

// Apply to your albedo/base color
// (assumes 'color' currently holds your sampled albedo)
    color = color+irradiance*1.2;  // or: color = color * (ambient + irradiance);

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
    #include <fog_fragment>

}