#include <common>
#include <shadowmap_pars_vertex>

varying vec3 vPosWS;
varying vec2 vUv;
varying vec3 vNormalWS;

void main() {                           

    vUv = uv;           

    vec4 mvPos = modelViewMatrix*vec4(position, 1.0);
  vec4 worldPosition = modelMatrix*vec4(position, 1.0);
  vPosWS = worldPosition.xyz;

  vec3 transformedNormal = normalize(mat3(modelViewMatrix)*normal);
  vNormalWS = normalize(mat3(transpose(inverse(modelMatrix)))*normal);
  
  gl_Position = projectionMatrix*mvPos;               
  #include <shadowmap_vertex>
}