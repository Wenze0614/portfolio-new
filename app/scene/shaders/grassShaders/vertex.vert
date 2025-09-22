uniform float u_effectBlend;
uniform float u_remap;
uniform float u_normalize;
uniform float grassWidth;
uniform float grassHeight;
uniform float grassPatchSize;
uniform float time;
uniform sampler2D terrainTexture;


varying vec2 tilePosition;
varying vec3 vColor;
varying vec4 vGrassData;

const float PI = 3.1415926535;
const vec3 BASE_COLOR = vec3(0.1, 0.4, 0.04); // Base color for the grass
const vec3 TIP_COLOR = vec3(0.5, 0.7, 0.3); // Tip color for the grass

float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
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
    src ^= src >> 24u;
    src *= M;

    h *= M;
    h ^= src;
    h ^= h >> 13u;
    h *= M;
    h ^= h >> 15u;

    return h;
}

// Convert uvec2 hash -> vec2 in [0,1]
vec2 hash21(uint n) {
    uvec2 h = murmurHash21(n);
    // 0xffffffffu = 4294967295
    return vec2(h) * (1.0 / 4294967295.0);
}

vec3 hash33(vec3 p) {
    p = fract(p * 0.1031);                      // fractional scrambling
    p += dot(p, p.yzx + 33.33);                 // non-linear mix
    return -1.0 + 2.0 * fract((p.xxy + p.yzz) * p.zyx);      // final mixing
}

float easeOut(float x, float t){
    return 1.0 - pow(1.0 - x, t);
}

mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat3(
         c, 0.0, -s,
         0.0, 1.0, 0.0,
         s, 0.0,  c
    );
}

mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat3(
         1.0, 0.0,  0.0,
         0.0,  c,   s,
         0.0, -s,   c
    );
}

mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat3(
         c,  s, 0.0,
        -s,  c, 0.0,
         0.0, 0.0, 1.0
    );
}

mat3 rotateAxis(vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    axis = normalize(axis);

    return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
}

vec3 bezier(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    float u = 1.0 - t;
    float tt = t * t;
    float uu = u * u;
    float uuu = uu * u;
    float ttt = tt * t;

    vec3 point = uuu * p0; // (1-t)^3 * p0
    point += 3.0 * uu * t * p1; // 3 * (1-t)^2 * t * p1
    point += 3.0 * u * tt * p2; // 3 * (1-t) * t^2 * p2
    point += ttt * p3; // t^3 * p3

    return point;
}

vec3 bezierGradient(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    float u = 1.0 - t;
    float tt = t * t;
    float uu = u * u;

    vec3 tangent = 
        3.0 * uu * (p1 - p0) + 
        6.0 * u * t * (p2 - p1) + 
        3.0 * tt * (p3 - p2);

    return normalize(tangent);
}

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    // Smooth interpolation
    vec3 u = f * f * (3.0 - 2.0 * f);

    // Hashing corners of the cube
    float n000 = dot(hash33(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0));
    float n001 = dot(hash33(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));
    float n010 = dot(hash33(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));
    float n011 = dot(hash33(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));
    float n100 = dot(hash33(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));
    float n101 = dot(hash33(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));
    float n110 = dot(hash33(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));
    float n111 = dot(hash33(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0));

    // Interpolate along x, y, and z axes
    return mix(
        mix(
            mix(n000, n100, u.x),
            mix(n010, n110, u.x),
            u.y
        ),
        mix(
            mix(n001, n101, u.x),
            mix(n011, n111, u.x),
            u.y
        ),
        u.z
    );
}

