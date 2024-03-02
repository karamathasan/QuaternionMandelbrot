precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

struct Quaternion{
    float r;
    float i;
    float j;
    float k;
};

Quaternion Qadd(Quaternion q1, Quaternion q2){
    return Quaternion(
        q1.r + q2.r,
        q1.i + q2.i,
        q1.j + q2.j,
        q1.k + q2.k
    );
}

Quaternion Qmultiply(Quaternion q1, Quaternion q2){
    return Quaternion(
        q1.r * q2.r - q1.i * q2.i - q1.j * q2.j - q1.k * q2.k,
        q1.r * q2.i + q1.i * q2.r + q1.j * q2.k - q1.k * q2.j,
        q1.r * q2.j - q1.i * q2.k + q1.j * q2.r + q1.k * q2.i,
        q1.r * q2.k + q1.i * q2.j - q1.j * q2.i + q1.k * q2.r
    );
}

Quaternion VecToQuaternion(vec3 v){
    return Quaternion(
        0.,
        v.x,
        v.y,
        v.z
    );
}

vec3 QuaternionToVec(Quaternion q){
    return vec3(q.i,q.j,q.k);
}

float Qlength(Quaternion q){
    vec3 v = QuaternionToVec(q);
    return length(v);
}

Quaternion newQuaternion(){
    return Quaternion(
        0.,0.,0.,0.
    );
}

//Henyey-Greenstein function
float HG(){
    return 1.;
}

float maxcomp(vec3 v){
    return max(max(v.x,v.y),v.z);
}

float boxSDF(vec3 pos,vec3 r){
    vec3 q = abs(pos)-r;
    return length(max(q, 0.)) + min(maxcomp(q),0.);
}

mat2 rotate2D(float theta){
    theta = radians(theta);
    float s = sin(theta);
    float c = cos(theta);
    return mat2(
        c, -s,
        s, c
    );
}

float mandelbrot(Quaternion c){
    const int iterationLimit = 100;
    int count = 0;
    float temp;
    float temp2;
    float temp3;
    temp = c.r;
    temp2 = c.i;
    temp3 = c.j;
    c.r = c.i;
    c.i = c.j;
    c.j = c.k;
    c.k = temp;
    // c.k = 0.;
    Quaternion z = newQuaternion();
    // z.r=0.5;
    for (int i = 0; i < iterationLimit; i ++){
        count+=1;
        z = Qadd(Qmultiply(z,z), c);
        if (Qlength(z) > 100.){
            return 0.;
            // return float(count)/float(iterationLimit);
        }
        
    }
    return 2.;
}

float BeersLaw(float dist, float absorption){
    return exp(-1. * dist * absorption);
}

vec3 render(vec2 uv){
    vec3 pos = vec3(2. * sin(u_time),0,-2. * cos(u_time)); 
    vec3 rd = vec3(uv.xy,1);
    rd.xz *= rotate2D(-u_time);
    // rd.yz *= rotate2D(-45.);
    vec3 prevPos = pos;
    normalize(rd);

    const int iterationLimit = 300;
    vec3 boxSize = vec3(2);
    // float step = boxSDF(pos,boxSize);
    float step = 0.05;
    float dist = 0.;
    float densityIntegration = 0.;
    bool entered = false;
    for (int i = 0; i < iterationLimit; i ++){
        prevPos = pos;
        pos += rd * step;

        if (length(pos)>30.){
            //exceeds ray length
            break;
        }

        if (boxSDF(pos,boxSize) < 0.){
            if (entered != true){
                entered = true;
            }
            // not inside the box 
        }

        if (entered == true){
            dist += length(pos - prevPos);
            densityIntegration += length(pos - prevPos) * mandelbrot(VecToQuaternion(pos));
        }

        if (entered == true && boxSDF(pos,boxSize) > 0.){
            return vec3(BeersLaw(densityIntegration, 0.8));
        }

        // step = boxSDF(pos,boxSize);
        // if (step < 0.01){
        //     return vec3(0.0196, 0.0196, 0.0196);
        // }
    }
    return vec3(1);
}

void main(){
    vec2 uv = vec2(2.0 * gl_FragCoord.xy / u_resolution - 1.);   
    vec3 color = render(uv);

    // vec3 color = vec3(mandelbrot(VecToQuaternion(vec3(uv.xy,0))));
    gl_FragColor = vec4(color,1.);
}