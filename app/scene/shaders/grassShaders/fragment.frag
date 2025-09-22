// fragment.frag

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D diffusel;
uniform sampler2D grassTexture;
uniform sampler2D terrainTexture;

varying vec2 tilePosition;
varying vec3 vColor;
varying vec4 vGrassData;

float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

float hash(vec2 p){
    p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0*fract(p.x*p.y*(p.x+p.y));
}
void main() {
    //vec3 green1 = vec3(0.27,0.588,0.223); //dark green
    //vec3 green2 = vec3(0.474, 0.749, 0.349); //light green
    //vec3 green3 = vec3(0.737, 0.855, 0.396); //yellow green
    //vec3 green4 = vec3(0.514, 0.788, 0.588); //blue green
    //float green = texture2D(grassTexture, v_uvs).g; //value between 0 and 1
    //vec3 color = vec3(0.0, green, 0.0);
    // if(green < 0.35){
    //     color = green1;
    // }
    // else if(green < 0.5) {
    //     color = mix(green1, green2, remap(green, 0.0, 0.5, 0.0, 1.0));
    // }
    // else if(green < 0.7 ) {
    //     color = mix(green2, green4, remap(green, 0.5, 0.7, 0.0, 1.0)-0.5);
    // }
    // else if(green < 0.75)
    // {
    // color = green4;
    // }    
    // else if(green < 0.75) {
    //     color = mix(green2, green3, remap(green, 0.7, 0.95, 0.0, 1.0));
    // }
    // else if(green < 1.0) {
    //     color = green3;
    // }
    float grassX = vGrassData.x;
    vec3 baseColor = texture2D(grassTexture, tilePosition).rgb;
    //make the color brighter in the middle and darker on the side
    //slowly increase the brightness from +-0.125 to the middle of the grass 0.0
    vec3 color = mix(baseColor * 0.75, baseColor, smoothstep(0.125, 0.0, abs(grassX)));
    gl_FragColor = vec4(color, 1.0);
}