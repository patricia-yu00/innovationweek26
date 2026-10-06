// Ringed gas planet, ported from Deep-Fold's PixelPlanets (MIT License, Copyright (c) 2020 Deep-Fold).
(() => {
  const vertexSource = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;

  const fragmentSource = `
    precision highp float;
    uniform vec2 resolution;
    uniform float gasTime;
    uniform float ringTime;
    uniform vec3 colors[3];
    uniform vec3 darkColors[3];

    const vec2 lightOrigin = vec2(-0.1, 0.3);

    const float gasSize = 10.107;
    const float gasSeed = 6.314;
    const float ringSize = 15.0;
    const float ringSeed = 8.461;

    float rand(vec2 coord, float size, float seed) {
      coord = mod(coord, vec2(2.0, 1.0) * floor(size + 0.5));
      return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 15.5453 * seed);
    }

    float noise(vec2 coord, float size, float seed) {
      vec2 i = floor(coord);
      vec2 f = fract(coord);
      float a = rand(i, size, seed);
      float b = rand(i + vec2(1.0, 0.0), size, seed);
      float c = rand(i + vec2(0.0, 1.0), size, seed);
      float d = rand(i + vec2(1.0, 1.0), size, seed);
      vec2 cubic = f * f * (3.0 - 2.0 * f);
      return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
    }

    float fbm(vec2 coord, int octaves, float size, float seed) {
      float value = 0.0;
      float scale = 0.5;
      for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += noise(coord, size, seed) * scale;
        coord *= 2.0;
        scale *= 0.5;
      }
      return value;
    }

    float circleNoise(vec2 uv) {
      float uvY = floor(uv.y);
      uv.x += uvY * 0.31;
      vec2 f = fract(uv);
      float h = rand(vec2(floor(uv.x), floor(uvY)), gasSize, gasSeed);
      float m = length(f - 0.25 - (h * 0.5));
      float r = h * 0.25;
      return smoothstep(0.0, r, m * 0.75);
    }

    float turbulence(vec2 uv) {
      float c = 0.0;
      for (int i = 0; i < 10; i++) {
        c += circleNoise((uv * gasSize * 0.3) + (float(i + 1) + 10.0) + vec2(gasTime * 0.05, 0.0));
      }
      return c;
    }

    vec2 spherify(vec2 uv) {
      vec2 centered = uv * 2.0 - 1.0;
      float z = sqrt(1.0 - dot(centered, centered));
      return centered / (z + 1.0) * 0.5 + 0.5;
    }

    vec2 rotate(vec2 coord, float angle) {
      coord -= 0.5;
      coord *= mat2(vec2(cos(angle), -sin(angle)), vec2(sin(angle), cos(angle)));
      return coord + 0.5;
    }

    vec3 pick(float index, bool dark) {
      vec3 c0 = dark ? darkColors[0] : colors[0];
      vec3 c1 = dark ? darkColors[1] : colors[1];
      vec3 c2 = dark ? darkColors[2] : colors[2];
      if (index < 0.5) return c0;
      if (index < 1.5) return c1;
      return c2;
    }

    vec4 gasPlanet(vec2 rawUV) {
      float pixels = 100.0;
      vec2 uv = floor(rawUV * pixels) / pixels;
      float lightD = distance(uv, lightOrigin);
      bool dith = mod(uv.x + rawUV.y, 2.0 / pixels) <= 1.0 / pixels;
      float a = step(length(uv - vec2(0.5)), 0.49999);
      if (a < 0.5) return vec4(0.0);
      uv = spherify(uv);
      float band = fbm(vec2(0.0, uv.y * gasSize * 0.892), 3, gasSize, gasSeed);
      float turb = turbulence(uv);
      float fbm1 = fbm(uv * gasSize, 3, gasSize, gasSeed);
      float fbm2 = fbm(uv * vec2(1.0, 2.0) * gasSize + fbm1 + vec2(-gasTime * 0.05, 0.0) + turb, 3, gasSize, gasSeed);
      fbm2 *= pow(band, 2.0) * 7.0;
      float light = fbm2 + lightD * 1.8;
      fbm2 += lightD - 0.3;
      fbm2 = smoothstep(-0.2, 4.0 - fbm2, light);
      if (dith) fbm2 *= 1.1;
      float posterized = floor(fbm2 * 4.0) / 2.0;
      vec3 col = fbm2 < 0.625 ? pick(posterized * 2.0, false) : pick((posterized - 1.0) * 2.0, true);
      return vec4(col, 1.0);
    }

    vec4 ring(vec2 rawUV) {
      float pixels = 300.0;
      vec2 uv = floor(rawUV * pixels) / pixels;
      float lightD = distance(uv, lightOrigin);
      uv = rotate(uv, 0.7);
      vec2 uvCenter = uv - vec2(0.0, 0.5);
      uvCenter *= vec2(1.0, 6.0);
      float centerD = distance(uvCenter, vec2(0.5, 0.0));
      float ringWidth = 0.127;
      float r = smoothstep(0.5 - ringWidth * 2.0, 0.5 - ringWidth, centerD);
      r *= smoothstep(centerD - ringWidth, centerD, 0.4);
      if (uv.y < 0.5) r *= step(1.0 / 6.0, distance(uv, vec2(0.5)));
      uvCenter = rotate(uvCenter + vec2(0.0, 0.5), ringTime * 0.2);
      r *= fbm(uvCenter * ringSize, 4, ringSize, ringSeed);
      float posterized = min(floor((r + pow(lightD, 2.0) * 2.0) * 4.0) / 4.0, 2.0);
      vec3 col = posterized <= 1.0 ? pick(posterized * 2.0, false) : pick((posterized - 1.0) * 2.0, true);
      return vec4(col, step(0.28, r));
    }

    void main() {
      vec2 uv = vec2(gl_FragCoord.x / resolution.x, 1.0 - gl_FragCoord.y / resolution.y);
      vec4 ringColor = ring(uv);
      if (ringColor.a > 0.5) { gl_FragColor = ringColor; return; }
      vec2 planetUV = (uv - 1.0 / 3.0) * 3.0;
      if (planetUV.x < 0.0 || planetUV.y < 0.0 || planetUV.x > 1.0 || planetUV.y > 1.0) { gl_FragColor = vec4(0.0); return; }
      gl_FragColor = gasPlanet(planetUV);
    }
  `;

  const hex = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const palette = {
    colors: ["#ffe2b8", "#ff9a5c", "#ff4f8b"].flatMap(hex),
    darkColors: ["#b23aa6", "#5a2f9c", "#1a1440"].flatMap(hex),
  };

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  const SIZE = 300;
  let glState = null;

  function createGl() {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true, preserveDrawingBuffer: true }) ||
      canvas.getContext("experimental-webgl", { premultipliedAlpha: false, alpha: true, preserveDrawingBuffer: true });
    if (!gl) return null;
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(gl.getUniformLocation(program, "colors"), palette.colors);
    gl.uniform3fv(gl.getUniformLocation(program, "darkColors"), palette.darkColors);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      glState = null;
    });
    return {
      canvas,
      gl,
      uniforms: {
        resolution: gl.getUniformLocation(program, "resolution"),
        gasTime: gl.getUniformLocation(program, "gasTime"),
        ringTime: gl.getUniformLocation(program, "ringTime"),
      },
    };
  }

  function renderPlanet(t) {
    if (!glState || glState.gl.isContextLost()) glState = createGl();
    if (!glState) return null;
    const { gl, uniforms, canvas } = glState;
    gl.viewport(0, 0, SIZE, SIZE);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uniforms.resolution, SIZE, SIZE);
    gl.uniform1f(uniforms.gasTime, t * 400 * 0.004);
    gl.uniform1f(uniforms.ringTime, t * 314.15 * 0.004);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return canvas;
  }

  // One shared WebGL context, copied into each visible 2D canvas.
  const active = new Map();
  let frame = 0;
  const loop = (now) => {
    frame = 0;
    if (!active.size) return;
    const source = renderPlanet(1000 + (now - startedAt) / 1000);
    for (const [canvas, ctx] of active) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (source) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      }
    }
    frame = requestAnimationFrame(loop);
  };
  const startedAt = performance.now();

  window.PixelPlanet = {
    start(canvas) {
      if (!canvas) return false;
      let ctx = canvas.getContext("2d");
      if (!ctx && canvas.parentNode) {
        // Canvas already holds another context type; swap in a fresh element with the same id/classes.
        const fresh = canvas.cloneNode(false);
        canvas.replaceWith(fresh);
        canvas = fresh;
        ctx = canvas.getContext("2d");
      }
      if (!ctx) return false;
      for (const existing of active.keys()) if (existing.id && existing.id === canvas.id) active.delete(existing);
      active.set(canvas, ctx);
      if (!frame) loop(performance.now());
      return Boolean(glState);
    },
    stop(canvas) {
      if (!canvas) return;
      for (const existing of active.keys()) if (existing === canvas || (canvas.id && existing.id === canvas.id)) active.delete(existing);
      if (!active.size && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
  };
})();
