# Explanation

## Quaternions
The Mandelbrot set is a fractal formed from finding stable points in the recursive expression Z<sub>n+1</sub> = Z<sub>n</sub><sup>2</sup> + c, where c represents a number in the complex plane. 
The purpose of this project was to attempt to render a version of the Mandelbrot set in higher dimensions with a different approach than the Mandelbulb. This is done with the use of quaternions for the value of c, rather than complex numbers
This is because quaterions have 4 components rather than the 2 that complex numbers have, and have multiplication rules that may allow them to mimic the normal Mandelbrot set in 2 dimensions
The components of c are chosen to be nonzero only for the complex components. (real world coordinates become the ijk axes for quaternions). Trying to make all 4 components nonzero would require a 4 dimensional world space which I was not originally intending

## Ray Marching
Ray marching is a rendering technique occasionaly used in shader animations. A ray is first given a direction based on pixel positions and a ray origin position. The ray detects collisions with the use of a **signed distance function** (SDF)
The SDF returns the distance to an object in the scene from any arbitrary position. The ray iteratively "marches" forward based on the distance returned by the SDF. If the SDF after marching towards an object becomes exceedingly small or becomes 0, then a collision has been detected.
If the SDF only grows and becomes exceedingly large, there is no collision and there must not be an object in that direction. Ray marchers can also calculate normals by finding the derivatives of the SDF with respect to small changes in direction.

Using an SDF of a normal Mandelbrot is possible for complex numbers, but I was not sure how it would transfer to 3 dimensions and quaternions: calculating normals for lighting for a fractal may become exceedingly difficult.

## Beer-Lambert Law and Clouds
Because a solid fractal would make normals difficult to calculate, I decided to render the fractal within a "cloud" instead. According to the Beer-Lambert Law, the amount of light absorbed by a uniformly dense cloud is proportial to the distance 
the light travels through. If the density of a point inside the cloud was equal to the stability of that point inside the Quaternion Mandelbrot set, then a render of the set could be achieved without ever calculating the normals.
(for artistic purposes, the code uses the amount of light that is **transmitted** instead of absorbed for the coloring the fractal.)

The "cloud" is actually just a cube that contains the relevant range of the fractal. Once the ray march collides with the cube, it then begins to march by a specific step size and iteratively calculate the density. 
As previously mentioned, the density at a point in the cloud is the stability of a point when applying the recursive rule (Z<sub>n+1</sub> = Z<sub>n</sub><sup>2</sup> + c) at that point. If that value stays bounded after a given number of iterations, it is said to be stable.
If the value returned becomes exceedingly large, then the stability of that point is related to the number of iterations it took to become exceedingly large and the total normal of iterations allowed. Using these densities, the marcher integrates them together with the Beer-Lambert law.  
(In the code, the expression used is: )

Given all these steps, I achieved was approximate 15-20 FPS.

# Bonus

## Optimization
Once the marcher goes through enough steps, calculating more densities may not add nearly as much to appearance of the fractal. To increase the frame rate while retaining the majority of the appearance, increasing the step size while marching in the cube can reduce the total number of calulcations
and hence improve the framerate. After every step, a small number can be added, which I initially chose to be 0.001. At larger values (1 or greater), the frame rate reach 60 frames per second but looked very different to the original fractal, yet looked visually appealing

## Space repetition
Using a ray marcher allows for a very unique technique called **space repetition**. As the ray marches through space in a direction using the scenes SDF. If the SDF uses the **modulus of the ray position**, then many different directions will repeat whatever is rendered within the range of the modulus.
If the modulus function is edited such that it can contain the fractal cloud, then there can be infinite renders of the fractal. **This should only be done with the previously mentioned optimization at large values**, because the performance will significantly drop.

## Notes
Doing the previous 2 steps leads to significant visual artifacts. They seem to be a result of the step size become large enough to avoid colliding with large portions of the fractal clouds
