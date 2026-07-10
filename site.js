const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

const mMenu = document.getElementById('mMenu');
const open = () => { mMenu.classList.add('open'); mMenu.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
const close = () => { mMenu.classList.remove('open'); mMenu.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
document.getElementById('menuOpen').addEventListener('click', open);
document.getElementById('menuClose').addEventListener('click', close);
mMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

/* Hero — neural constellation: many minds (nodes) connect, and signals
   converge on a single point of decision. Vanilla canvas, no deps. */
(() => {
  const cv = document.getElementById('heroShader');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = cv.getContext('2d');
  let w, h, running = true, raf = 0;
  let nodes = [], pulses = [], R = 130, focus = { x: 0, y: 0 }, flash = 0, spawnAt = 0;

  const build = () => {
    focus.x = (w < 640 ? 0.78 : w < 1080 ? 0.84 : 0.74) * w;
    focus.y = (w < 640 ? 0.24 : w < 1080 ? 0.36 : 0.44) * h;
    R = Math.max(110, Math.min(160, Math.sqrt(w * h) / 8));
    const n = Math.max(46, Math.min(110, Math.round(w * h / 15000)));
    nodes = [];
    for (let i = 0; i < n; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7,
        r: Math.random() < .16 ? 2.1 : 1.3
      });
    }
    pulses = [];
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  };
  resize(); addEventListener('resize', resize, { passive: true });

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  /* Greedy path from a peripheral node through connected neighbours toward the focus */
  const makePath = () => {
    const far = nodes.filter(nd => dist(nd, focus) > w * 0.32);
    if (!far.length) return null;
    let cur = far[Math.floor(Math.random() * far.length)];
    const path = [{ x: cur.x, y: cur.y }];
    for (let hop = 0; hop < 12; hop++) {
      if (dist(cur, focus) < R) { path.push({ x: focus.x, y: focus.y }); return path; }
      let best = null, bd = dist(cur, focus);
      for (const nd of nodes) {
        if (nd === cur) continue;
        if (dist(nd, cur) < R * 1.25) {
          const d = dist(nd, focus);
          if (d < bd) { bd = d; best = nd; }
        }
      }
      if (!best) return null;
      path.push({ x: best.x, y: best.y });
      cur = best;
    }
    return null;
  };

  let last = 0;
  const draw = (now) => {
    if (!running) return;
    const t = now / 1000, dt = Math.min(.05, (now - last) / 1000 || .016);
    last = now;

    ctx.fillStyle = '#0f1530';
    ctx.fillRect(0, 0, w, h);

    /* ambient atmosphere — restrained */
    let g = ctx.createRadialGradient(focus.x, focus.y, 0, focus.x, focus.y, Math.max(w, h) * .30);
    g.addColorStop(0, `rgba(255,103,36,${.10 + .03 * Math.sin(t * .8) + flash * .10})`);
    g.addColorStop(1, 'rgba(255,103,36,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    g = ctx.createRadialGradient(w * .10, h * .14, 0, w * .10, h * .14, Math.max(w, h) * .34);
    g.addColorStop(0, 'rgba(96,120,206,.11)');
    g.addColorStop(1, 'rgba(96,120,206,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    /* drift */
    for (const nd of nodes) {
      nd.x += nd.vx * dt; nd.y += nd.vy * dt;
      if (nd.x < -20) nd.x = w + 20; if (nd.x > w + 20) nd.x = -20;
      if (nd.y < -20) nd.y = h + 20; if (nd.y > h + 20) nd.y = -20;
    }

    /* edges */
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = dist(a, b);
        if (d < R) {
          ctx.strokeStyle = `rgba(152,164,206,${(1 - d / R) * .15})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const df = dist(a, focus);
      if (df < R * 1.2) {
        ctx.strokeStyle = `rgba(255,103,36,${(1 - df / (R * 1.2)) * .22})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(focus.x, focus.y); ctx.stroke();
      }
    }

    /* nodes */
    for (const nd of nodes) {
      ctx.fillStyle = nd.r > 2 ? 'rgba(196,206,238,.7)' : 'rgba(167,177,214,.5)';
      ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r, 0, 6.283); ctx.fill();
    }

    /* signal pulses travelling toward the focus */
    if (t > spawnAt && pulses.length < 3) {
      const p = makePath();
      if (p) pulses.push({ path: p, seg: 0, u: 0 });
      spawnAt = t + 1.4 + Math.random() * 1.2;
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i], a = p.path[p.seg], b = p.path[p.seg + 1];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      p.u += (110 * dt) / Math.max(segLen, 1);
      if (p.u >= 1) {
        p.seg++; p.u = 0;
        if (p.seg >= p.path.length - 1) { pulses.splice(i, 1); flash = 1; continue; }
      }
      const x = a.x + (b.x - a.x) * p.u, y = a.y + (b.y - a.y) * p.u;
      const pg = ctx.createRadialGradient(x, y, 0, x, y, 14);
      pg.addColorStop(0, 'rgba(255,120,54,.85)');
      pg.addColorStop(1, 'rgba(255,120,54,0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#FF6724';
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill();
    }

    /* the point of decision */
    flash = Math.max(0, flash - dt * 1.4);
    const fr = 3.2 + Math.sin(t * 1.6) * .5 + flash * 3;
    const fg = ctx.createRadialGradient(focus.x, focus.y, 0, focus.x, focus.y, 44 + flash * 30);
    fg.addColorStop(0, `rgba(255,103,36,${.5 + flash * .4})`);
    fg.addColorStop(1, 'rgba(255,103,36,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(focus.x, focus.y, 44 + flash * 30, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#FF6724';
    ctx.beginPath(); ctx.arc(focus.x, focus.y, fr, 0, 6.283); ctx.fill();

    raf = requestAnimationFrame(draw);
  };

  const io2 = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; last = 0; raf = requestAnimationFrame(draw); }
    else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
  });
  io2.observe(cv);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else { running = true; last = 0; raf = requestAnimationFrame(draw); }
  });
  raf = requestAnimationFrame(draw);
})();
