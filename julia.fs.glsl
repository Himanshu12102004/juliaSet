#version 300 es
precision highp float;
uniform float maxI;
uniform float minI;
uniform float minR;
uniform float maxR;
uniform vec3 setColor;
uniform vec3 backGroundColor;

uniform vec2 c;
uniform vec2 viewportDimensions;
out vec4 vertexColor;

void main() {
    float escapeRadius = 1000.0;
    const int iterations = 1000;
    vec2 z = vec2(
        gl_FragCoord.x * (maxR - minR) / viewportDimensions.x + minR,
        gl_FragCoord.y * (maxI - minI) / viewportDimensions.y + minI
    );

    int i;
    for (i = 0; i < iterations; i++) {
        float xSquared = z.x * z.x;
        float ySquared = z.y * z.y;
        if (xSquared + ySquared > escapeRadius) {
            break;
        } else {
            float tempX = xSquared - ySquared + c.x;
            z.y = 2.0 * z.x * z.y + c.y;
            z.x = tempX;
        }
    }

    float stability = float(i) / float(iterations);

    vec3 color = vec3(stability);
    vertexColor = vec4(stability*setColor.x,stability*setColor.y,stability*setColor.z, 1.0);
if(stability<0.01&&stability>0.0)
    vertexColor = vec4(backGroundColor.x,backGroundColor.y,backGroundColor.z, 1.0);

}
