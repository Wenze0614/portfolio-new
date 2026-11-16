#include <common>
#include <fog_pars_fragment>

// One ring of distant scenery (a tree line, hills, mountains): an open cylinder around the map whose
// top edge is cut out in the shader. Its height around the ring is low-frequency noise (the land)
// plus rows of rounded bumps (tree crowns). The fog chunk adds the haze that fades far rings into the
// horizon colour (with the fog on, they're fogged out entirely, like everything that far away).

uniform float uNight;
uniform float uBase;        // height of the land at its lowest
uniform float uAmp;         // + this much from the noise
uniform float uFreq;        // noise bumps around the ring
uniform float uRidge;       // 0 = rolling hills, 1 = sharp ridges (mountains)
uniform float uCrowns;      // tree crowns around the ring (0 = none); a whole number, so the ring has no seam
uniform float uCrownAmp;    // their height
uniform float uSeed;
uniform vec3 uColorDay;
uniform vec3 uColorNight;

varying vec3 vLocal;

float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}
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
    float angle = atan(vLocal.z, vLocal.x);
    // noise on a circle in 2D, so it joins up all the way round
    vec2 circle = vec2(cos(angle), sin(angle));
    float n = 0.0;
    float a = 0.55;
    vec2 p = circle * uFreq + uSeed;
    for (int i = 0; i < 4; i++) {
        float v = valueNoise(p);
        v = mix(v, 1.0 - abs(v * 2.0 - 1.0), uRidge); // ridged: sharp crests
        n += a * v;
        p = p * 2.1 + 3.7;
        a *= 0.5;
    }
    float land = uBase + uAmp * n;
    float height = land;

    // Tree crowns: three overlapping rows of rounded crowns with different counts, each crown with
    // its own width, offset and height; the silhouette is the tallest at each point. One row of equal
    // crowns read as a scalloped fence.
    float crownTint = 1.0;
    if (uCrowns > 0.0) {
        float around = angle / 6.2831853 + 0.5; // 0..1 around the ring
        float best = 0.0;
        for (int row = 0; row < 3; row++) {
            float fr = float(row);
            float count = floor(uCrowns * (1.0 + 0.37 * fr)); // whole numbers, so each row closes the ring
            float t = around * count;
            float id = mod(floor(t), count) + fr * 1000.0 + uSeed * 17.0;
            float center = 0.5 + (hash11(id) - 0.5) * 0.45;
            float halfWidth = (0.5 - abs(center - 0.5)) * (0.7 + 0.3 * hash11(id + 7.7));
            float x = (fract(t) - center) / halfWidth;
            float crown = sqrt(max(0.0, 1.0 - x * x)) * uCrownAmp * (0.45 + 0.55 * hash11(id + 3.1));
            crown -= fr * 0.18 * uCrownAmp; // rows further back sit a little lower
            if (crown > best) {
                best = crown;
                crownTint = 0.86 + 0.24 * hash11(id + 5.3); // each tree a slightly different green
            }
        }
        height += best;
    }

    if (vLocal.y > height) discard;

    vec3 color = mix(uColorDay, uColorNight, uNight) * crownTint;
    // a little darker at the foot, so a row of trees reads as having depth
    color *= mix(0.72, 1.0, smoothstep(0.0, height, vLocal.y));
    // the crowns' tops catch more light
    if (uCrowns > 0.0) color *= mix(1.0, 1.22, smoothstep(height - uCrownAmp, height, vLocal.y) * smoothstep(land - 1.0, land + 1.0, vLocal.y));

    gl_FragColor = vec4(color, 1.0);

    #include <fog_fragment>
}
