#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>

uniform sampler2D signTexture;

varying vec3 vPosWS;
varying vec2 vUv;
varying vec3 vNormalWS;

int toonSteps = 5;

// helper: quantize x into N bands in [0,1]
float toonQuantize(float x, int steps) {
    x = clamp(x, 0.0, 1.0);
    float fsteps = float(max(1, steps));
  // center the bands slightly to avoid banding on exact edges
    float q = floor(x*fsteps)/(fsteps-1.0);
    return clamp(q, 0.0, 1.0);
}

void main() {
    vec3 textureColor = texture2D(signTexture, vUv).rgb;
    vec3 color = textureColor;
    // vec3 color = vec3(0.53, 0.26, 0.14);
    // if(textureColor.r > 0.9) {
    //     color = vec3(1.0, 0.9, 0.8);
    // }
    // if(textureColor.g > 0.9) {
    //     color = vec3(0.98, 0.86, 1.0);
    // }

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

    float shadowFactor = 1.0;
    #if NUM_DIR_LIGHTS > 0
    shadowFactor *= getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
    #endif

    vec3 ambient = 0.431*color;
    float colorStrength = (color.r+color.g+color.b)/3.0;
    if(colorStrength<0.5) {
        // color = mix(ambient, color, shadowFactor);
    } else {
        color = 0.7 * color + 0.3 * color * vec3(0.8, 0.58, 0.2);
    }

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
}