void main() {
  int grassSegment = GRASS_SEGMENTS;
  int grassVertices = (grassSegment+1) * 2;

  // vertex id of a grass blade, if > GRASS_VERTICES, it's the other side of the blade
  int vertFB_ID = gl_VertexID % (grassVertices * 2); // vertex id for a single grass blade. Range [0, grassVertices*2)
  int vertID = vertFB_ID % grassVertices; // vertex id for a single face. Range [0, grassVertices)

  //grass offset
  vec2 hashedInstanceID = hash21(uint(gl_InstanceID)) * 2.0 - 1.0;
  vec3 grassOffset = vec3(hashedInstanceID.x, 0.0, hashedInstanceID.y) * grassPatchSize * 0.5; //if path size is 25, the offset range will be -12.5 to 12.5


  //grid position of grass blades
  //7 means 7 grass blades in one unit
  //the more this number the more grass blades in one unit length
  // int resolution = int(grassPatchSize) * 7; 
  // int row = gl_InstanceID / resolution;
  // int col = gl_InstanceID % resolution;

  // vec2 base = vec2(col, row) / float(resolution);
  // vec2 jitter = (hash(float(gl_InstanceID)) - 0.5) / float(resolution); // [-0.5, 0.5] jitter
  // base = (base + jitter) * 2.0 - 1.0;
  //randomize grass on x and z axis
  //grass patch size is half of the plane size
  //the x position and z position will be randomized between -grassPatchSize and grassPatchSize
  //vec3 grassOffset = offset;

  vec3 grassWorldPosition = vec3(modelMatrix * vec4(grassOffset, 1.0)).xyz;
  vec3 hashVal = hash33(grassWorldPosition);

  tilePosition = (vec2(hashedInstanceID.x, hashedInstanceID.y) + 1.0) * 0.5;



  //randomize the angle of the grass from grass world position
  float angle = remap(hashVal.x, -1.0, 1.0, -PI, PI); 

  //0 = left, 1 = right
  int xTest = vertID & 0x1;  
  int zTest = (vertFB_ID >= grassVertices) ? 1: -1;
  float xSide = float(xTest);
  float zSide = float(zTest); 
  
  //verID - xTest rounds the vertex ID to the nearest even number
  float heightPercentage = float(vertID - xTest) / (float(grassSegment)*2.0);

  //width decreases as the height increases
  float width = grassWidth * easeOut(1.0 - heightPercentage, 2.0);
  float height = grassHeight;

  //x position will be -width/2 or width/2 depending on which side the vertex is on
  float x = (xSide - 0.5) * width;
  float y = heightPercentage * height;
  float z = 0.0;

  // wind animation
  // float leanAnimation = sin(time * 2.0 + hashVal.y*5.0) * 0.025;
  float windStrength = noise(vec3(grassWorldPosition.xz * 0.05, 0.0) + time);
  float windAngle = 0.0;
  // along the local x axis. Cause the grass curve towards z axis. 
  // rotate vertices along x axis, especially on the tip of the blade
  vec3 windAxis = vec3(cos(windAngle), 0.0, sin(windAngle));
  float windLeanAngle = windStrength * 1.5 * heightPercentage;
   
  float randomLeanAnimation = noise(vec3(grassWorldPosition.xz, time * 4.0)) * (windStrength * 0.5 + 0.125);
  float leanFactor = remap(hashVal.y, -1.0, 1.0, -0.5, 0.5) + randomLeanAnimation ;

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
  mat2 rotate90 = mat2(0.0, 1.0, -1.0, 0.0) * -zSide;
  y = curve.y * height;
  z = curve.z * height;

  //transformation
  // mat3 grassMatrix = rotateY(angle*0.1) * rotateX(PI*0.3);
 
  // vec3 originToCamera = normalize(cameraPosition - vec3(0.0, 0.0, 0.0));
  // float angleToZ = acos(dot(originToCamera, vec3(0.0, 0.0, 1.0)));
  // mat3 xRotation = rotateX(-angleToZ );


  // vec2 camXZ = normalize(vec2(originToCamera.x, originToCamera.z));
  // float angleToZ_Y = atan(camXZ.x, camXZ.y); // Signed angle in XZ plane
  // mat3 yRotation = rotateY(angleToZ_Y);
  // mat3 grassMatrix = yRotation;

  //billboard rotation
  // vec3 forward = normalize(cameraPosition - vec3(0.0)); // world origin
  // vec3 up = vec3(0.0, 1.0, 0.0); // world up
  // vec3 right = normalize(cross(up, forward));
  // vec3 trueUp = cross(forward, right);

  // mat3 lookAtMatrix = mat3(right, trueUp, forward);

  // float angleZ = remap(hashedInstanceID.x, -1.0, 1.0, -PI/4.0, 0.0);
  // mat3 grassMatrix = lookAtMatrix * rotateZ(angleZ);

  // along the local x axis. Cause the grass curve towards z axis. 
  // rotate vertices along x axis, especially on the tip of the blade
  mat3 grassMatrix = rotateAxis(windAxis, windLeanAngle) * rotateY(angle);


  vec3 grassLocalPosition = grassMatrix * vec3(x, y, z) + grassOffset;
  vec3 grassLocalNormal = grassMatrix * vec3(0.0, rotate90 * curveGradient.yz);

  // Blend normal
  float distanceBlend = smoothstep(0.0, 10.0, distance(cameraPosition, grassWorldPosition));
  grassLocalNormal = mix(grassLocalNormal, vec3(0.0, 1.0, 0.0), distanceBlend * 0.5);
  grassLocalNormal = vec3(0.0, 1.0, 0.0);
  grassLocalNormal = normalize(grassLocalNormal);


  //view space thickening
  
  //calculate the view direction. vector from the grass to camera
  vec3 viewDir = normalize(cameraPosition - grassWorldPosition);
  //calculate the face direction of the grass blade after local transformation
  vec3 grassFaceNomrl = normalize(grassMatrix * vec3(0.0, 0.0, 1.0));
  

  //calculate the dot product between the view direction and the grass face normal
  //this tells us how much the grass is facing the camera
  //if the grass is facing the camera, the dot product will be close to 1
  //if the grass is facing away from the camera, the dot product will be close to -1
  //method-1: billboard rotation
//   float vewDotNormal = dot(viewDir, grassFaceNomrl);
  //rotate the grass so it faces more to the camera
//   if(abs(vewDotNormal) < 0.5){
//     vec2 nXZ = normalize(grassFaceNomrl.xz);
//     vec2 vXZ = normalize(viewDir.xz);
//     float angleXZ = acos(dot(nXZ, vXZ));
//     float sign = sign(nXZ.x * vXZ.y - nXZ.y*vXZ.x);
//     angle *= sign;

//     mat3 adjust = rotateY(angle * 0.5);
//     grassLocalPosition = adjust * grassLocalPosition;
//     grassLocalNormal = adjust * grassLocalNormal;
//   }

    //get position in view space
    vec4 viewSpacePosition = modelViewMatrix * vec4( grassLocalPosition, 1.0);
    //method-2: view space thickening
    //viewDotNormal ranges from 0 to 1
    //if the grass is facing the camera, the dot product will be close to 1
    //if the grass is facing away, the dot product will be close to 0
    //if the grass is perpendicular or facing opposite to the camera, the result is 0
    float viewDotNormal = saturate(dot(viewDir, grassFaceNomrl));
    //thickening effect factor
    //facing camera, viewDotNormal close to 1, thickeningFactor close to 0, less effect
    //facing away, viewDotNormal close to 0, thickeningFactor close to 1, more effect
    float thickeningFactor = easeOut(1.0 - viewDotNormal, 4.0);
    //make the effect strong for grass that is slightly facing the camera
    //remove the effect for grass that is perpendicular or facing away from the camera
    thickeningFactor *= smoothstep(0.0, 0.2, viewDotNormal);

    viewSpacePosition.x += thickeningFactor * (xSide - 0.5) * width * 0.5  * 1.2;
    
    gl_Position = projectionMatrix *  viewSpacePosition;

  //vColor = mix(BASE_COLOR, TIP_COLOR, heightPercentage);
  vGrassData = vec4(x, 0.0, 0.0, 0.0);

}