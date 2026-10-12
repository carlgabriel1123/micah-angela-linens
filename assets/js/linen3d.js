/*
  Linen sheet (WebGL2)
  A real-looking white linen sheet hanging from a rod: 3D Verlet cloth with
  wind that pushes against the fabric, soft lighting, a fine woven texture,
  a stitched hem and a thin woven stripe. Visitors can brush it with the
  pointer or grab and pull it. Returns null when WebGL2 is unavailable so the
  caller can fall back to the flat thread version.
*/

const STEP = 1 / 60;
const COLS = 34;
const ROWS = 40;
const SHEET_W = 2.0;
const SPACING = SHEET_W / COLS;
const ROD_Y = 1.2;
const FOV = (32 * Math.PI) / 180;
const YAW = -0.34;
const PITCH = 0.05;

const VERT = `#version 300 es
precision highp float;
in vec3 aPos;
in vec3 aNormal;
in vec2 aUV;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
out vec3 vN;
out vec3 vW;
out vec2 vUV;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vW = w.xyz;
  vN = mat3(uModel) * aNormal;
  vUV = aUV;
  gl_Position = uProj * uView * w;
}`;

const FRAG = `#version 300 es
precision highp float;
in vec3 vN;
in vec3 vW;
in vec2 vUV;
uniform vec3 uCam;
uniform int uMode;
uniform vec3 uColor;
uniform vec3 uStripe;
out vec4 outColor;

float hash(float n) { return fract(sin(n) * 43758.5453); }

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(uCam - vW);
  bool back = !gl_FrontFacing;
  if (back) N = -N;

  vec3 L = normalize(vec3(-0.45, 0.75, 0.62));
  vec3 L2 = normalize(vec3(0.75, 0.05, 0.55));
  float wrap = clamp((dot(N, L) + 0.42) / 1.42, 0.0, 1.0);
  wrap = wrap * wrap * (3.0 - 2.0 * wrap);
  float fill = max(dot(N, L2), 0.0);
  vec3 H = normalize(L + V);

  if (uMode == 1) {
    vec3 c = uColor * (0.5 + 0.5 * wrap) + pow(max(dot(N, H), 0.0), 40.0) * 0.35;
    outColor = vec4(c, 1.0);
    return;
  }

  // Linen weave: crossing threads plus uneven slubs, faded out before it can shimmer.
  vec2 w = vUV * vec2(260.0, 300.0);
  vec2 fw = fwidth(w);
  float aa = 1.0 - smoothstep(0.3, 0.75, max(fw.x, fw.y));
  float warp = 0.5 + 0.5 * sin(w.x * 6.2831853);
  float weft = 0.5 + 0.5 * sin(w.y * 6.2831853);
  float tex = 1.0 - aa * 0.022 * (1.0 - warp * weft);

  vec3 lit = vec3(0.985, 0.984, 0.978);
  vec3 dark = vec3(0.63, 0.67, 0.77);
  vec3 col = mix(dark, lit, wrap);
  col += fill * 0.05 * vec3(0.82, 0.88, 1.0);
  col += pow(max(dot(N, H), 0.0), 16.0) * 0.05;

  float u = vUV.x;
  float v = vUV.y;
  float fv = fwidth(v);
  float fu = fwidth(u);

  // Hems are a double layer, so a touch darker, with a stitch line.
  float hem = max(step(0.952, v), max(step(u, 0.014), step(0.986, u)));
  col *= 1.0 - 0.045 * hem;
  float stitchB = 1.0 - smoothstep(fv * 0.6, fv * 1.6, abs(v - 0.946));
  float stitchS = (1.0 - smoothstep(fu * 0.6, fu * 1.6, abs(u - 0.02))) + (1.0 - smoothstep(fu * 0.6, fu * 1.6, abs(u - 0.98)));
  float dashB = step(0.45, fract(u * 95.0));
  float dashS = step(0.45, fract(v * 110.0));
  col *= 1.0 - 0.16 * (stitchB * dashB + min(stitchS, 1.0) * dashS * step(v, 0.946));

  // Thin woven stripe near the hem, like hotel and hospital sheets.
  float s1 = 1.0 - smoothstep(0.0028, 0.0028 + fv, abs(v - 0.9));
  float s2 = 1.0 - smoothstep(0.0011, 0.0011 + fv, abs(v - 0.914));
  vec3 stripe = uStripe * (0.55 + 0.45 * wrap);
  col = mix(col, stripe, max(s1, s2) * 0.9);

  col *= tex;
  if (back) col *= 0.93;
  outColor = vec4(col, 1.0);
}`;

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

