#include <common>
#include <packing>
#include <lights_pars_begin>

// #pragma glslify: utils = require('../includes/utils.glsl')
// #include <shadowmap_pars_fragment>
// #include <fog_pars_fragment>

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


#pragma glslify: hologramShader = require('../includes/hologram.glsl')

void main() {

    // vec4 textureColor = texture2D(barTexture, fract(vUv+vec2(uTime*0.005, uTime*0.003)));
    // vec4 textureColor = texture2D(barTexture, vUv);
    // vec3 color = textureColor.rgb;

    vec4 holoColor = hologramShader(vPosWS, vNormalWS, uTime, cameraPosition, vec3(0.67, 0.84, 0.929));

    // gl_FragColor = vec4(color, alpha);
    gl_FragColor = holoColor;

    #include <colorspace_fragment>
}