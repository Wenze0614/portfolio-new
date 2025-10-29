float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
}


float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

vec4 hologramShader( vec3 vPosWS, vec3 vNormalWS, float uTime, vec3 cameraPosition ) {
    float stripes = mod((vPosWS.y - uTime * 0.02) * 10.0, 1.0);
    stripes = pow(stripes, 3.0);
    vec3 viewDirection = normalize(cameraPosition - vPosWS);
    float fresnel = dot(viewDirection, normalize(vNormalWS));
    fresnel = remap(1.0 - fresnel, 0.0, 1.0, 0.1, 0.8);
    float holographic = stripes * fresnel;
    return vec4(1.0, 1.0, 1.0, holographic);
}

#pragma glslify: export(hologramShader)