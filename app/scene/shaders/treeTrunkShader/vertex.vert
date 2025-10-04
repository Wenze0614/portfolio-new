#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>
#include <lights_pars_begin>

#define USE_INSTANCING

varying vec3 vNormalWS;
varying vec2 vUv;

void main() {
  // world position
    vec4 worldPosition = modelMatrix*instanceMatrix*vec4(position, 1.0);
    gl_Position = projectionMatrix*viewMatrix*worldPosition;

  // world/view normal
    mat3 M = mat3(modelMatrix*instanceMatrix);
    vec3 nWorld = normalize(M*normal);
    vNormalWS = nWorld;
    vec3 transformedNormal = normalize(mat3(viewMatrix)*nWorld);

    vec4 mvPos = viewMatrix*worldPosition;
    vUv = uv;
  // Hand coords to shadow system
  #include <shadowmap_vertex>
}