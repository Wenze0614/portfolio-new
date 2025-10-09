#include <common>
#include <fog_pars_vertex>

attribute vec3 instanceOffset;   // per-tree world position

varying vec2 vUv;
varying float vDistToCam;
varying vec3 vPosWS;

float quadSize = 20.0;

uvec2 murmurHash21(uint src) {
    const uint M = 0x5bd1e995u;
    uvec2 h = uvec2(1190494759u, 2147483647u);

    src *= M;
    src ^= src>>24u;
    src *= M;

    h *= M;
    h ^= src;
    h ^= h>>13u;
    h *= M;
    h ^= h>>15u;

    return h;
}

// Convert uvec2 hash -> vec2 in [0,1]
vec2 hash21(uint n) {
    uvec2 h = murmurHash21(n);
    // 0xffffffffu = 4294967295
    return vec2(h)*(1.0/4294967295.0);
}
void main() {
    vUv = uv;
    vec2 hashedInstanceID = hash21(uint(gl_InstanceID));
    float quadSize = mix(10.0, 30.0, hashedInstanceID.x);
  // Vector from instance to camera (XZ only)
    vec3 toCam = cameraPosition-instanceOffset;
    vDistToCam = length(toCam);
    toCam.y = 0.0; // ignore vertical tilt
    vec3 fwd = normalize(toCam);

  // Build billboard basis
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, fwd));
    up = cross(fwd, right); // orthogonal correction

  // Expand the plane in right/up directions
    vec3 worldPos = instanceOffset
    + up*(0.48*quadSize) // lift plane up but not fully above ground
    + right*position.x*quadSize 
    + up*position.y*quadSize;
    vPosWS = worldPos;

    vec4 worldPosition = vec4(worldPos, 1.0);

    vec4 mvPosition = viewMatrix*vec4(worldPos, 1.0);

    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
}