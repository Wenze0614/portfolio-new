#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
// #include <fog_pars_fragment>

uniform sampler2D pianoTexture;

varying vec3 vPosWS;
varying vec2 vUv;
varying vec3 vNormalWS;

int toonSteps = 3;

// helper: quantize x into N bands in [0,1]
float toonQuantize(float x, int steps) {
    x = clamp(x, 0.0, 1.0);
    float fsteps = float(max(1, steps));
  // center the bands slightly to avoid banding on exact edges
    float q = floor(x*fsteps)/(fsteps-1.0);
    return clamp(q, 0.0, 1.0);
}

void main() {

    vec3 color = texture2D(pianoTexture, vUv).rgb;

    //add light
    vec3 N = normalize(vNormalWS);
    vec3 L = normalize(directionalLights[0].direction);

    float ndl = dot(N, L);
      // quantize diffuse into toon bands
    float diffuseToon = toonQuantize(ndl, toonSteps);
    //float brighdness = remap(ndl,-1.0, 1.0, 0.25, 0.75);
    float brightness = mix(0.0, 0.5, diffuseToon);
    // vec3 ambienLight = 0.25*color;
    // color = color+directionalLights[0].color*brightness;
    // color = color + vec3(1.0) * 0.3;

    //lighten the piano keys, can be fixed in texture later
    if(color.r > 0.2) {
        color = color + vec3(1.0) * 0.3;
    }

    float shadowFactor = 1.0;
    #if NUM_DIR_LIGHTS > 0
    shadowFactor *= getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
    #endif

    // vec3 ambient = 0.431*color;
    // color = mix(ambient, color, shadowFactor);

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
    float distSpot = length(Lv);
    vec3 LSpot = (distSpot>0.0) ? (Lv/distSpot) : vec3(0.0);

// Angular falloff: angle between axis and -L (pointing from light to P)
    float cosTheta = dot(-LSpot, spotAxis);

// 0 outside outer cone, 1 inside inner cone
    float coneAtt = smoothstep(outerCos, innerCos, cosTheta);

// Distance attenuation
    float distAtt = 1.0/max(1.0, pow(distSpot, spotDecay));
    if(spotDistance>0.0) {
    // Smooth cutoff at max distance
        distAtt *= smoothstep(spotDistance, 0.0, distSpot);
    }

// Lambert term
    float ndlSpot = max(dot(NSpot, LSpot), 0.0);

// Final irradiance (no shadow in this custom light)
    vec3 irradiance = vec3(0.93, 0.93, 0.8)*(ndlSpot * coneAtt * distAtt);

// Apply to your albedo/base color
// (assumes 'color' currently holds your sampled albedo)
    // color = color + irradiance * 0.3;  // or: color = color * (ambient + irradiance);

    gl_FragColor = vec4(color, 1.0);

    // #include <fog_fragment>
}