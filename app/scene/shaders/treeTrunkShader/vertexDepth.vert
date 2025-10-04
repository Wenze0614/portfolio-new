#define USE_INSTANCING

varying vec3 vNormalWS;

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
}