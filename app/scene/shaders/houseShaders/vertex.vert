uniform vec2 uScreenSize;

varying vec2 vUv;
varying vec3 vPosWS;
varying vec3 vNormalWS;
varying vec3 vNormalView;
varying vec3 vNormal;

float random2D(vec2 value) {
    return fract(sin(dot(value ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    vUv = uv;
    vec4 modelPos = modelMatrix * vec4(position, 1.0);

    vec4 mvPos = viewMatrix * modelPos;

    vec4 worldPosition = modelPos;
    vPosWS = worldPosition.xyz;

    vec3 transformedNormal = normalize(mat3(modelViewMatrix)*normal);
    vNormalWS = normalize(mat3(transpose(inverse(modelMatrix)))*normal);
    vNormalView = normalize(mat3(normalMatrix)*normal);
    vNormal = normal;

    gl_Position = projectionMatrix*mvPos;
}