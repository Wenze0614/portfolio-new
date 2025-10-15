uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float aScale;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
    vec3 offset = vec3(
        0.0,
        0.5 * aScale * sin(uTime + worldPosition.x * 10.0),
        0.0
    );
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset, 1.0);
    gl_PointSize = uSize * aScale * uPixelRatio; // make size consistent across devices
    gl_PointSize *= (1.0 / - viewPosition.z); // scale down with distance
}