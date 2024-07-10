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

float maxcomp(vec3 v){
    return max(max(v.x,v.z),v.y);
}

vec3 spaceReptition(vec3 pos,vec3 r){
    return mod((pos+r/2.),2.*r );
    return pos;
}

vec3 mandelbrotRepition(vec3 pos, vec3 r){
    return mod(pos-r,2.*r)-r;
}

float boxSDF(vec3 pos,vec3 r){
    pos = spaceReptition(pos,r);
    vec3 q = abs(pos)-r;
    return length(max(q,0.0)) + min(maxcomp(q),0.);
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

//added in case of other recursive rules besides Zn+1 = Zn^2 + c
Quaternion complexFunc(Quaternion z, Quaternion c){
    return Qadd(Qmultiply(z,z), c);
    // return Qsubtract(Qmultiply(z,z),Qmultiply(c,c));
    // return Qadd(Qmultiply(z,Qmultiply(z,z)), c);
}

//used to assign colors with densities
vec3 mandelbrotVec(Quaternion c){
    const int iterationLimit = 100;
    int count = 0;
    Quaternion z = newQuaternion();
    for (int i = 0; i < iterationLimit; i ++){
        count+=1;
        Quaternion prev = z;
        z = complexFunc(z,c);
        Quaternion diff = Qsubtract(z,prev);
        if (Qlength(diff) > 500.){
            float iterationCoefficient = float(count * count)/float(iterationLimit);
            return iterationCoefficient * vec3(0.0, 0.7647, 1.0);
        }   
    }
    return vec3(0);
}

float mandelbrot(Quaternion c){
    const int iterationLimit = 100;
    int count = 0;
    Quaternion z = newQuaternion();
    // z.r=0.5;
    for (int i = 0; i < iterationLimit; i ++){
        count+=1;
        z = complexFunc(z,c);
        if (Qlength(z) > 50.){
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
    float w = 0.05;
    float d = 4.;
    vec3 pos = vec3(d * sin(u_time * w),d * sin(u_time * w),-d * cos(u_time * w)); 
    vec3 rd = normalize(vec3(uv.xy,1.));
    rd.xz *= rotate2D(360./6.28 * u_time * w);

    vec3 prevPos = pos;

    const int iterationLimit = 350;
    vec3 boxSize = vec3(1.5);
    float step = 0.1;
    float dist = 0.;
    float densityIntegration = 0.;
    vec3 densityVec = vec3(0);
    bool entered = false;

    //ray march to cloud cube boundary
    for (int i = 0; i < 200; i ++){
        vec3 origin = pos;
        step = boxSDF(pos,boxSize);
        pos += rd * step;

        if (step < 0.01){
            entered = true;
            step = 0.05;
        }
        
        if (length(pos-origin)>100. || (boxSDF(pos,boxSize) < 0.)){
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

        if (length(pos)>100.){
            //exceeds ray length
            break;
        }

        if (entered == true){
            float displacement = length(pos - prevPos);
            dist += displacement;
            float pointDensity = mandelbrot(VecToQuaternion(mandelbrotRepition(pos,boxSize)));

            densityIntegration += displacement * pointDensity;
            densityVec += length(pos-prevPos) * mandelbrotVec(VecToQuaternion(mandelbrotRepition(pos,boxSize)));

            step += pointDensity;
        }

        if (entered == true && boxSDF(pos,boxSize) > 0.){
            //after leaving the box

            //different rendering options
            
            // return vec3(densityIntegration);
            // return vec3(BeersLaw(densityIntegration, 0.8));
            
            // return densityVec;
            return densityVec/2. * (BeersLaw(densityIntegration,0.8));
        }
    }
    return vec3(0);
}

void main(){
    vec2 uv = vec2(2.0 * gl_FragCoord.xy / u_resolution - 1.);   
    vec3 color = render(uv);
    gl_FragColor = vec4(color,1.);
}