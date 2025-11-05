uniform sampler2D barTexture;
uniform vec3 lightPosition;
uniform float uTime;

varying vec2 vUv;
varying vec3 vPosWS;
varying vec3 vNormalWS;

#pragma glslify: pointLight = require('../includes/pointLight.glsl')

// vec3 pointLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower, float lightDecay) {
//     vec3 lightDelta = lightPosition-vPosWS;
//     float lightDistance = length(lightDelta);
//     vec3 lightDirection = normalize(lightDelta);
//     float ndl = max(dot(normal, lightDirection), 0.0);
//     float decay = 1.0-lightDistance*lightDecay;

//     vec3 ambientColor = vec3(0.23, 0.66, 0.87);

//     vec3 diffuse = lightColor*lightIntensity*decay*ndl;
//     vec3 ambien = (pow(1.0-decay,3.0)) * ambientColor * 0.2;
//     diffuse += ambien;

//     // specular
//     vec3 reflectDir = reflect(-lightDirection, normal);
//     float spec = pow(max(dot(viewDirection, reflectDir), 0.0), specularPower);
//     vec3 specular = lightColor*lightIntensity*spec;

//     return diffuse;
// }

void main() {
    vec3 screenColor = texture2D(barTexture, vUv).rgb;
    //screenColor += pointLight(vec3(0.67, 0.84, 0.929), 0.8, normalize(vNormalWS), lightPosition, normalize(cameraPosition-vPosWS), 16.0, 0.2);
    screenColor += pointLight(vPosWS,vec3(0.87, 0.5, 0.87), 1.0, normalize(vNormalWS), lightPosition, normalize(cameraPosition-vPosWS), 16.0, 0.4);

    gl_FragColor = vec4(screenColor, 1.0);
     #include <colorspace_fragment>
}