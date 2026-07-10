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

/* Hero — neural constellation: many minds (nodes) connect, and orange signals
   converge on FOUR points of decision — the four practices. Interactive:
   the cursor becomes another mind the network links to and swirls around.
   Vanilla canvas, no deps. */
(() => {
  const cv = document.getElementById('heroShader');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = cv.getContext('2d');
  let w, h, running = true, raf = 0;
  let nodes = [], pulses = [], foci = [], R = 130, spawnAt = 0;
  const mouse = { x: 0, y: 0, on: false };

  /* four quiet points of convergence — one per practice, never named,
     scattered across the field and clear of the copy */
  const fociSpots = () => {
    if (w < 640)  return [[.15, .10], [.85, .15], [.20, .90], [.80, .85]];
    if (w < 1080) return [[.16, .14], [.84, .20], [.22, .88], [.87, .72]];
    return [[.18, .16], [.82, .20], [.30, .85], [.80, .70]];
  };

  const build = () => {
    foci = fociSpots().map((s, i) => ({ x: s[0] * w, y: s[1] * h, flash: 0, ph: i * 1.7 }));
    /* proportional to area — small screens get a lighter mesh, not desktop's */
    R = Math.max(72, Math.min(130, Math.sqrt(w * h) / 10));
    const n = Math.max(48, Math.min(230, Math.round(w * h / 7000)));
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

  /* the cursor joins the network — real pointers only; on touch a drag is a
     scroll, not a mind, and the link would stick where the finger left */
  if (matchMedia('(pointer: fine)').matches) {
    const sec = cv.parentElement;
    sec.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
    }, { passive: true });
    sec.addEventListener('pointerleave', () => { mouse.on = false; }, { passive: true });
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  /* Greedy path from a peripheral node through connected neighbours toward a focus */
  const makePath = (target) => {
    const far = nodes.filter(nd => dist(nd, target) > Math.min(w, h) * 0.30);
    if (!far.length) return null;
    let cur = far[Math.floor(Math.random() * far.length)];
    const path = [{ x: cur.x, y: cur.y }];
    for (let hop = 0; hop < 12; hop++) {
      if (dist(cur, target) < R) { path.push(target); return path; }
      let best = null, bd = dist(cur, target);
      for (const nd of nodes) {
        if (nd === cur) continue;
        if (dist(nd, cur) < R * 1.25) {
          const d = dist(nd, target);
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

    /* ambient — a soft breath of light behind each practice, blue upper-left.
       Fill only each glow's bounding box, not the whole canvas (mobile GPUs). */
    for (const f of foci) {
      const rad = Math.max(w, h) * .16;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
      g.addColorStop(0, `rgba(255,103,36,${.06 + .02 * Math.sin(t * .8 + f.ph) + f.flash * .08})`);
      g.addColorStop(1, 'rgba(255,103,36,0)');
      ctx.fillStyle = g; ctx.fillRect(f.x - rad, f.y - rad, rad * 2, rad * 2);
    }
    const brad = Math.max(w, h) * .32;
    const g = ctx.createRadialGradient(w * .08, h * .16, 0, w * .08, h * .16, brad);
    g.addColorStop(0, 'rgba(96,120,206,.11)');
    g.addColorStop(1, 'rgba(96,120,206,0)');
    ctx.fillStyle = g; ctx.fillRect(w * .08 - brad, h * .16 - brad, brad * 2, brad * 2);

    /* drift + gentle swirl away from the cursor */
    const RM = 150;
    for (const nd of nodes) {
      nd.x += nd.vx * dt; nd.y += nd.vy * dt;
      if (mouse.on) {
        const dx = nd.x - mouse.x, dy = nd.y - mouse.y, d = Math.hypot(dx, dy);
        if (d > 1 && d < RM) {
          const f = (1 - d / RM) * 30 * dt;
          nd.x += (dx / d) * f + (-dy / d) * f * .6;   /* push + slight curl */
          nd.y += (dy / d) * f + (dx / d) * f * .6;
        }
      }
      if (nd.x < -20) nd.x = w + 20; if (nd.x > w + 20) nd.x = -20;
      if (nd.y < -20) nd.y = h + 20; if (nd.y > h + 20) nd.y = -20;
    }

    /* node-to-node edges */
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = dist(a, b);
        if (d < R) {
          ctx.strokeStyle = `rgba(152,164,206,${(1 - d / R) * .15})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      /* warm edges into each practice point */
      for (const f of foci) {
        const df = dist(a, f);
        if (df < R * 1.1) {
          ctx.strokeStyle = `rgba(255,103,36,${(1 - df / (R * 1.1)) * .20})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(f.x, f.y); ctx.stroke();
        }
      }
    }

    /* cursor links — the visitor's mind joins the network */
    if (mouse.on) {
      for (const nd of nodes) {
        const d = dist(nd, mouse);
        if (d < RM) {
          ctx.strokeStyle = `rgba(255,138,76,${(1 - d / RM) * .30})`;
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(nd.x, nd.y); ctx.stroke();
        }
      }
    }

    /* nodes */
    for (const nd of nodes) {
      ctx.fillStyle = nd.r > 2 ? 'rgba(196,206,238,.7)' : 'rgba(167,177,214,.5)';
      ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r, 0, 6.283); ctx.fill();
    }

    /* signal pulses travelling toward the practices */
    if (t > spawnAt && pulses.length < 4) {
      const target = foci[Math.floor(Math.random() * foci.length)];
      const p = makePath(target);
      if (p) {
        /* each convergence takes ~2s, whatever the path length */
        let len = 0;
        for (let k = 1; k < p.length; k++) len += Math.hypot(p[k].x - p[k - 1].x, p[k].y - p[k - 1].y);
        pulses.push({ path: p, target, seg: 0, u: 0, spd: len / 2 });
      }
      spawnAt = t + 1.8 + Math.random() * 1.4;
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i], a = p.path[p.seg], b = p.path[p.seg + 1];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      p.u += (p.spd * dt) / Math.max(segLen, 1);
      if (p.u >= 1) {
        p.seg++; p.u = 0;
        if (p.seg >= p.path.length - 1) { p.target.flash = 1; pulses.splice(i, 1); continue; }
      }
      const x = a.x + (b.x - a.x) * p.u, y = a.y + (b.y - a.y) * p.u;
      const pg = ctx.createRadialGradient(x, y, 0, x, y, 13);
      pg.addColorStop(0, 'rgba(255,120,54,.85)');
      pg.addColorStop(1, 'rgba(255,120,54,0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(x, y, 13, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#FF6724';
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill();
    }

    /* the four points of decision — unnamed, just quietly there */
    for (const f of foci) {
      f.flash = Math.max(0, f.flash - dt * 1.3);
      const fr = 2.9 + Math.sin(t * 1.6 + f.ph) * .45 + f.flash * 2.6;
      const fg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 30 + f.flash * 26);
      fg.addColorStop(0, `rgba(255,103,36,${.45 + f.flash * .4})`);
      fg.addColorStop(1, 'rgba(255,103,36,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(f.x, f.y, 30 + f.flash * 26, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#FF6724';
      ctx.beginPath(); ctx.arc(f.x, f.y, fr, 0, 6.283); ctx.fill();
    }

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
