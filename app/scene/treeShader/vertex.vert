uniform float time;
uniform int treeVertices;
uniform int treeSegment;
uniform float treeWidth;
uniform float treeHeight;

varying vec2 vUv;


const float PI = 3.1415926535;

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

float circleSDF(vec2 p, vec2 center, float radius) {
    return length(p - center) - radius;
}

// Union of vertically stacked 2D circles in the XY plane
float canopySDF(vec2 posXY) {
    float d = 1000.0;

    // Define canopy shape — stacked puffballs
    vec2 centers[5];
    float radii[5];

    centers[0] = vec2(0.0, 0.0);   radii[0] = 4.0;
    centers[1] = vec2(-3.0, 3.0);  radii[1] = 3.5;
    centers[2] = vec2(3.0, 3.0);   radii[2] = 3.5;
    centers[3] = vec2(-2.0, 6.0);  radii[3] = 3.0;
    centers[4] = vec2(2.0, 6.0);   radii[4] = 3.0;

    for (int i = 0; i < 5; i++) {
        float dist = circleSDF(posXY, centers[i], radii[i]);
        d = min(d, dist);
    }

    return d;
}

vec2 canopyOrigin() {
    vec2 centers[5];
    float radii[5];

    centers[0] = vec2(0.0, 0.0);   radii[0] = 4.0;
    centers[1] = vec2(-3.0, 3.0);  radii[1] = 3.5;
    centers[2] = vec2(3.0, 3.0);   radii[2] = 3.5;
    centers[3] = vec2(-2.0, 6.0);  radii[3] = 3.0;
    centers[4] = vec2(2.0, 6.0);   radii[4] = 3.0;

    vec2 sum = vec2(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < 5; i++) {
        sum += centers[i] * radii[i];
        totalWeight += radii[i];
    }

    return sum / totalWeight;
}

void main() {

  int vertID = gl_VertexID % treeVertices;

  //grass offset
  // range from -1.0 to 1.0
  vec2 hashedInstanceID = hash(float(gl_InstanceID)) * 2.0 - 1.0;

  
  //randomize foliage on x and y axis
  //the x position and y position will be randomized between -grassPatchSize and grassPatchSize
  //x: -5 to 5
  //y: 0 to 5
  vec3 foliageOffset = vec3(hashedInstanceID.x*5.0, (hashedInstanceID.y+1.0) * 2.5, 0);
  float d = circleSDF(foliageOffset.xy, vec2(0.0), 1.0);
  if (d > 0.0){
    vec2 eps = vec2(0.01, 0.0);
    vec2 grad = normalize(vec2(
        canopySDF(foliageOffset.xy + eps.xy) - canopySDF(foliageOffset.xy - eps.xy),
        canopySDF(foliageOffset.xy + eps.yx) - canopySDF(foliageOffset.xy - eps.yx)
    ));
    foliageOffset.xy += grad * d;
  };


  //0 = left, 1 = right
  int xTest = vertID & 0x1;  
  float xSide = float(xTest);
  //float zSide = float(zTest); 
  //verID - xTest rounds the vertex ID to the nearest even number
  float heightPercentage = float(vertID - xTest) / (float(treeSegment)*2.0);

  //width decreases as the height increases
  float width = treeWidth * easeOut(1.0 - (heightPercentage-0.5)*2.0, 2.0);
  float height = treeHeight;

  //x position will be -width/2 or width/2 depending on which side the vertex is on
  float x = (xSide - 0.5) * width;
  float y = heightPercentage * height;
  float z = 0.0;

  // Apply the bezier curve
//   float leanAnimation = sin(time * 2.0 + hashVal.y*5.0) * 0.025;
//   float leanFactor = remap(hashVal.y, -1.0, 1.0, -0.5, 0.5) + leanAnimation ;

  //wind animation
//   float windStrength = noise(vec3(grassWorldPosition.xz * 0.05, 0.0) + time);


//   vec3 p0 = vec3(0.0, 0.0, 0.0);
//   vec3 p1 = vec3(0.0, 0.33, 0.0);
//   vec3 p2 = vec3(0.0, 0.88, 0.0);
//   vec3 p3 = vec3(0.0, cos(leanFactor), sin(leanFactor));
  //interpolated position along the blade's bending path
  //bending only on y and z axis
//   vec3 curve = bezier(p0, p1, p2, p3, heightPercentage);

  //compute the tangent vector of the curve at the current height
//   vec3 curveGradient = bezierGradient(p0, p1, p2, p3, heightPercentage);
  //rotate the tangent vector to get the normal vector
  //the tangent vector is in the YZ plane
//   mat2 rotate90 = mat2(0, 1, -1, 0);
//   y = curve.y * height;
//   z = curve.z * height;

  //transformation
//   mat3 grassMatrix = rotateY(angle*0.1) * rotateX(PI*0.3);
 
//   vec3 originToCamera = normalize(cameraPosition - vec3(0.0, 0.0, 0.0));
//   float angleToZ = acos(dot(originToCamera, vec3(0.0, 0.0, 1.0)));
//   mat3 xRotation = rotateX(-angleToZ );


//   vec2 camXZ = normalize(vec2(originToCamera.x, originToCamera.z));
//   float angleToZ_Y = atan(camXZ.x, camXZ.y); // Signed angle in XZ plane
//   mat3 yRotation = rotateY(angleToZ_Y);
//   mat3 grassMatrix = yRotation;

  //billboard rotation
  vec3 forward = normalize(cameraPosition - vec3(0.0)); // world origin
  vec3 up = vec3(0.0, 1.0, 0.0); // world up
  vec3 right = normalize(cross(up, forward));
  vec3 trueUp = cross(forward, right);

  mat3 lookAtMatrix = mat3(right, trueUp, forward);

  float angleZ = remap(hashedInstanceID.x, -1.0, 1.0, -PI/4.0, 0.0);
  mat3 treeMatrix = lookAtMatrix * rotateZ(angleZ);


  vec3 foliageLocalPosition = treeMatrix *  vec3(x, y, z) + foliageOffset;
  vec3 foliageLocalNormal = treeMatrix * vec3(0.0, 0.0, 1.0);


  //view space thickening
  
  //calculate the view direction. vector from the grass to camera
  //vec3 viewDir = normalize(cameraPosition - grassWorldPosition);
  //calculate the face direction of the grass blade after local transformation
  //vec3 grassFaceNomrl = normalize(grassMatrix * vec3(0.0, 0.0, 1.0));
  
    //get position in view space
    //vec4 viewSpacePosition = modelViewMatrix * vec4( grassLocalPosition, 1.0);
    //method-2: view space thickening
    //viewDotNormal ranges from 0 to 1
    //if the grass is facing the camera, the dot product will be close to 1
    //if the grass is facing away, the dot product will be close to 0
    //if the grass is perpendicular or facing opposite to the camera, the result is 0
    //float viewDotNormal = saturate(dot(viewDir, grassFaceNomrl));
    //thickening effect factor
    //facing camera, viewDotNormal close to 1, thickeningFactor close to 0, less effect
    //facing away, viewDotNormal close to 0, thickeningFactor close to 1, more effect
    //float thickeningFactor = easeOut(1.0 - viewDotNormal, 4.0);
    //make the effect strong for grass that is slightly facing the camera
    //remove the effect for grass that is perpendicular or facing away from the camera
    //thickeningFactor *= smoothstep(0.0, 0.2, viewDotNormal);

    //viewSpacePosition.x += thickeningFactor * (xSide - 0.5) * width * 0.5  * 1.2;
    
    gl_Position = projectionMatrix *  modelViewMatrix * vec4(foliageLocalPosition, 1.0);
}