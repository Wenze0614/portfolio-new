uniform sampler2D screenTexture;

varying vec2 vUv;
varying vec3 vPosWS;
varying vec3 vNormalWS;

void main(){
    vec4 screenMask = texture2D(screenTexture, vUv);
     gl_FragColor = vec4(screenMask.rgb, 1.0);
}