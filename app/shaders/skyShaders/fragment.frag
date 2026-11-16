#include <common>
#include <fog_pars_fragment>

// Procedural sky: gradient, sun (moon at night), drifting clouds, stars. The horizon colour is the
// fog colour (uHorizon follows scene.fog.color, which the day & night system lerps), so the sky
// meets the fogged ground and the distant hills without a seam.

uniform float uNight;
uniform float uTime;
uniform vec3 uSunDir;       // towards the sun; the moon sits there at night (the moonlight reuses the sun's direction)
uniform vec3 uHorizon;
uniform vec3 uZenithDay;
uniform vec3 uZenithNight;
uniform vec3 uSunColor;
uniform vec3 uMoonColor;

varying vec3 vWorldPos;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}
float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
}
float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * valueNoise(p);
        p = p * 2.03 + vec2(17.1, 9.2);
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 dir = normalize(vWorldPos - cameraPosition);
    float up = max(dir.y, 0.0);

    // gradient: fog-coloured horizon up to the zenith colour
    vec3 zenith = mix(uZenithDay, uZenithNight, uNight);
    vec3 sky = mix(uHorizon, zenith, pow(up, 0.55));

    // glow around the sun / moon
    float cosA = dot(dir, uSunDir);
    float glow = pow(max(cosA, 0.0), 24.0) * 0.35 + pow(max(cosA, 0.0), 4.0) * 0.1;
    vec3 bodyColor = mix(uSunColor, uMoonColor, uNight);
    sky += bodyColor * glow * mix(1.0, 0.35, uNight);

    // clouds: noise on a flat layer overhead (dir projected onto a plane), drifting slowly
    vec2 cloudUv = dir.xz / (dir.y + 0.12) * 1.3 + vec2(uTime * 0.004, uTime * 0.0015);
    float density = fbm(cloudUv);
    float cover = smoothstep(0.52, 0.78, density) * smoothstep(0.0, 0.2, dir.y); // thin out at the horizon (stretched there)
    float shade = smoothstep(0.5, 0.85, fbm(cloudUv + uSunDir.xz * 0.06)); // denser towards the sun side = darker underside
    vec3 cloudDay = mix(vec3(1.0), vec3(0.74, 0.79, 0.88), shade);
    vec3 cloudNight = mix(vec3(0.16, 0.2, 0.3), vec3(0.08, 0.1, 0.17), shade);
    vec3 cloud = mix(cloudDay, cloudNight, uNight);

    // stars (night only): a few cells of a grid over the sphere hold one, twinkling a little. A cell
    // is ~0.36° (about 6 px on a laptop screen); a star's core fills a third of it, so it's never sub-pixel.
    if (uNight > 0.0) {
        vec3 starCoord = dir * 160.0;
        vec3 cell = floor(starCoord);
        float starSeed = hash31(cell);
        vec3 starPos = vec3(hash31(cell + 1.7), hash31(cell + 4.3), hash31(cell + 8.9)) * 0.4 + 0.3;
        float star = step(0.993, starSeed) * smoothstep(0.32, 0.05, length(fract(starCoord) - starPos));
        star *= (0.55 + 0.45 * hash31(cell + 2.2)) * (0.75 + 0.25 * sin(uTime * 2.0 + starSeed * 400.0));
        sky += vec3(0.9, 0.93, 1.0) * star * 1.3 * uNight * smoothstep(0.04, 0.3, dir.y) * (1.0 - cover);
    }

    sky = mix(sky, cloud, cover * 0.92);

    // the sun / moon disc itself, mostly hidden behind clouds
    float disc = smoothstep(0.99955, 0.99975, cosA);
    sky = mix(sky, bodyColor * mix(1.6, 1.15, uNight), disc * (1.0 - cover * 0.85));

    gl_FragColor = vec4(sky, 1.0);

    #include <fog_fragment>
}
