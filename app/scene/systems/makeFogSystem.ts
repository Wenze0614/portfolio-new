import { SceneContext, TEXTURE_NAME } from "../core/types";
import * as THREE from "three";

const _NOISE_GLSL = `
float sampleNoise(vec3 p) {
    #ifdef FOG_USE_NOISE
        vec2 uv1 = p.xy;
        vec2 uv2 = p.yz;
        vec2 uv3 = p.zx;

        uv1 += vec2(fogTime * 0.005, 0.0);
        uv2 += vec2(0.0, fogTime * 0.005);
        uv3 += vec2(fogTime * 0.003, fogTime * 0.004);

        uv1 = fract(uv1);
        uv2 = fract(uv2);
        uv3 = fract(uv3);
        
        float n1 = texture2D(noiseTexture, uv1).r;
        float n2 = texture2D(noiseTexture, uv2).r;
        float n3 = texture2D(noiseTexture, uv3).r;

        //blend noise from different axis to reduce repetition
        return (n1 + n2 + n3) / 3.0;
    #else
        return 1.0; // disable noise
    #endif
}

float FBM(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
//   for (int i = 0; i < 3; ++i) {

//   }
    float n = sampleNoise(p * frequency);
    value += n * amplitude;
    // frequency *= 2.0;
    // amplitude *= 0.5;
  return value;
}
`;

export default async function makeFogSystem(ctx: SceneContext) {

    //overwrite fog shaders
    THREE.ShaderChunk.fog_fragment = `
    #ifdef USE_FOG
      vec3 fogOrigin = cameraPosition;
      vec3 fogDirection = normalize(vWorldPosition - fogOrigin);
      float fogDepth = distance(vWorldPosition, fogOrigin);

      vec3 noiseSampleCoord = vWorldPosition * 0.0025;
      float noise = FBM(noiseSampleCoord + FBM(noiseSampleCoord)) * 0.5 + 0.5;
    // float noise = sampleNoise(noiseSampleCoord);
    //   float noise = 1.0; // fallback

    //   #ifdef FOG_USE_NOISE     // <-- define this only when fogTime exists
    //     noise = FBM(noiseSampleCoord + FBM(noiseSampleCoord)) * 0.5 + 0.5;
    //   #endif
      fogDepth *= mix(noise, 1.0, saturate((fogDepth - 200.0) / 400.0));
      fogDepth *= fogDepth * 0.43;

      float heightFactor = 0.5;
      float fogFactor = heightFactor * exp(-fogOrigin.y * fogDensity) * (
          1.0 - exp(-fogDepth * fogDirection.y * fogDensity)) / fogDirection.y;
      fogFactor = saturate(fogFactor);

      gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
        // gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, 0.0 ); // disable fog
    #endif`;

    THREE.ShaderChunk.fog_pars_fragment = `
    #ifdef USE_FOG
      uniform vec3 fogColor;
      varying vec3 vWorldPosition;
      #ifdef FOG_EXP2
        uniform float fogDensity;
      #else
        uniform float fogNear;
        uniform float fogFar;
      #endif
      // --- your custom uniforms (declare them here!) ---
      uniform float fogTime;
      uniform sampler2D noiseTexture;   // name consistent across your code
    #endif` + _NOISE_GLSL;

    THREE.ShaderChunk.fog_vertex = `
    #ifdef USE_FOG
      vWorldPosition = worldPosition.xyz;
    #endif`;

    THREE.ShaderChunk.fog_pars_vertex = `
    #ifdef USE_FOG
      varying vec3 vWorldPosition;
    #endif`;

    const noiseTexture = ctx.state.getTexture(TEXTURE_NAME.FOG_NOISE_TEXTURE);

    const customFogUniforms = {
        fogTime: { value: 0.0 },
        noiseTexture: { value: noiseTexture },
    }


    // const libs = [
    //     'basic', 'lambert', 'phong', 'standard', 'physical', 'toon', 'matcap', 'dashed', 'points', 'sprite'
    // ];

    // for (const name of libs) {
    //     console.log('Injecting fog uniforms to', name);
    //     const base = THREE.ShaderLib[name].uniforms;
    //     THREE.ShaderLib[name].uniforms = THREE.UniformsUtils.merge([
    //         THREE.UniformsUtils.clone(base),
    //         customFogUniforms
    //     ]);
    // }

    //inject custom uniform to all materials with fog
    THREE.ShaderLib.lambert.uniforms = THREE.UniformsUtils.merge([THREE.ShaderLib.lambert.uniforms, customFogUniforms]);
    // THREE.ShaderLib.phong.uniforms = THREE.UniformsUtils.merge([THREE.ShaderLib.phong.uniforms, customFogUniforms]);
    // THREE.ShaderLib.standard.uniforms = THREE.UniformsUtils.merge([THREE.ShaderLib.standard.uniforms, customFogUniforms]);
    // THREE.ShaderLib.physical.uniforms = THREE.UniformsUtils.merge([THREE.ShaderLib.physical.uniforms, customFogUniforms]);
    THREE.ShaderLib.basic.uniforms = THREE.UniformsUtils.merge([THREE.ShaderLib.basic.uniforms, customFogUniforms]);

    // const prev = THREE.Material.prototype.onBeforeCompile;
    // THREE.Material.prototype.onBeforeCompile = function (shader, renderer) {
    //     // add if missing (so we don’t double-define)
    //     shader.uniforms.fogTime ??= { value: 0.0 };
    //     shader.uniforms.noiseTexture ??= { value: noiseTexture };   // from above

    //     // keep a reference if you want to update time later
    //     this.userData.shader = shader;

    //     if (prev) prev.call(this, shader, renderer);
    // };

    // THREE.ShaderMaterial.prototype.onBeforeCompile = function (shader) {
    //     console.log('Compiling ShaderMaterial:', this.name || '(unnamed)', this);
    //   };
}


