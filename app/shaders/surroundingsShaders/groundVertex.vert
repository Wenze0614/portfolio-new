#include <common>
#include <fog_pars_vertex>

varying vec3 vPosWS;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPosWS = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    #include <fog_vertex>
}
