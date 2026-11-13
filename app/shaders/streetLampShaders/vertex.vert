#include <common>
#include <fog_pars_vertex>

// LAMP_COUNT is a define set by the street lamp system
uniform float uLampLevels[LAMP_COUNT];

attribute float aLamp; // which lamp this vertex belongs to (all lanterns are one merged mesh)

varying float vLevel;

void main() {
    vLevel = uLampLevels[int(aLamp + 0.5)];

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    #include <fog_vertex>
}
