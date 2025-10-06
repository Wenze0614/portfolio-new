// #include <common>
// #include <shadowmap_pars_vertex>

varying vec2 vUv;

float quadSize = 30.0;

void main() {
    vUv = uv;
    vec3 worldPosition = (modelMatrix*vec4(position, 1.0)).xyz;

    vec3 toCamera = normalize(cameraPosition - worldPosition);
    toCamera.y = 0.0;
    vec3 fwd = normalize(toCamera);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(fwd, up));
    up = cross(right, fwd);

    vec4 worldPos = instanceMatrix* vec4(right*(-position.x*quadSize) + up*((position.y + 0.5)*quadSize), 1.0);

//   // Hand coords to shadow system
//   #include <shadowmap_vertex>

    gl_Position = projectionMatrix*viewMatrix*worldPos;

}
