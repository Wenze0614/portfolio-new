#include <common>
#include <packing>
#include <lights_pars_begin>

#pragma glslify: pointLight = require('../includes/pointLight.glsl')

// #pragma glslify: utils = require('../includes/utils.glsl')
// #include <shadowmap_pars_fragment>
// #include <fog_pars_fragment>


uniform sampler2D minecraftWoodTexture;
uniform float uTime;

varying vec3 vPosWS;
varying vec2 vUv;
varying vec3 vNormalWS;
varying vec3 vNormalView;
varying vec3 vNormal;

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

    // vec4 textureColor = texture2D(barTexture, fract(vUv+vec2(uTime*0.005, uTime*0.003)));
    vec4 textureColor = texture2D(minecraftWoodTexture, vUv);
    vec3 color = textureColor.rgb;

    // vec4 holoColor = hologramShader(vPosWS, vNormalWS, uTime, cameraPosition);
    float alpha = textureColor.a;

      // View vector in view space is (0,0,1) toward the camera
    vec3 N = normalize(vNormalView);
    vec3 V = vec3(0.0, 0.0, 1.0);

  // Reflect V about N (matcap uses a sphere mapping from reflection)
    vec3 R = reflect(-V, N);

  // Project to 2D with the common “m” denominator (keeps circle correct)
    float m = 2.0*sqrt(R.x*R.x+R.y*R.y+(R.z+1.0)*(R.z+1.0));
    vec2 uv = R.xy/m+0.5;

  // Some matcaps are stored upside down — if yours looks flipped, uncomment:
  // uv.y = 1.0 - uv.y;

    // vec3 matcapCol = texture2D(toonMatcap, uv).rgb;

    //add light
    // vec3 N = normalize(vNormalWS);
    // vec3 L = normalize(directionalLights[0].direction);

    // float ndl = dot(N, L);
    //   // quantize diffuse into toon bands
    // float diffuseToon = toonQuantize(ndl, toonSteps);
    // //float brighdness = remap(ndl,-1.0, 1.0, 0.25, 0.75);
    // float brightness = mix(0.0, 0.5, diffuseToon);
    // // vec3 ambienLight = 0.25*color;
    // color = color+directionalLights[0].color*brightness;
    // color = color+vec3(1.0)*0.15;

    // float shadowFactor = 1.0;
    // #if NUM_DIR_LIGHTS > 0
    // shadowFactor *= getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
    // #endif

    // vec3 ambient = 0.431*color;
    // color = mix(ambient, color, shadowFactor);

    

    // alpha = 1.0 - smoothstep(4.3, 5.0, vPosWS.y);
    alpha = 1.0;

    gl_FragColor = vec4(color, alpha);
    // gl_FragColor = holoColor;

    #include <colorspace_fragment>
    // #include <fog_fragment>
}