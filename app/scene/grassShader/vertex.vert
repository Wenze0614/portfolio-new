uniform float u_effectBlend;
uniform float u_remap;
uniform float u_normalize;
uniform float grassWidth;
uniform float grassHeight;
uniform int grassSegment;
uniform int grassVertices;
uniform float grassPatchSize;
uniform float time;


varying vec2 tilePosition;
varying vec3 vColor;

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

vec2 hash(float p){
// Use dot products with irrational numbers to reduce correlation
    return fract(sin(vec2(p, p + 1.0)) * vec2(43758.5453, 31415.9265));
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

  //vertex ID within a single face (either front or back)
int vertID = gl_VertexID % grassVertices;

  //grass offset
  vec2 hashedInstanceID = hash(float(gl_InstanceID)) * 2.0 - 1.0;

  //grid position of grass blades
  //7 means 7 grass blades in one unit
  //the more this number the more grass blades in one unit length
  int resolution = int(grassPatchSize) * 7; 
  int row = gl_InstanceID / resolution;
  int col = gl_InstanceID % resolution;

  vec2 base = vec2(col, row) / float(resolution);
  vec2 jitter = (hash(float(gl_InstanceID)) - 0.5) / float(resolution); // [-0.5, 0.5] jitter
  base = (base + jitter) * 2.0 - 1.0;
  //randomize grass on x and z axis
  //grass patch size is half of the plane size
  //the x position and z position will be randomized between -grassPatchSize and grassPatchSize
  vec3 grassOffset = vec3(base.x, 0.0, base.y) * grassPatchSize;

  vec3 grassWorldPosition = vec3(modelMatrix * vec4(grassOffset, 1.0)).xyz;
  vec3 hashVal = hash33(grassWorldPosition);

  tilePosition = (base.xy + 1.0)/2.0;

  //0 = left, 1 = right
  int xTest = vertID & 0x1;  
  float xSide = float(xTest);

  //verID - xTest rounds the vertex ID to the nearest even number
  float heightPercentage = float(vertID - xTest) / (float(grassSegment)*2.0);

  //width decreases as the height increases
  float width = grassWidth * easeOut(1.0 - (heightPercentage-0.5)*2.0, 2.0);
  float height = grassHeight;

  //x position will be -width/2 or width/2 depending on which side the vertex is on
  float x = (xSide - 0.5) * width;
  float y = heightPercentage * height;
  float z = 0.0;

  // Apply the bezier curve
  float leanAnimation = sin(time * 2.0 + hashVal.y*5.0) * 0.025;
  float leanFactor = remap(hashVal.y, -1.0, 1.0, -0.5, 0.5) + leanAnimation ;

  //wind animation
  float windStrength = noise(vec3(grassWorldPosition.xz * 0.05, 0.0) + time);


  vec3 p0 = vec3(0.0, 0.0, 0.0);
  vec3 p1 = vec3(0.0, 0.33, 0.0);
  vec3 p2 = vec3(0.0, 0.88, 0.0);
  vec3 p3 = vec3(0.0, cos(leanFactor), sin(leanFactor));
  //interpolated position along the blade's bending path
  //bending only on y and z axis
  vec3 curve = bezier(p0, p1, p2, p3, heightPercentage);

  //compute the tangent vector of the curve at the current height
  vec3 curveGradient = bezierGradient(p0, p1, p2, p3, heightPercentage);
  //rotate the tangent vector to get the normal vector
  //the tangent vector is in the YZ plane
  mat2 rotate90 = mat2(0, 1, -1, 0);
  y = curve.y * height;
  z = curve.z * height;

  float angleZ = remap(hashedInstanceID.x, -1.0, 1.0, -PI/4.0, 0.0);
  mat3 grassMatrix = rotateZ(angleZ);


  vec3 grassLocalPosition = grassMatrix *  vec3(x, y, z) + grassOffset;
  vec3 grassLocalNormal = grassMatrix * vec3(0.0, rotate90 * curveGradient.yz);


  //view space thickening
  
  //calculate the view direction. vector from the grass to camera
  vec3 viewDir = normalize(cameraPosition - grassWorldPosition);
  //calculate the face direction of the grass blade after local transformation
  vec3 grassFaceNomrl = normalize(grassMatrix * vec3(0.0, 0.0, 1.0));

    //get position in view space
    vec4 viewSpacePosition = modelViewMatrix * vec4( grassLocalPosition, 1.0);
    gl_Position = projectionMatrix *  viewSpacePosition;

  vColor = mix(BASE_COLOR, TIP_COLOR, heightPercentage);
}