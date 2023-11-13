"use strict";
var canvas, gl;

let lastPosition = { x: innerWidth / 2, y: innerHeight / 2 };
let lastDistance = 0;
let zoomGui;
let lastZoom;
let minZoomAllowed = 8;
let maxZoomAllowed = 0.0000465;
let minZoom = 0;
let maxZoom = 1000;
function loadShaderAsync(shaderURL, callback) {
  let req = new XMLHttpRequest();
  req.open("GET", shaderURL, true);
  req.onload = function () {
    if (req.status < 200 || req.status > 300) callback("could not load shader");
    else callback(null, req.responseText);
  };
  req.send();
}
function init() {
  if ("ontouchstart" in window) {
    console.log("h");
  }
  async.map(
    {
      vsText: "./julia.vs.glsl",
      fsText: "./julia.fs.glsl",
    },
    loadShaderAsync,
    main
  );
}
function main(loadErrors, text) {
  canvas = document.querySelector("canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("This browser doesn't support webGL");
    return;
  }
  addEvent(window, "resize", onResize);
  addEvent(canvas, "wheel", onZoom);
  addEvent(canvas, "mousemove", onMousemove);

  addEventListener("touchstart", (e) => {
    lastPosition.x = e.touches[0].clientX;
    lastPosition.y = e.touches[0].clientY;
    console.log(e.touches[0].clientX, e.touches[0].clientY);
  });
  addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;

      e.movementX = x - lastPosition.x;
      e.movementY = y - lastPosition.y;
      lastPosition.x = x;
      lastPosition.y = y;
      onMousemove(e);
    }
  });
  const vretexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vretexShader, text[0]);
  gl.compileShader(vretexShader);
  if (!gl.getShaderParameter(vretexShader, gl.COMPILE_STATUS)) {
    const compileError = gl.getShaderInfoLog(vretexShader);
    console.error(compileError);
  }
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, text[1]);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(fragmentShader);
    console.error(err);
  }
  const juliaProgram = gl.createProgram();
  gl.attachShader(juliaProgram, fragmentShader);
  gl.attachShader(juliaProgram, vretexShader);
  gl.linkProgram(juliaProgram);
  if (!gl.getProgramParameter(juliaProgram, gl.LINK_STATUS)) {
    const err = gl.getProgramInfoLog(juliaProgram);
    console.error(err);
  }
  gl.useProgram(juliaProgram);
  const uniforms = {
    viewportDimensions: gl.getUniformLocation(
      juliaProgram,
      "viewportDimensions"
    ),
    minI: gl.getUniformLocation(juliaProgram, "minI"),
    maxI: gl.getUniformLocation(juliaProgram, "maxI"),
    minR: gl.getUniformLocation(juliaProgram, "minR"),
    maxR: gl.getUniformLocation(juliaProgram, "maxR"),
    c: gl.getUniformLocation(juliaProgram, "c"),
    setColor: gl.getUniformLocation(juliaProgram, "setColor"),
    backGroundColor: gl.getUniformLocation(juliaProgram, "backGroundColor"),
  };
  if (
    uniforms.maxI == null ||
    uniforms.minI == null ||
    uniforms.minR == null ||
    uniforms.maxR == null ||
    uniforms.viewportDimensions == null ||
    uniforms.c == null ||
    uniforms.setColor === null ||
    uniforms.backGroundColor === null
  ) {
    console.error("uniforms not found", uniforms);
  }
  let viewportDimensions = [innerWidth, innerHeight];
  let minI = -1.5;
  let maxI = +1.5;
  let minR = -1.5;
  let maxR = +1.5;
  let vertexBuffer = gl.createBuffer();
  let vertices = [-1, 1, -1, -1, 1, -1, -1, 1, 1, 1, 1, -1];
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  let vertexPosition = gl.getAttribLocation(juliaProgram, "vertexPosition");
  gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPosition);

  let thisFrameTime;
  let lastFrameTime = performance.now();
  let dt;
  let lastPrintTime = performance.now();
  let frames = [];
  let loop = () => {
    thisFrameTime = performance.now();
    dt = thisFrameTime - lastFrameTime;
    frames.push(dt);
    if (lastPrintTime + 750 < thisFrameTime) {
      lastPrintTime = thisFrameTime;
      let avg = 0;
      for (let i = 0; i < frames.length; i++) {
        avg += frames[i];
      }
      avg /= frames.length;
      // document.title = (1000 / avg).toFixed(0) + " fps";
    }
    lastFrameTime = thisFrameTime;
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.uniform2fv(uniforms.viewportDimensions, viewportDimensions);
    gl.uniform1f(uniforms.minI, minI);
    gl.uniform1f(uniforms.maxI, maxI);
    gl.uniform1f(uniforms.minR, minR);
    gl.uniform1f(uniforms.maxR, maxR);
    gl.uniform2fv(uniforms.c, [c.x, c.y]);
    gl.uniform3fv(uniforms.setColor, [
      setColor.r / 255,
      setColor.g / 255,
      setColor.b / 255,
    ]);
    gl.uniform3fv(uniforms.backGroundColor, [
      backGroundColor.r / 255,
      backGroundColor.g / 255,
      backGroundColor.b / 255,
    ]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(loop);
  };

  function onResize() {
    if (!canvas) {
      return;
    }
    console.log("hello");
    canvas.height = innerHeight;
    canvas.width = innerWidth;
    gl.viewport(0, 0, innerWidth, innerHeight);
    var oldRealRange = maxR - minR;

    maxR = ((maxI - minI) * canvas.width) / canvas.height + minR;
    var newRealRange = maxR - minR;

    minR -= (newRealRange - oldRealRange) / 2;
    maxR = ((maxI - minI) * canvas.width) / canvas.height + minR;
    viewportDimensions = [canvas.width, canvas.height];
  }
  function interpolateZoom() {
    return (
      maxZoomAllowed +
      ((zoom.zoomLevel - maxZoom) * (maxZoomAllowed - minZoomAllowed)) /
        (maxZoom - minZoom)
    );
  }
  function onTouchZoom(e) {
    let imaginaryRange = maxI - minI;
    let newRange;
    let idealRange = 6;
    newRange = interpolateZoom();
    console.log(interpolateZoom());
    var delta = newRange - imaginaryRange;

    minI -= delta / 2;
    maxI = minI + newRange;

    onResize();
  }
  function onZoom(e) {
    let imaginaryRange = maxI - minI;
    let newRange;
    if (e.deltaY < 0) {
      newRange = imaginaryRange * 0.95;
    } else {
      newRange = imaginaryRange * 1.05;
    }

    var delta = newRange - imaginaryRange;

    minI -= delta / 2;
    maxI = minI + newRange;

    onResize();
    console.log(maxI - minI);
  }
  let c = { x: -0.544, y: 0.5587 };
  let zoom = { zoomLevel: 750 };
  let setColor = { r: 255, g: 255, b: 255 };
  let backGroundColor = { r: 255 * 0.05, g: 255 * 0.5, b: 255 * 0.5 };
  console.log(dat.gui);
  const gui = new dat.GUI();
  const cFolder = gui.addFolder("Constant");

  cFolder.add(c, "x", -5, +5, 0.000001);
  cFolder.add(c, "y", -5, +5, 0.000001);
  const setColorFolder = gui.addFolder("Set Color");
  setColorFolder.add(setColor, "r", 0, 255);
  setColorFolder.add(setColor, "g", 0, 255);
  setColorFolder.add(setColor, "b", 0, 255);
  const backGroundColorFloder = gui.addFolder("Background Color");
  let halfWayZoom = 5;
  lastZoom = halfWayZoom;
  if ("ontouchstart" in window || navigator.maxTouchPoints) {
    zoomGui = gui.add(zoom, "zoomLevel", 0, 1000, 1);
    zoomGui.onChange(() => {
      let e = { deltaY: halfWayZoom - zoom.zoomLevel };
      lastZoom = zoom.zoomLevel;
      onTouchZoom(e);
    });
  }

  backGroundColorFloder.add(backGroundColor, "r", 0, 255);
  backGroundColorFloder.add(backGroundColor, "g", 0, 255);
  backGroundColorFloder.add(backGroundColor, "b", 0, 255);
  // backGroundColorFloder.open();
  // cFolder.open();
  // setColorFolder.open();
  function onMousemove(e) {
    if (e.buttons === 1 || e.type == "touchmove") {
      var iRange = maxI - minI;
      var rRange = maxR - minR;

      var iDelta = (e.movementY / canvas.clientHeight) * iRange;
      var rDelta = (e.movementX / canvas.clientWidth) * rRange;

      minI += iDelta;
      maxI += iDelta;
      minR -= rDelta;
      maxR -= rDelta;
    }
  }
  onResize();

  loop();
}
function addEvent(object, type, callback) {
  if (object == null || typeof object == "undefined") return;
  if (object.addEventListener) {
    object.addEventListener(type, callback, false);
  } else if (object.attachEvent) {
    object.attachEvent("on" + type, callback);
  } else {
    object["on" + type] = callback;
  }
}
