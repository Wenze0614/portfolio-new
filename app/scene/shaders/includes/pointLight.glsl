vec3 pointLight(vec3 vPosWS, vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower, float lightDecay) {
    vec3 lightDelta = lightPosition-vPosWS;
    float lightDistance = length(lightDelta);
    vec3 lightDirection = normalize(lightDelta);
    float ndl = max(dot(normal, lightDirection), 0.0);
    float decay = 1.0-lightDistance*lightDecay;

    vec3 ambientColor = vec3(0.23, 0.66, 0.87);

    vec3 diffuse = lightColor*lightIntensity*decay*ndl;
    vec3 ambien = (pow(1.0-decay,3.0)) * ambientColor * 0.2;
    diffuse += ambien;

    // specular
    vec3 reflectDir = reflect(-lightDirection, normal);
    float spec = pow(max(dot(viewDirection, reflectDir), 0.0), specularPower);
    vec3 specular = lightColor*lightIntensity*spec;

    return diffuse;
}

#pragma glslify: export(pointLight)