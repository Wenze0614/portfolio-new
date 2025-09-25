#include <common>
#include <shadowmap_pars_vertex>

uniform float u_effectBlend;
uniform float u_remap;
uniform float u_normalize;
uniform float grassWidth;
uniform float grassHeight;
uniform float grassPatchSize;
uniform float time;
uniform vec2 terrainSize;
uniform sampler2D grassMask;
uniform sampler2D grassHeightMap;

varying vec2 tilePosition;
varying vec3 vColor;
varying vec4 vGrassData;
varying vec2 vGrassTerrainUVPosition;
varying vec3 vPosWS;

//const float PI = 3.1415926535; //defined in common
const vec3 BASE_COLOR = vec3(0.1, 0.4, 0.04); // Base color for the grass
const vec3 TIP_COLOR = vec3(0.5, 0.7, 0.3); // Tip color for the grass
const float TERRAIN_MAX_HEIGHT = 5.0;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v-minValue)/(maxValue-minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

// vec2 hash(float p){
// // Use dot products with irrational numbers to reduce correlation
//     return fract(sin(vec2(p, p + 1.0)) * vec2(43758.5453, 31415.9265));
// }

uvec2 murmurHash21(uint src) {
  const uint M = 0x5bd1e995u;
  uvec2 h = uvec2(1190494759u, 2147483647u);

  src *= M;
  src ^= src>>24u;
  src *= M;

  h *= M;
  h ^= src;
  h ^= h>>13u;
  h *= M;
  h ^= h>>15u;

  return h;
}

// Convert uvec2 hash -> vec2 in [0,1]
vec2 hash21(uint n) {
  uvec2 h = murmurHash21(n);
    // 0xffffffffu = 4294967295
  return vec2(h)*(1.0/4294967295.0);
}

vec3 hash33(vec3 p) {
  p = fract(p*0.1031);                      // fractional scrambling
  p += dot(p, p.yzx+33.33);                 // non-linear mix
  return -1.0+2.0*fract((p.xxy+p.yzz)*p.zyx);      // final mixing
}

float easeOut(float x, float t) {
  return 1.0-pow(1.0-x, t);
}

mat3 rotateY(float theta) {
  float c = cos(theta);
  float s = sin(theta);

  return mat3(c, 0.0,-s, 0.0, 1.0, 0.0, s, 0.0, c);
}

mat3 rotateX(float theta) {
  float c = cos(theta);
  float s = sin(theta);

  return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0,-s, c);
}

mat3 rotateZ(float theta) {
  float c = cos(theta);
  float s = sin(theta);

  return mat3(c, s, 0.0,-s, c, 0.0, 0.0, 0.0, 1.0);
}

mat3 rotateAxis(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0-c;

  axis = normalize(axis);

  return mat3(oc*axis.x*axis.x+c, oc*axis.x*axis.y-axis.z*s, oc*axis.z*axis.x+axis.y*s, oc*axis.x*axis.y+axis.z*s, oc*axis.y*axis.y+c, oc*axis.y*axis.z-axis.x*s, oc*axis.z*axis.x-axis.y*s, oc*axis.y*axis.z+axis.x*s, oc*axis.z*axis.z+c);
}

vec3 bezier(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float u = 1.0-t;
  float tt = t*t;
  float uu = u*u;
  float uuu = uu*u;
  float ttt = tt*t;

  vec3 point = uuu*p0; // (1-t)^3 * p0
  point += 3.0*uu*t*p1; // 3 * (1-t)^2 * t * p1
  point += 3.0*u*tt*p2; // 3 * (1-t) * t^2 * p2
  point += ttt*p3; // t^3 * p3

  return point;
}

vec3 bezierGradient(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float u = 1.0-t;
  float tt = t*t;
  float uu = u*u;

  vec3 tangent = 3.0*uu*(p1-p0)+6.0*u*t*(p2-p1)+3.0*tt*(p3-p2);

  return normalize(tangent);
}

