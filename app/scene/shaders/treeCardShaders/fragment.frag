uniform sampler2D baseColor;
uniform sampler2D normalMap;
uniform sampler2D generalNormalMap;

varying vec2 vUv;
void main() {

    vec4 color = texture2D(baseColor, vUv).rgba;
    vec3 baseColor = color.rgb;
    float alpha = color.a;

    // discard transparent fragments
    if(alpha<0.5)
        discard;

    //add light
    vec3 normal = texture2D(normalMap, vUv).xyz;
    vec3 generalNormal = texture2D(generalNormalMap, vUv).xyz;
    vec3 mixNormal = normalize(mix(normal, generalNormal, 0.5));
    // vec3 N = normalize(texture2D(normalMap, vUv).xyz);
    vec3 L = normalize(vec3(1.0, 1.0, 1.0));

    float ndl = dot(mixNormal, L);
    float brightness = ndl;
    // float brightness = remap(ndl, -1.0, 1.0, 0.25, 0.75);
    vec3 ambienLight = 0.25*baseColor;
    baseColor = ambienLight+baseColor*vec3(.8, .8, .8)*brightness;

    gl_FragColor = vec4(baseColor, 1.0);
}