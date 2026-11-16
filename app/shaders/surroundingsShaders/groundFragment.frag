#include <common>
#include <fog_pars_fragment>
#include <night_pars_fragment>

// The ground beyond the terrain's edge (±100) out to the distant hills. Same grass texture at the
// same tiling as the terrain (one tile per 25 units, lined up with its tiles), lit the way the
// terrain is in the open, so the edge doesn't show; plus a large-scale brightness variation so the
// open field isn't flat.

uniform sampler2D grassTexture;

varying vec3 vPosWS;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}
float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    // the terrain's tile UVs work out to (x, -z) / 25 (its tiles start at -100, a multiple of 25)
    vec3 color = texture2D(grassTexture, vec2(vPosWS.x, -vPosWS.z) / 25.0).rgb;
    color *= 1.05; // about what the terrain's wind shading averages to in full sun
    color *= mix(0.85, 1.1, valueNoise(vPosWS.xz / 60.0));

    color = nightGrade(color, vPosWS);
    gl_FragColor = vec4(color, 1.0);

    #include <fog_fragment>
}