// float saturate(float x) {
//   return clamp(x, 0.0, 1.0);
// } // defined in common

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

    // Smooth interpolation
  vec3 u = f*f*(3.0-2.0*f);

    // Hashing corners of the cube
  float n000 = dot(hash33(i+vec3(0.0, 0.0, 0.0)), f-vec3(0.0, 0.0, 0.0));
  float n001 = dot(hash33(i+vec3(0.0, 0.0, 1.0)), f-vec3(0.0, 0.0, 1.0));
  float n010 = dot(hash33(i+vec3(0.0, 1.0, 0.0)), f-vec3(0.0, 1.0, 0.0));
  float n011 = dot(hash33(i+vec3(0.0, 1.0, 1.0)), f-vec3(0.0, 1.0, 1.0));
  float n100 = dot(hash33(i+vec3(1.0, 0.0, 0.0)), f-vec3(1.0, 0.0, 0.0));
  float n101 = dot(hash33(i+vec3(1.0, 0.0, 1.0)), f-vec3(1.0, 0.0, 1.0));
  float n110 = dot(hash33(i+vec3(1.0, 1.0, 0.0)), f-vec3(1.0, 1.0, 0.0));
  float n111 = dot(hash33(i+vec3(1.0, 1.0, 1.0)), f-vec3(1.0, 1.0, 1.0));

    // Interpolate along x, y, and z axes
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y), mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}

