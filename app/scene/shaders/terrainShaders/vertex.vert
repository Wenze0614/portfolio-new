#include <common>
#include <shadowmap_pars_vertex>

uniform sampler2D heightMap;
uniform float heightScale;
uniform float heightOffset;
uniform vec2 texel;
uniform vec2 terrainSize;
uniform float textureTileSize;

varying vec3 vNormalWS;
varying vec3 vPosWS;
varying vec2 vUv;
varying vec2 worldUv;

void main() {
  vUv = uv;
  float tileID = float(gl_InstanceID);
  float rowID = floor(tileID / float(terrainSize.x/textureTileSize));
  float colID = mod(tileID, float(terrainSize.x/textureTileSize));
  float centerX = (colID+0.5)*textureTileSize - terrainSize.x/2.0;
  float centerZ = (rowID+0.5)*textureTileSize - terrainSize.y/2.0;
  //vec2 shiftedPos = position.xz+vec2(terrainSize.x, terrainSize.y)*0.5; // shift from (-size/2,size/2) to (0,size)
  //tileVUv = vec2(mod(shiftedPos.x, textureTileSize)/textureTileSize, mod(shiftedPos.y, textureTileSize)/textureTileSize); // tile texture every textureTileSize units

  vec3 displaced = position;
  // move to tile center
  displaced.x += centerX;
  displaced.z += centerZ;
  worldUv = (displaced.xz/terrainSize + 0.5);
  worldUv.y = 1.0-worldUv.y; // flip Y for texture lookup

  // sample height (0..1) and displace along +Y
  float h = texture2D(heightMap, worldUv).r;
  displaced.y = heightOffset+h*heightScale;

  // approximate normal from height derivatives (object space)
  // central differences in UV space
  float hL = texture2D(heightMap, worldUv+vec2(-texel.x, 0.0)).r;
  float hR = texture2D(heightMap, worldUv+vec2(texel.x, 0.0)).r;
  float hD = texture2D(heightMap, worldUv+vec2(0.0,-texel.y)).r;
  float hU = texture2D(heightMap, worldUv+vec2(0.0, texel.y)).r;

  //calculate derivatives and tangent vectors
  float dfdu = (hR-hL)/(2.0*texel.x);
  float dfdv = (hU-hD)/(2.0*texel.y);
  vec3 tangentU = vec3(terrainSize.x, heightScale*dfdu, 0.0);
  vec3 tangentV = vec3(0.0, heightScale*dfdv, terrainSize.y);
  vec3 nOS = normalize(cross(tangentV, tangentU)); // normal in object local space

  // normal in VIEW space (matches Three’s convention for transformedNormal)
  vec3 transformedNormal = normalize(mat3(modelViewMatrix)*nOS);

  vec4 mvPos = modelViewMatrix*vec4(displaced, 1.0);
  vec4 worldPosition = modelMatrix*vec4(displaced, 1.0);
  vPosWS = worldPosition.xyz;
  vNormalWS = normalize(mat3(normalMatrix)*nOS);

  // Hand coords to shadow system
  #include <shadowmap_vertex>

  gl_Position = projectionMatrix*mvPos;

}
