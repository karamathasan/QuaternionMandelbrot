precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

struct Quaternion{
    float r;
    float i;
    float j;
    float k;
};

Quaternion multiply(Quaternion q1, Quaternion q2){
    return Quaternion(
        q1.r * q2.r - q1.i * q2.i - q1.j * q2.j - q1.k * q2.k,
        q1.r * q2.i + q1.i * q2.r + q1.j * q2.k - q1.k * q2.j,
        q1.r * q2.j - q1.i * q2.k + q1.j * q2.r + q1.k * q2.i,
        q1.r * q2.k + q1.i * q2.j - q1.j * q2.i + q1.k * q2.r
    );
}

float maxcomp(vec3 v){
    return max(max(v.x,v.y),v.z);
}

float boxSDF(vec3 pos,vec3 r){
    vec3 q = abs(pos)-r;
    return length(max(q, 0.)) + min(maxcomp(q),0.);
}

// vec3 mandelbrot(Quaternion q){

// }

vec3 render(vec2 uv){
    vec3 pos = vec3(0,0,-5); 
    vec3 rd = vec3(uv.xy,1);
    normalize(rd);

    const int iterationLimit = 50;
    vec3 boxSize = vec3(2);
    float step = boxSDF(pos,boxSize);
    for (int i = 0; i < iterationLimit; i ++){
        pos += rd * step;
        step = boxSDF(pos,boxSize);
        if (step < 0.01){
            return vec3(0.0196, 0.0196, 0.0196);
        }
    }
    return vec3(1);
}

void main(){
    vec2 uv = vec2(2.0 * gl_FragCoord.xy / u_resolution - 1.);   
    vec3 color = render(uv);
    gl_FragColor = vec4(color,1.);
}