void main() {
  int grassSegment = GRASS_SEGMENTS;
  int grassVertices = (grassSegment+1)*2;

  // vertex id of a grass blade, if > GRASS_VERTICES, it's the other side of the blade
  int vertFB_ID = gl_VertexID%(grassVertices*2); // vertex id for a single grass blade. Range [0, grassVertices*2)
  int vertID = vertFB_ID%grassVertices; // vertex id for a single face. Range [0, grassVertices)

  //grass offset
  vec2 hashedInstanceID = hash21(uint(gl_InstanceID))*2.0-1.0;
  vec3 grassOffset = vec3(hashedInstanceID.x, 0.0, hashedInstanceID.y)*grassPatchSize*0.5; //if path size is 25, the offset range will be -12.5 to 12.5

  vec3 grassWorldPosition = vec3(modelMatrix*vec4(grassOffset, 1.0)).xyz;
  vec3 hashVal = hash33(grassWorldPosition);

  tilePosition = (vec2(hashedInstanceID.x, hashedInstanceID.y)+1.0)*0.5;
  vec3 tileCenterWS = (modelMatrix*vec4(0.0, 0.0, 0.0, 1.0)).xyz; //tile center in world space
  vec2 worldXZ = tileCenterWS.xz+grassOffset.xz;

  vec2 terrainMin = vec2(-terrainSize.x*0.5,-terrainSize.y*0.5);
  vec2 terrainMax = vec2(terrainSize.x*0.5, terrainSize.y*0.5);

    //the world position of bottom left corner of the terrain is (-50, 100) instead of (-50, -100), as positiv Z is pointing towards the camera
  float u = (worldXZ.x-terrainMin.x)/(terrainMax.x-terrainMin.x);
  float v = (terrainMax.y-worldXZ.y)/(terrainMax.y-terrainMin.y);        // FLIPPED on Z
    //vec2 grassWorldXZShifted = vec2(grassWorldPosition.x-(-terrainSize.x*0.5), grassWorldPosition.z-(terrainSize.y*0.5));
    //vec2 grassTerrainUVPosition = vec2(grassWorldXZShifted.x/terrainSize.x, grassWorldXZShifted.y/terrainSize.y); //grass position mapped to terrain UV space
  vec2 grassTerrainUVPosition = vec2(u, v);
  float grassGrowth = texture2D(grassMask, grassTerrainUVPosition).x;
  float terrainHeight = texture2D(grassHeightMap, grassTerrainUVPosition).x;
  grassOffset.y += terrainHeight*TERRAIN_MAX_HEIGHT;

  vGrassTerrainUVPosition = grassTerrainUVPosition;

  //randomize the angle of the grass from grass world position
  float angle = remap(hashVal.x,-1.0, 1.0,-PI, PI); 

  //0 = left, 1 = right
  int xTest = vertID&0x1;
  int zTest = (vertFB_ID>=grassVertices) ? 1 : -1;
  float xSide = float(xTest);
  float zSide = float(zTest); 

  //verID - xTest rounds the vertex ID to the nearest even number
  float heightPercentage = float(vertID-xTest)/(float(grassSegment)*2.0);

    //width decreases as the height increases
  float width = grassWidth*easeOut(1.0-heightPercentage, 2.0)*grassGrowth;
  float height = grassHeight*grassGrowth;
    // add some randomness to grass height
  float randomTallGrass = hashVal.x>0.7 ? hashVal.x*2.0 : 1.0;
  height *= randomTallGrass;

  //x position will be -width/2 or width/2 depending on which side the vertex is on
  float x = (xSide-0.5)*width;
  float y = heightPercentage*height;
  float z = 0.0;

  // wind animation
  // float leanAnimation = sin(time * 2.0 + hashVal.y*5.0) * 0.025;
  float windStrength = noise(vec3(grassWorldPosition.xz*0.05, 0.0)+time);
  float windAngle = 0.0;
  // along the local x axis. Cause the grass curve towards z axis. 
  // rotate vertices along x axis, especially on the tip of the blade
  vec3 windAxis = vec3(cos(windAngle), 0.0, sin(windAngle));
  float windLeanAngle = windStrength*1.5*heightPercentage;

  float randomLeanAnimation = noise(vec3(grassWorldPosition.xz, time*4.0))*(windStrength*0.5+0.125);
  float leanFactor = remap(hashVal.y,-1.0, 1.0,-0.5, 0.5)+randomLeanAnimation;

  // bezier curve
  vec3 p0 = vec3(0.0, 0.0, 0.0);
  vec3 p1 = vec3(0.0, 0.33, 0.0);
  vec3 p2 = vec3(0.0, 0.77, 0.0);
  vec3 p3 = vec3(0.0, cos(leanFactor), sin(leanFactor));
  //interpolated position along the blade's bending path
  //bending only on y and z axis
  vec3 curve = bezier(p0, p1, p2, p3, heightPercentage);

  //compute the tangent vector of the curve at the current height
  vec3 curveGradient = bezierGradient(p0, p1, p2, p3, heightPercentage);
  //rotate the tangent vector to get the normal vector
  //the tangent vector is in the YZ plane
  //use zSide to flip the normal on the back face
  mat2 rotate90 = mat2(0.0, 1.0,-1.0, 0.0)*-zSide;
  y = curve.y*height;
  z = curve.z*height;

  mat3 grassMatrix = rotateAxis(windAxis, windLeanAngle)*rotateY(angle);

  vec3 grassLocalPosition = grassMatrix*vec3(x, y, z)+grassOffset;
  vec3 grassLocalNormal = grassMatrix*vec3(0.0, rotate90*curveGradient.yz);

  vec4 worldPosition = modelMatrix*vec4(grassLocalPosition, 1.0);
  vPosWS = worldPosition.xyz; // required for shadow map

  // Blend normal
  float distanceBlend = smoothstep(0.0, 10.0, distance(cameraPosition, grassWorldPosition));
  grassLocalNormal = mix(grassLocalNormal, vec3(0.0, 1.0, 0.0), distanceBlend*0.5);
  grassLocalNormal = vec3(0.0, 1.0, 0.0); //ignore normal blending for now
  grassLocalNormal = normalize(grassLocalNormal);

  vec3 transformedNormal = normalize(mat3(modelViewMatrix)*grassLocalNormal);

  //view space thickening

  //calculate the view direction. vector from the grass to camera
  vec3 viewDir = normalize(cameraPosition-grassWorldPosition);
  //calculate the face direction of the grass blade after local transformation
  vec3 grassFaceNomrl = normalize(grassMatrix*vec3(0.0, 0.0, 1.0));

  //calculate the dot product between the view direction and the grass face normal
  //this tells us how much the grass is facing the camera
  //if the grass is facing the camera, the dot product will be close to 1
  //if the grass is facing away from the camera, the dot product will be close to -1

    //get position in view space
  vec4 viewSpacePosition = modelViewMatrix*vec4(grassLocalPosition, 1.0);
    //method-2: view space thickening
    //viewDotNormal ranges from 0 to 1
    //if the grass is facing the camera, the dot product will be close to 1
    //if the grass is facing away, the dot product will be close to 0
    //if the grass is perpendicular or facing opposite to the camera, the result is 0
  float viewDotNormal = saturate(dot(viewDir, grassFaceNomrl));
    //thickening effect factor
    //facing camera, viewDotNormal close to 1, thickeningFactor close to 0, less effect
    //facing away, viewDotNormal close to 0, thickeningFactor close to 1, more effect
  float thickeningFactor = easeOut(1.0-viewDotNormal, 4.0);
    //make the effect strong for grass that is slightly facing the camera
    //remove the effect for grass that is perpendicular or facing away from the camera
  thickeningFactor *= smoothstep(0.0, 0.2, viewDotNormal);

  viewSpacePosition.x += thickeningFactor*(xSide-0.5)*width*0.5*1.2;

  gl_Position = projectionMatrix*viewSpacePosition;
  gl_Position.w = grassGrowth<0.25 ? 0.0 : gl_Position.w; 

  //vColor = mix(BASE_COLOR, TIP_COLOR, heightPercentage);
  vGrassData = vec4(x, 0.0, 0.0, 0.0);


  // Hand coords to shadow system
  #include <shadowmap_vertex>

}