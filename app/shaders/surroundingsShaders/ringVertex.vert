#include <common>
#include <fog_pars_vertex>

varying vec3 vLocal; // position on the ring (object space: centred, y up from its foot)

void main() {
    vLocal = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    #include <fog_vertex>
}
