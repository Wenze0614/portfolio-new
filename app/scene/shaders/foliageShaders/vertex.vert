#include <common>
#include <shadowmap_pars_vertex>

uniform int uFoliageSegment;
uniform vec2 uQuadNumber; // x: horizontal quads, y: vertical quads
uniform int uClumpNumber; // number of clumps
uniform float uSphereRadius;
uniform vec2 uFoliageSize;

varying vec2 vUv;
varying vec3 vPosWS;
varying vec3 vNormalWS;
varying vec4 vTerrainShadowCoord;

// const float width = 0.5;
// const float height = 0.5;

const float JITTER = 0.134;

mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0,-s, c);
}

mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat3(c, 0.0,-s, 0.0, 1.0, 0.0, s, 0.0, c);
}

mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat3(c, s, 0.0,-s, c, 0.0, 0.0, 0.0, 1.0);
}

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

vec3 hash31(float p) {
    vec3 p3 = fract(vec3(p)*vec3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yzx+19.19);
    return fract((p3.xxy+p3.yzz)*p3.zyx);
}

vec3 fibonacciPoint(int clumpID, int clumpNum, float radius) {
    float phi = PI*(3.0-sqrt(5.0));    // golden angle
    float y = 1.0-(float(clumpID)/float(clumpNum-1))*2.0;           // 1..-1
    float r = sqrt(1.0-y*y);
    float th = float(clumpID)*phi;
    vec3 p = vec3(cos(th)*r, y, sin(th)*r)*radius;
    return p;
}

float inverseLerp(float v, float minValue, float maxValue) {
  return (v-minValue)/(maxValue-minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

void main() {

    int horitontal_quads = int(uQuadNumber.x);
    int vertical_quads = int(uQuadNumber.y);
    int totalNumQuads = horitontal_quads+vertical_quads;

    int foliageVerticesPerSidePerQuad = (uFoliageSegment+1)*2; //=4
    int foliageVerticesPerQuad = foliageVerticesPerSidePerQuad*2; //=8
    int clumpID = int(floor(float(gl_VertexID)/(float(foliageVerticesPerQuad*(totalNumQuads))))); // which clump. Range [0, CLUMPS_NUM)
    int quadID = int(floor(float(gl_VertexID)/float(foliageVerticesPerQuad)))-clumpID*totalNumQuads; // which quad. Range [0, number of quads)
    int quadVertID = gl_VertexID%(foliageVerticesPerSidePerQuad); // vertex id for a single quad. Range [0,  foliageVerticesPerSidePerQuad*2)
    int vertID = quadVertID%foliageVerticesPerSidePerQuad; // vertex id for a single face. Range [0,  foliageVerticesPerSidePerQuad)

    vec2 hashedInstanceID = hash21(uint(vertID))*2.0-1.0;

    int xTest = vertID&0x1; // 0 or 1, used to alternate between left and right side of the quad
    int zTest = (quadVertID>=foliageVerticesPerSidePerQuad) ? 1 : -1; // 1 or -1, used to alternate between front and back side of the quad

    float xSide = float(xTest);
    float zSide = float(zTest);

    float heightPercentage = float(vertID-xTest)/(float(uFoliageSegment)*2.0); // 0 to 1 from bottom to top of the blade

    float x = (xSide-0.5)*uFoliageSize.x;
    float y = heightPercentage*uFoliageSize.y-uFoliageSize.y*0.5; // center at y=0
    float z = 0.0;
    vec3 n = vec3(0.0, 0.0,-1.0); // default normal

    vec3 quadVertLocalPosition = vec3(x, y, z);
    if(quadID<horitontal_quads) {
        // horizontal quads, rotate around X axis
        float angle = (PI/(float(horitontal_quads)+1.0))*(float(quadID)+1.0);

        quadVertLocalPosition = rotateX(angle)*quadVertLocalPosition;
        n = rotateX(angle)*n;
    } else {
        float angle = (PI/(float(vertical_quads)+1.0))*(float(quadID-horitontal_quads)+1.0);
        quadVertLocalPosition = rotateY(angle)*quadVertLocalPosition;
        n = rotateY(angle)*n;

    }

    // add some jitter
    vec3 jitterAngle = hash31(float(clumpID))*2.0*PI; //0~2PI
    mat3 jitterRot = rotateX(jitterAngle.x)*rotateY(jitterAngle.y)*rotateZ(jitterAngle.z);
    vec3 spherePosition = fibonacciPoint(clumpID, uClumpNumber, uSphereRadius); //also the normal
    quadVertLocalPosition = spherePosition+jitterRot*quadVertLocalPosition;

    //for shadow map
    vec4 worldPosition = modelMatrix*vec4(quadVertLocalPosition, 1.0);
    vPosWS = worldPosition.xyz; // required for shadow map

    //experimenting with normal
    vec3 lightDirection = normalize(vec3(100, 160, 0));
    float ndl = dot(n, lightDirection); // 0 to 1, 0 at 90 degree, 1 at 0 degree
    if(ndl<0.0) {
        n = -n;
    }
    vNormalWS = normalize(mat3(modelMatrix)*(mix(spherePosition, n, ndl*0.25)));
    vec3 transformedNormal = normalize(mat3(modelViewMatrix)*(mix(spherePosition, n, ndl*0.25)));


    // sampling shadow from terrain shadow map instead of from foliage itself to avoid self-shadowing artifacts
    // vec4 worldBasePos = modelMatrix*vec4(0.0, 1.0, 0.0, 1.0);		
    // //varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
    // vTerrainShadowCoord = directionalShadowMatrix[0] * worldBasePos;

    vUv.x = xSide;
    vUv.y = heightPercentage;

    gl_Position = projectionMatrix*modelViewMatrix*vec4(quadVertLocalPosition, 1.0);

    // Hand coords to shadow system
    #include <shadowmap_vertex>
}