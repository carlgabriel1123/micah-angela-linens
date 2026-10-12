/*
  Thread linen
  A hanging sheet drawn as woven threads (warp and weft), simulated with
  Verlet integration. It drops onto its rod on load, sways in a slow breeze,
  and can be pushed with the pointer or grabbed and pulled. Flat strokes only.
*/

const STEP = 1 / 60;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ colors?: { warp?: string, weft?: string, hem?: string, rod?: string, body?: string }, onGrab?: () => void }} opts
 */
export function initCloth(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const colors = Object.assign({
    warp: 'rgba(255,255,255,0.78)',
    stripe: '#FFFFFF',
    weft: 'rgba(255,255,255,0.3)',
    hem: '#BFE9DC',
    rod: '#FFFFFF',
    body: 'rgba(255,255,255,0.13)',
  }, opts.colors);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');

  let W = 0, H = 0, dpr = 1;
  let cols = 0, rows = 0, spacing = 12;
  let pts = [];
  let cons = [];
  let pins = [];
  let rod = { x0: 0, x1: 0, y: 0, target: 0 };
  let time = 0, acc = 0, last = 0, raf = 0;
  let running = false, visible = true, dropT = 0;

  const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0, inside: false, grab: null, id: null };

  function build() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const clothW = W * (W < 480 ? 0.78 : 0.7);
    spacing = clamp(Math.round(clothW / 40), 7, 12);
    cols = Math.max(8, Math.round(clothW / spacing));
    rows = Math.max(8, Math.round((H * 0.6) / spacing));
    const x0 = (W - cols * spacing) / 2;
    rod.target = Math.round(H * 0.13);
    rod.x0 = x0 - spacing * 1.4;
    rod.x1 = x0 + cols * spacing + spacing * 1.4;

    const startY = reduce.matches ? rod.target : -H * 0.95;
    rod.y = startY;
    dropT = reduce.matches ? 1 : 0;

    pts = [];
    cons = [];
    pins = [];
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const x = x0 + i * spacing;
        const y = startY + j * spacing;
        const pinned = j === 0 && (i % 3 === 0 || i === cols);
        const p = { x, y, px: x, py: y, pinned, ox: x };
        pts.push(p);
        if (pinned) pins.push(p);
      }
    }
    const at = (i, j) => pts[j * (cols + 1) + i];
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        if (i < cols) cons.push([at(i, j), at(i + 1, j), spacing]);
        if (j < rows) cons.push([at(i, j), at(i, j + 1), spacing]);
      }
    }

    if (reduce.matches) {
      for (let k = 0; k < 240; k++) step(STEP, 0);
      draw();
    }
  }

  function step(dt, wind) {
    time += dt;

    // Ease the rod down onto its hooks during the intro.
    if (dropT < 1) {
      dropT = Math.min(1, dropT + dt / 1.5);
      const e = 1 - Math.pow(1 - dropT, 3);
      rod.y = -H * 0.95 + (rod.target + H * 0.95) * e;
    } else {
      rod.y = rod.target;
    }

    const gravity = 980;
    const damping = 0.988;
    const R = Math.max(70, W * 0.16);
    const R2 = R * R;

    for (let n = 0; n < pts.length; n++) {
      const p = pts[n];
      if (p.pinned) continue;
      const vx = (p.x - p.px) * damping;
      const vy = (p.y - p.py) * damping;
      p.px = p.x;
      p.py = p.y;

      // Breeze: a slow sway plus a pattern that varies across the width,
      // which bunches the threads into soft vertical folds.
      const depth = (p.y - rod.y) / (rows * spacing);
      let ax = wind * depth * (Math.sin(time * 0.8 + p.y * 0.011) * 0.55 + Math.sin(time * 0.5 + p.ox * 0.045) * 0.45);
      let ay = gravity + wind * 0.3 * depth * Math.sin(time * 1.1 + p.ox * 0.05);

      if (pointer.inside && !pointer.grab) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const f = 1 - d2 / R2;
          ax += pointer.vx * 7 * f;
          ay += pointer.vy * 7 * f;
        }
      }

      p.x += vx + ax * dt * dt;
      p.y += vy + ay * dt * dt;
    }

    for (let it = 0; it < 7; it++) {
      for (let c = 0; c < cons.length; c++) {
        const [a, b, rest] = cons[c];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const diff = (d - rest) / d;
        if (a.pinned) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else if (b.pinned) {
          a.x += dx * diff;
          a.y += dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          b.x -= dx * diff * 0.5;
          b.y -= dy * diff * 0.5;
        }
      }
      if (pointer.grab) {
        pointer.grab.x = pointer.x;
        pointer.grab.y = pointer.y;
      }
      for (let k = 0; k < pins.length; k++) {
        pins[k].x = pins[k].ox;
        pins[k].y = rod.y;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const at = (i, j) => pts[j * (cols + 1) + i];

    // Flat body of the sheet, so it reads as one piece of cloth.
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) ctx.lineTo(at(i, 0).x, at(i, 0).y);
    for (let j = 0; j <= rows; j++) ctx.lineTo(at(cols, j).x, at(cols, j).y);
    for (let i = cols; i >= 0; i--) ctx.lineTo(at(i, rows).x, at(i, rows).y);
    for (let j = rows; j >= 0; j--) ctx.lineTo(at(0, j).x, at(0, j).y);
    ctx.closePath();
    ctx.fillStyle = colors.body;
    ctx.fill();

    // Weft: horizontal threads.
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = colors.weft;
    ctx.beginPath();
    for (let j = 1; j <= rows - 4; j++) {
      ctx.moveTo(at(0, j).x, at(0, j).y);
      for (let i = 1; i <= cols; i++) ctx.lineTo(at(i, j).x, at(i, j).y);
    }
    ctx.stroke();

    // Warp: vertical threads, with every sixth pair woven heavier as a stripe.
    const isStripe = (i) => i % 6 === 0 || i % 6 === 1;
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.warp;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      if (isStripe(i)) continue;
      ctx.moveTo(at(i, 0).x, at(i, 0).y);
      for (let j = 1; j <= rows; j++) ctx.lineTo(at(i, j).x, at(i, j).y);
    }
    ctx.stroke();
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = colors.stripe;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      if (!isStripe(i)) continue;
      ctx.moveTo(at(i, 0).x, at(i, 0).y);
      for (let j = 1; j <= rows; j++) ctx.lineTo(at(i, j).x, at(i, j).y);
    }
    ctx.stroke();

    // Hem stripe near the bottom, like the colored band on hospital sheets.
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = colors.hem;
    ctx.beginPath();
    for (let j = rows - 3; j <= rows - 2; j++) {
      ctx.moveTo(at(0, j).x, at(0, j).y);
      for (let i = 1; i <= cols; i++) ctx.lineTo(at(i, j).x, at(i, j).y);
    }
    ctx.stroke();

    // Bottom hem.
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = colors.warp;
    ctx.beginPath();
    ctx.moveTo(at(0, rows).x, at(0, rows).y);
    for (let i = 1; i <= cols; i++) ctx.lineTo(at(i, rows).x, at(i, rows).y);
    ctx.moveTo(at(0, rows - 1).x, at(0, rows - 1).y);
    for (let i = 1; i <= cols; i++) ctx.lineTo(at(i, rows - 1).x, at(i, rows - 1).y);
    ctx.stroke();

    // Rod and rings.
    ctx.strokeStyle = colors.rod;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rod.x0, rod.y);
    ctx.lineTo(rod.x1, rod.y);
    ctx.stroke();
    ctx.fillStyle = colors.rod;
    ctx.beginPath();
    ctx.arc(rod.x0, rod.y, 5, 0, Math.PI * 2);
    ctx.arc(rod.x1, rod.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.6;
    for (let k = 0; k < pins.length; k++) {
      ctx.beginPath();
      ctx.arc(pins[k].x, pins[k].y, 3.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    if (pointer.grab) {
      ctx.fillStyle = colors.hem;
      ctx.beginPath();
      ctx.arc(pointer.grab.x, pointer.grab.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || STEP);
    last = now;
    acc += dt;
    const wind = 260 + 150 * Math.sin(time * 0.21) + 60 * Math.sin(time * 0.67);
    let n = 0;
    while (acc >= STEP && n < 4) {
      step(STEP, wind);
      acc -= STEP;
      n++;
    }
    if (n === 4) acc = 0;
    pointer.vx *= 0.85;
    pointer.vy *= 0.85;
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

  function local(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function onMove(e) {
    const [x, y] = local(e);
    const now = performance.now();
    const dt = Math.max(8, now - pointer.t) / 1000;
    if (pointer.inside) {
      pointer.vx = clamp((x - pointer.x) / dt, -2500, 2500);
      pointer.vy = clamp((y - pointer.y) / dt, -2500, 2500);
    }
    pointer.x = x;
    pointer.y = y;
    pointer.t = now;
    pointer.inside = true;
  }

  function onDown(e) {
    if (reduce.matches) return;
    const [x, y] = local(e);
    let best = null;
    let bestD = (coarse.matches ? 40 : 28) ** 2;
    for (let n = 0; n < pts.length; n++) {
      const p = pts[n];
      if (p.pinned) continue;
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) return;
    pointer.grab = best;
    pointer.id = e.pointerId;
    pointer.x = x;
    pointer.y = y;
    pointer.inside = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-grabbing');
    opts.onGrab && opts.onGrab();
  }

  function onUp(e) {
    if (pointer.id !== null && e.pointerId === pointer.id) {
      pointer.grab = null;
      pointer.id = null;
      canvas.classList.remove('is-grabbing');
    }
  }

  function onLeave() {
    if (!pointer.grab) {
      pointer.inside = false;
      pointer.vx = 0;
      pointer.vy = 0;
    }
  }

  let resizeTimer;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const r = canvas.getBoundingClientRect();
      if (Math.abs(r.width - W) > 2 || Math.abs(r.height - H) > 2) {
        const wasDropped = dropT >= 1;
        build();
        if (wasDropped) {
          dropT = 1;
          rod.y = rod.target;
          for (let k = 0; k < 180; k++) step(STEP, 0);
          draw();
        }
      }
    }, 120);
  });
  ro.observe(canvas);

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  });
  io.observe(canvas);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);
  reduce.addEventListener('change', () => {
    stop();
    build();
    start();
  });

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);

  build();
  start();

  return {
    destroy() {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
