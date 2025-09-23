uniform sampler2D heightMap;
uniform float heightScale;
uniform float heightOffset;
uniform vec2 texel;
uniform vec2 terrainSize;

varying vec3 vNormalWS;
varying vec3 vPosWS;
varying vec2 vUv;

void main() {
  vUv = uv;

  // sample height (0..1) and displace along +Y
  float h = texture2D(heightMap, vUv).r;
  vec3 displaced = position;
  displaced.y = heightOffset+h*heightScale;

  // approximate normal from height derivatives (object space)
  // central differences in UV space
  float hL = texture2D(heightMap, vUv+vec2(-texel.x, 0.0)).r;
  float hR = texture2D(heightMap, vUv+vec2(texel.x, 0.0)).r;
  float hD = texture2D(heightMap, vUv+vec2(0.0,-texel.y)).r;
  float hU = texture2D(heightMap, vUv+vec2(0.0, texel.y)).r;

  //calculate derivatives and tangent vectors
  float dfdu = (hR-hL)/(2.0*texel.x);
  float dfdv = (hU-hD)/(2.0*texel.y);
  vec3 tangentU = vec3(terrainSize.x, heightScale*dfdu, 0.0);
  vec3 tangentV = vec3(0.0, heightScale*dfdv, terrainSize.y);
  vec3 n = normalize( cross(tangentV, tangentU) );

  vec4 mvPos = modelViewMatrix*vec4(displaced, 1.0);
  vPosWS = (modelMatrix*vec4(displaced, 1.0)).xyz;
  vNormalWS = normalize(mat3(normalMatrix)*n);

  gl_Position = projectionMatrix*mvPos;

}
