// Night fireflies that always surround the player: each one wanders around its own spot inside a
// square of side uArea, and that square is wrapped around the camera (like a repeating tile), so
// walking anywhere keeps fireflies around you with a fixed count. They fade out before the edge of
// the square, so one wrapping to the other side is never seen.
uniform float uTime;
uniform float uNight;
uniform float uPixelRatio;
uniform float uSize;
uniform float uArea;
uniform vec3 uCenter;
// no fireflies inside the cabin: its footprint as a rotated rectangle (centre, unit direction of one
// side, half sizes), all in world x/z
uniform vec2 uNoFlyCenter;
uniform vec2 uNoFlyAxis;
uniform vec2 uNoFlyHalf;

attribute vec4 aSeed; // x: phase, y: speed, z: blink rate, w: size

varying float vAlpha;

const float TAU = 6.2831853;

void main() {
    vec3 p = position;

    // slow, looping wander (two out-of-step sine waves per axis)
    float t = uTime * (0.18 + aSeed.y * 0.3);
    p.x += sin(t + aSeed.x * TAU) * 1.4 + sin(t * 0.37 + aSeed.z * TAU) * 0.9;
    p.z += cos(t * 0.83 + aSeed.x * TAU) * 1.4 + sin(t * 0.29 + aSeed.w * TAU) * 0.9;
    p.y += sin(t * 1.3 + aSeed.z * TAU) * 0.35;

    // wrap x/z into the square centred on the camera
    vec2 rel = mod(p.xz - uCenter.xz + 0.5 * uArea, uArea) - 0.5 * uArea;
    vec3 world = vec3(uCenter.x + rel.x, p.y, uCenter.z + rel.y);

    float edgeFade = 1.0 - smoothstep(uArea * 0.3, uArea * 0.46, length(rel));

    // blink: mostly dim, with a soft flash every couple of seconds (each at its own pace)
    float wave = sin(uTime * (0.6 + aSeed.z * 1.1) + aSeed.x * 40.0);
    float blink = 0.2 + 0.8 * smoothstep(0.35, 1.0, wave);

    // none inside the cabin: 1 anywhere inside the footprint, fading to 0 over 0.5 units outside it
    vec2 d = world.xz - uNoFlyCenter;
    vec2 local = vec2(dot(d, uNoFlyAxis), dot(d, vec2(-uNoFlyAxis.y, uNoFlyAxis.x)));
    vec2 outside = max(abs(local) - uNoFlyHalf, 0.0);
    float inCabin = 1.0 - smoothstep(0.0, 0.5, length(outside));

    vAlpha = uNight * edgeFade * blink * (1.0 - inCabin);

    vec4 viewPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float size = uSize * (0.6 + aSeed.w * 0.6) * uPixelRatio / max(-viewPosition.z, 0.1);
    // at least a few pixels, so distant ones still read as glows rather than specks
    gl_PointSize = vAlpha > 0.003 ? clamp(size, 7.0 * uPixelRatio, 64.0 * uPixelRatio) : 0.0;
}
