#version 300 es
precision highp float;
in vec2 vertexPosition;
void main(){
  gl_Position=vec4(vertexPosition,0.0,1.0);
}