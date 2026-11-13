#include <common>
#include <fog_pars_fragment>

uniform float uNight;
uniform vec3 uOffColor; // unlit glass
uniform vec3 uOnColor;  // lit glass; above 1.0 so the bloom pass makes it glow

varying float vLevel;

void main() {
#ifdef GLOW_ONLY
    // the bloom pass's version (userData.bloomMaterial): only the light glows, so unlit glass is black
    gl_FragColor = vec4(uOnColor * vLevel, 1.0);
#else
    // unlit glass dims with the rest of the scene at night (before its lamp comes on)
    vec3 off = uOffColor * (1.0 - 0.6 * uNight);
    gl_FragColor = vec4(mix(off, uOnColor, vLevel), 1.0);
#endif

    #include <colorspace_fragment>
    #include <fog_fragment>
}