// Column-major Ry * Rx
function rotation(yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
  return new Float32Array([
    cy, 0, -sy, 0,
    sy * sx, cx, cy * sx, 0,
    sy * cx, -sx, cy * cx, 0,
    0, 0, 0, 1,
  ]);
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
  return sh;
}

function hex(c) {
  const n = parseInt(c.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ onGrab?: () => void, stripe?: string }} opts
 */
export function initLinen3D(canvas, opts = {}) {
  let gl = null;
  try {
    gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
  } catch (_) {
    gl = null;
  }
  if (!gl) return null;

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
  } catch (err) {
    console.warn('[linen] using flat fallback:', err.message);
    return null;
  }
  gl.useProgram(prog);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const loc = {
    pos: gl.getAttribLocation(prog, 'aPos'),
    nor: gl.getAttribLocation(prog, 'aNormal'),
    uv: gl.getAttribLocation(prog, 'aUV'),
  };
  const u = {};
  ['uProj', 'uView', 'uModel', 'uCam', 'uMode', 'uColor', 'uStripe'].forEach((n) => { u[n] = gl.getUniformLocation(prog, n); });

  /* ---------- Cloth state ---------- */
  const NX = COLS + 1;
  const NY = ROWS + 1;
  const N = NX * NY;
  const P = new Float32Array(N * 3);
  const Q = new Float32Array(N * 3); // previous positions
  const NRM = new Float32Array(N * 3);
  const UV = new Float32Array(N * 2);
  const pinned = new Uint8Array(N);
  const pinX = new Float32Array(N);
  const idx = (i, j) => j * NX + i;

  const conA = [];
  const conB = [];
  const conR = [];
  const conK = [];
  const addCon = (a, b, k) => {
    const dx = P[b * 3] - P[a * 3], dy = P[b * 3 + 1] - P[a * 3 + 1], dz = P[b * 3 + 2] - P[a * 3 + 2];
    conA.push(a); conB.push(b); conR.push(Math.hypot(dx, dy, dz)); conK.push(k);
  };

  let rodY = reduce.matches ? ROD_Y : ROD_Y + 3.6;
  let dropT = reduce.matches ? 1 : 0;

  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const n = idx(i, j);
      const x = -SHEET_W / 2 + i * SPACING;
      const y = rodY - j * SPACING;
      P[n * 3] = Q[n * 3] = x;
      P[n * 3 + 1] = Q[n * 3 + 1] = y;
      P[n * 3 + 2] = Q[n * 3 + 2] = 0;
      UV[n * 2] = i / COLS;
      UV[n * 2 + 1] = j / ROWS;
      if (j === 0 && (i % 3 === 0 || i === COLS)) {
        pinned[n] = 1;
        pinX[n] = x;
      }
    }
  }
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const n = idx(i, j);
      if (i < COLS) addCon(n, idx(i + 1, j), 1);
      if (j < ROWS) addCon(n, idx(i, j + 1), 1);
      if (i < COLS && j < ROWS) {
        addCon(n, idx(i + 1, j + 1), 0.6);
        addCon(idx(i + 1, j), idx(i, j + 1), 0.6);
      }
      if (i < COLS - 1) addCon(n, idx(i + 2, j), 0.35);
      if (j < ROWS - 1) addCon(n, idx(i, j + 2), 0.35);
    }
  }
  const CA = Int32Array.from(conA);
  const CB = Int32Array.from(conB);
  const CR = Float32Array.from(conR);
  const CK = Float32Array.from(conK);

  const indices = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = idx(i, j), b = idx(i + 1, j), c = idx(i, j + 1), d = idx(i + 1, j + 1);
      indices.push(a, c, b, b, c, d);
    }
  }

  /* ---------- Rod and clips (static meshes, moved by uniform) ---------- */
  function cylinder(x0, x1, r, seg) {
    const pos = [], nor = [], ind = [];
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      const cy = Math.cos(a), sz = Math.sin(a);
      pos.push(x0, cy * r, sz * r, x1, cy * r, sz * r);
      nor.push(0, cy, sz, 0, cy, sz);
    }
    for (let s = 0; s < seg; s++) {
      const k = s * 2;
      ind.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    return { pos, nor, ind };
  }
  function box(cx, cy, cz, hx, hy, hz, out) {
    const base = out.pos.length / 3;
    const faces = [
      [[1, 0, 0], [[hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [hx, -hy, hz]]],
      [[-1, 0, 0], [[-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-hx, -hy, -hz]]],
      [[0, 1, 0], [[-hx, hy, -hz], [-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz]]],
      [[0, -1, 0], [[-hx, -hy, hz], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz]]],
      [[0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]]],
      [[0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]]],
    ];
    faces.forEach(([n, vs], f) => {
      vs.forEach((v) => { out.pos.push(cx + v[0], cy + v[1], cz + v[2]); out.nor.push(...n); });
      const k = base + f * 4;
      out.ind.push(k, k + 1, k + 2, k, k + 2, k + 3);
    });
  }
  const rod = cylinder(-SHEET_W / 2 - 0.16, SHEET_W / 2 + 0.16, 0.022, 14);
  const clips = { pos: [], nor: [], ind: [] };
  for (let i = 0; i <= COLS; i++) {
    if (i % 3 === 0 || i === COLS) box(-SHEET_W / 2 + i * SPACING, -0.02, 0, 0.018, 0.05, 0.03, clips);
  }

  function staticMesh(m) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const pb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.pos), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc.pos);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 0, 0);
    const nb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.nor), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc.nor);
    gl.vertexAttribPointer(loc.nor, 3, gl.FLOAT, false, 0, 0);
    if (loc.uv >= 0) gl.disableVertexAttribArray(loc.uv);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(m.ind), gl.STATIC_DRAW);
    return { vao, count: m.ind.length };
  }

  const clothVao = gl.createVertexArray();
  gl.bindVertexArray(clothVao);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, P.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc.pos);
  gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 0, 0);
  const norBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, norBuf);
  gl.bufferData(gl.ARRAY_BUFFER, NRM.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc.nor);
  gl.vertexAttribPointer(loc.nor, 3, gl.FLOAT, false, 0, 0);
  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, UV, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc.uv);
  gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, 0, 0);
  const clothIb = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, clothIb);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  const rodMesh = staticMesh(rod);
  const clipMesh = staticMesh(clips);
  gl.bindVertexArray(null);

  const model = rotation(YAW, PITCH);
  gl.uniformMatrix4fv(u.uModel, false, model);
  gl.uniform3fv(u.uStripe, hex(opts.stripe || '#5B7BEA'));
  gl.enable(gl.DEPTH_TEST);

  /* ---------- Camera ---------- */
  const cam = { D: 6, y: -0.05, aspect: 1, w: 1, h: 1, tan: Math.tan(FOV / 2) };
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    canvas.width = w;
    canvas.height = h;
    cam.w = r.width;
    cam.h = r.height;
    cam.aspect = r.width / Math.max(1, r.height);
    const needH = Math.max(3.25, 2.75 / cam.aspect);
    cam.D = needH / (2 * cam.tan);
    gl.viewport(0, 0, w, h);
    gl.uniformMatrix4fv(u.uProj, false, perspective(FOV, cam.aspect, 0.1, 50));
    gl.uniformMatrix4fv(u.uView, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -cam.y, -cam.D, 1]));
    gl.uniform3f(u.uCam, 0, cam.y, cam.D);
  }

  // local -> world (rotation only)
  const toWorld = (x, y, z) => [
    model[0] * x + model[4] * y + model[8] * z,
    model[1] * x + model[5] * y + model[9] * z,
    model[2] * x + model[6] * y + model[10] * z,
  ];
  // world -> local (transpose)
  const toLocal = (x, y, z) => [
    model[0] * x + model[1] * y + model[2] * z,
    model[4] * x + model[5] * y + model[6] * z,
    model[8] * x + model[9] * y + model[10] * z,
  ];
  function rayDir(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = 1 - ((clientY - r.top) / r.height) * 2;
    return [nx * cam.tan * cam.aspect, ny * cam.tan, -1];
  }
  function screenOf(n) {
    const [wx, wy, wz] = toWorld(P[n * 3], P[n * 3 + 1], P[n * 3 + 2]);
    const vz = wz - cam.D;
    const vy = wy - cam.y;
    const sx = (wx / (-vz * cam.tan * cam.aspect) + 1) / 2 * cam.w;
    const sy = (1 - vy / (-vz * cam.tan)) / 2 * cam.h;
    return [sx, sy, wz];
  }

  /* ---------- Pointer ---------- */
  const ptr = { local: null, vel: [0, 0], t: 0, grab: -1, grabZ: 0, id: null, target: null };

  function pointerLocalOnSheet(e) {
    const d = rayDir(e.clientX, e.clientY);
    const nW = toWorld(0, 0, 1);
    const O = [0, cam.y, cam.D];
    const denom = nW[0] * d[0] + nW[1] * d[1] + nW[2] * d[2];
    if (Math.abs(denom) < 1e-5) return null;
    const t = -(nW[0] * O[0] + nW[1] * O[1] + nW[2] * O[2]) / denom;
    return toLocal(O[0] + d[0] * t, O[1] + d[1] * t, O[2] + d[2] * t);
  }

  function onMove(e) {
    const now = performance.now();
    if (ptr.grab >= 0) {
      const d = rayDir(e.clientX, e.clientY);
      const t = (ptr.grabZ - cam.D) / d[2];
      ptr.target = toLocal(d[0] * t, cam.y + d[1] * t, cam.D + d[2] * t);
      return;
    }
    const lp = pointerLocalOnSheet(e);
    if (!lp) return;
    if (ptr.local) {
      const dt = Math.max(0.008, (now - ptr.t) / 1000);
      ptr.vel = [Math.max(-12, Math.min(12, (lp[0] - ptr.local[0]) / dt)), Math.max(-12, Math.min(12, (lp[1] - ptr.local[1]) / dt))];
    }
    ptr.local = lp;
    ptr.t = now;
  }

  function onDown(e) {
    if (reduce.matches) return;
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = -1;
    let bestD = (coarse.matches ? 44 : 30) ** 2;
    for (let n = 0; n < N; n++) {
      if (pinned[n]) continue;
      const [sx, sy] = screenOf(n);
      const d = (sx - mx) ** 2 + (sy - my) ** 2;
      if (d < bestD) { bestD = d; best = n; }
    }
    if (best < 0) return;
    ptr.grab = best;
    ptr.grabZ = screenOf(best)[2];
    ptr.id = e.pointerId;
    ptr.target = [P[best * 3], P[best * 3 + 1], P[best * 3 + 2]];
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-grabbing');
    opts.onGrab && opts.onGrab();
  }

  function onUp(e) {
    if (ptr.id !== null && e.pointerId === ptr.id) {
      ptr.grab = -1;
      ptr.id = null;
      ptr.target = null;
      canvas.classList.remove('is-grabbing');
    }
  }

  function onLeave() {
    if (ptr.grab < 0) {
      ptr.local = null;
      ptr.vel = [0, 0];
    }
  }

  /* ---------- Physics ---------- */
  let time = 0;

  function normals() {
    NRM.fill(0);
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const n = idx(i, j);
        const l = idx(Math.max(0, i - 1), j), r = idx(Math.min(COLS, i + 1), j);
        const t = idx(i, Math.max(0, j - 1)), b = idx(i, Math.min(ROWS, j + 1));
        const ax = P[r * 3] - P[l * 3], ay = P[r * 3 + 1] - P[l * 3 + 1], az = P[r * 3 + 2] - P[l * 3 + 2];
        const bx = P[t * 3] - P[b * 3], by = P[t * 3 + 1] - P[b * 3 + 1], bz = P[t * 3 + 2] - P[b * 3 + 2];
        let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
        const len = Math.hypot(nx, ny, nz) || 1;
        NRM[n * 3] = nx / len;
        NRM[n * 3 + 1] = ny / len;
        NRM[n * 3 + 2] = nz / len;
      }
    }
  }

  function step(dt, windOn) {
    time += dt;
    if (dropT < 1) {
      dropT = Math.min(1, dropT + dt / 1.6);
      const e = 1 - Math.pow(1 - dropT, 3);
      rodY = ROD_Y + 3.6 * (1 - e);
    } else {
      rodY = ROD_Y;
    }

    const g = -9.8;
    const damp = 0.985;
    const gust = windOn ? (1.1 + 0.5 * Math.sin(time * 0.37) + 0.25 * Math.sin(time * 1.13)) : 0;
    const wx = windOn ? 0.3 * Math.sin(time * 0.29) : 0;
    const R = 0.42;
    const R2 = R * R;
    const pushing = ptr.local && ptr.grab < 0;

    for (let n = 0; n < N; n++) {
      if (pinned[n]) continue;
      const k = n * 3;
      const x = P[k], y = P[k + 1], z = P[k + 2];
      const vx = (x - Q[k]) * damp, vy = (y - Q[k + 1]) * damp, vz = (z - Q[k + 2]) * damp;
      Q[k] = x; Q[k + 1] = y; Q[k + 2] = z;

      let ax = 0, ay = g, az = 0;
      if (windOn) {
        // Wind pushes on the fabric along its normal, so it billows like real cloth.
        // A traveling wave across the sheet, so ripples roll through it.
        const wz = gust * (0.55 + 0.62 * Math.sin(2.6 * x - 2.1 * time + 1.4 * y) + 0.28 * Math.sin(1.3 * x + 1.5 * time - 2.2 * y));
        const nx = NRM[k], ny = NRM[k + 1], nz = NRM[k + 2];
        const dot = nx * wx + nz * wz;
        ax += nx * dot * 3.2;
        ay += ny * dot * 3.2;
        az += nz * dot * 3.2;
      }
      if (pushing) {
        const dx = x - ptr.local[0], dy = y - ptr.local[1];
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const f = 1 - d2 / R2;
          const speed = Math.hypot(ptr.vel[0], ptr.vel[1]);
          az -= f * (2.5 + speed * 5.5);
          ax += ptr.vel[0] * f * 2.2;
          ay += ptr.vel[1] * f * 2.2;
        }
      }
      P[k] = x + vx + ax * dt * dt;
      P[k + 1] = y + vy + ay * dt * dt;
      P[k + 2] = z + vz + az * dt * dt;
    }

    for (let it = 0; it < 8; it++) {
      for (let c = 0; c < CA.length; c++) {
        const a = CA[c] * 3, b = CB[c] * 3;
        const dx = P[b] - P[a], dy = P[b + 1] - P[a + 1], dz = P[b + 2] - P[a + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const diff = ((d - CR[c]) / d) * CK[c];
        const pa = pinned[CA[c]], pb = pinned[CB[c]];
        if (pa && pb) continue;
        if (pa) { P[b] -= dx * diff; P[b + 1] -= dy * diff; P[b + 2] -= dz * diff; }
        else if (pb) { P[a] += dx * diff; P[a + 1] += dy * diff; P[a + 2] += dz * diff; }
        else {
          const h = diff * 0.5;
          P[a] += dx * h; P[a + 1] += dy * h; P[a + 2] += dz * h;
          P[b] -= dx * h; P[b + 1] -= dy * h; P[b + 2] -= dz * h;
        }
      }
      if (ptr.grab >= 0 && ptr.target) {
        const k = ptr.grab * 3;
        P[k] = ptr.target[0]; P[k + 1] = ptr.target[1]; P[k + 2] = ptr.target[2];
      }
      for (let n = 0; n < N; n++) {
        if (!pinned[n]) continue;
        P[n * 3] = pinX[n];
        P[n * 3 + 1] = rodY;
        P[n * 3 + 2] = 0;
      }
    }
    normals();
    ptr.vel[0] *= 0.9;
    ptr.vel[1] *= 0.9;
  }

  /* ---------- Draw ---------- */
  const ROD_COLOR = hex('#E9ECF2');
  function draw() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindVertexArray(clothVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, P);
    gl.bindBuffer(gl.ARRAY_BUFFER, norBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, NRM);
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform1i(u.uMode, 0);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    // Rod and clips ride on the rod height.
    const m = model.slice();
    const off = toWorld(0, rodY, 0);
    m[12] = off[0]; m[13] = off[1]; m[14] = off[2];
    gl.uniformMatrix4fv(u.uModel, false, m);
    gl.uniform1i(u.uMode, 1);
    gl.uniform3fv(u.uColor, ROD_COLOR);
    gl.bindVertexArray(rodMesh.vao);
    gl.drawElements(gl.TRIANGLES, rodMesh.count, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(clipMesh.vao);
    gl.drawElements(gl.TRIANGLES, clipMesh.count, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  /* ---------- Loop ---------- */
  let raf = 0, last = 0, acc = 0, running = false, visible = true;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || STEP);
    last = now;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 3) {
      step(STEP, true);
      acc -= STEP;
      n++;
    }
    if (n === 3) acc = 0;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduce.matches || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  normals();
  if (reduce.matches) {
    for (let k = 0; k < 240; k++) step(STEP, k > 120);
    draw();
  }

  const ro = new ResizeObserver(() => {
    resize();
    if (!running) draw();
  });
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); });

  start();
  return { destroy() { stop(); ro.disconnect(); io.disconnect(); } };
}
