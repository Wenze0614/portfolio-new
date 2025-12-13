// vertex.glsl
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>
#include <lights_pars_begin>

varying vec2 vUv;
varying vec3 vNormalVS;
varying vec3 vNormalWS;

void main() {
    vUv = uv;
    vec3 n = normalize(normalMatrix*normal);
    vNormalVS = n;

    vec4 mvPos = modelViewMatrix*vec4(position, 1.0);
    gl_Position = projectionMatrix*mvPos;

    vNormalWS = normalize(mat3(transpose(inverse(modelMatrix)))*n);
    vec3 transformedNormal = normalize(mat3(modelViewMatrix)*(n));
    vec4 worldPosition = modelMatrix*vec4(position, 1.0);

  #include <shadowmap_vertex>
  #include <fog_vertex>
}