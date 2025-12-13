float inverseLerp(float v, float minValue, float maxValue) {
    return (v-minValue)/(maxValue-minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

vec4 hologramShader(vec3 vPosWS, vec3 vNormalWS, float uTime, vec3 cameraPosition, vec3 baseColor) {
    float stripes = mod((vPosWS.y-uTime*0.02)*10.0, 1.0);
    stripes = pow(stripes, 3.0);
    vec3 viewDirection = normalize(cameraPosition-vPosWS);
    float fresnel = abs(dot(viewDirection, normalize(vNormalWS)));
    fresnel = remap(1.0-fresnel, 0.0, 1.0, 0.1, 0.8);

    float falloff = smoothstep(0.8, 0.0, fresnel);

    fresnel = pow(fresnel, 2.0);
    fresnel += fresnel * 1.25;
    fresnel *= falloff;

    float holographic = fresnel;
    return vec4(baseColor, holographic);
}

#pragma glslify: export(hologramShader)