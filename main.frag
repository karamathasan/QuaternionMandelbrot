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

Quaternion Qsubtract(Quaternion q1, Quaternion q2){
    return Quaternion(
        q1.r - q2.r,
        q1.i - q2.i,
        q1.j - q2.j,
        q1.k - q2.k
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
        v.x,
        v.y,
        v.z,
        0.
    );
    // return Quaternion(
    //     0.,
    //     v.x,
    //     v.y,
    //     v.z
    // );
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
vec3 mandelbrotVec(Quaternion c){
    const int iterationLimit = 100;
    int count = 0;
    // c.k = 1.;
    Quaternion z = newQuaternion();
    // z.r=0.5;
    for (int i = 0; i < iterationLimit; i ++){
        count+=1;
        Quaternion prev = z;
        z = Qadd(Qmultiply(z,z), c);
        Quaternion diff = Qsubtract(z,prev);
        if (Qlength(diff) > 500.){
            // return vec3(1.);
            float iterationCoefficient = float(count * count)/float(iterationLimit);
            return iterationCoefficient * vec3(0.0, 0.7647, 1.0);
        }   
    }
    return vec3(0);
    // if (z.k == 0.){
    //     return vec3(0,.1,.1);
    // }
    // return vec3(c.r);
    // return vec3(500. * QuaternionToVec(z));
}

float mandelbrot(Quaternion c){
    const int iterationLimit = 100;
    int count = 0;
    // float temp;
    // float temp2;
    // float temp3;
    // temp = c.r;
    // temp2 = c.i;
    // temp3 = c.j;
    // c.r = -2. * cos(u_time * 0.75);
    // c.r = c.k;
    // c.i = temp;
    // c.j = temp2;
    // c.k = temp3;
    // c.k = 0.;
    Quaternion z = newQuaternion();
    // z.r=0.5;
    for (int i = 0; i < iterationLimit; i ++){
        count+=1;
        z = Qadd(Qmultiply(z,z), c);
        if (Qlength(z) > 50.){
            // return 0.;
            float iterationCoefficient = float(count)/float(iterationLimit);
            return iterationCoefficient;
        }   
    }
    return 2.;
}

float BeersLaw(float dist, float absorption){
    return exp(-1. * dist * absorption);
}

vec3 render(vec2 uv){
    float w = 0.5;
    float d = 4.;
    vec3 pos = vec3(d * sin(u_time * w),0,-d * cos(u_time * w)); 
    // vec3 pos = vec3(0,0,-2); 
    vec3 rd = vec3(uv.xy,1);
    rd.xz *= rotate2D(360./6.28 * u_time * w);
    // rd.yz *= rotate2D(-45.);
    vec3 prevPos = pos;
    normalize(rd);

    const int iterationLimit = 350;
    vec3 boxSize = vec3(1.5);
    // float step = boxSDF(pos,boxSize);
    float step = 0.1;
    // float step = 0.02;
    float dist = 0.;
    float densityIntegration = 0.;
    vec3 densityVec = vec3(0);
    bool entered = false;

    //ray march to cube fog boundary
    for (int i = 0; i < 200; i ++){
        step = boxSDF(pos,boxSize);
        pos += rd * step;

        if (step < 0.01){
            // return vec3(0);
            entered = true;
            step = 0.05;
        }

        if (length(pos)>100. || (boxSDF(pos,boxSize) < 0.) && i < 2){
            //exceeds ray length or is already inside box
            entered = true;
            step = 0.02;
            break;
        }
    }

    //march within the cloud cube in segments
    for (int i = 0; i < iterationLimit; i ++){
        prevPos = pos;
        pos += rd * step;

        if (length(pos)>20.){
            //exceeds ray length
            break;
        }

        if (entered == true){
            dist += length(pos - prevPos);
            densityIntegration += length(pos - prevPos) * mandelbrot(VecToQuaternion(pos));
            densityVec += length(pos-prevPos) * mandelbrotVec(VecToQuaternion(pos));
        }

        if (entered == true && boxSDF(pos,boxSize) > 0.){
            //after leaving the box
            
            // return vec3(densityIntegration);
            return vec3(BeersLaw(densityIntegration, 0.8));
            
            // return densityVec;
            // return densityVec/2. * BeersLaw(densityIntegration,0.8);

            // return mandelbrotVec(VecToQuaternion(pos * BeersLaw(densityIntegration,0.8)) ) ;
            // return densityVec/3. * BeersLaw(densityIntegration,0.8) + mandelbrotVec(VecToQuaternion(pos));
        }

    }
    return vec3(0);
}

void main(){
    vec2 uv = vec2(2.0 * gl_FragCoord.xy / u_resolution - 1.);   
    vec3 color = render(uv);

    // vec3 color = vec3(mandelbrot(VecToQuaternion(vec3(uv.xy,0))));
    gl_FragColor = vec4(color,1.);
}