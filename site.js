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

/* Shader hero — animated brand-colour mesh (vanilla, no deps) */
(() => {
  const cv = document.getElementById('heroShader');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = cv.getContext('2d');
  let w, h, running = true, raf = 0;

  const blobs = [
    { c: '104,128,214', a: 0.60, r: 0.34, x: 0.14, y: 0.22, sx: 0.24, sy: 0.18, fx: 0.128, fy: 0.104, ph: 0.0 },
    { c: '8,13,34',     a: 0.78, r: 0.52, x: 0.86, y: 0.10, sx: 0.20, sy: 0.18, fx: 0.090, fy: 0.116, ph: 2.1 },
    { c: '255,110,44',  a: 0.66, r: 0.32, x: 0.80, y: 0.78, sx: 0.22, sy: 0.18, fx: 0.109, fy: 0.134, ph: 4.2 },
    { c: '255,150,84',  a: 0.38, r: 0.22, x: 0.32, y: 0.86, sx: 0.26, sy: 0.15, fx: 0.140, fy: 0.096, ph: 1.3 },
    { c: '72,96,190',   a: 0.50, r: 0.30, x: 0.52, y: 0.46, sx: 0.28, sy: 0.22, fx: 0.078, fy: 0.088, ph: 3.4 }
  ];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); addEventListener('resize', resize, { passive: true });

  const draw = (now) => {
    if (!running) return;
    const t = now / 1000;
    ctx.fillStyle = '#0f1530';
    ctx.fillRect(0, 0, w, h);
    for (const b of blobs) {
      const cx = (b.x + b.sx * Math.sin(t * b.fx * 6.283 + b.ph)) * w;
      const cy = (b.y + b.sy * Math.cos(t * b.fy * 6.283 + b.ph)) * h;
      const rad = b.r * Math.max(w, h);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `rgba(${b.c},${b.a})`);
      g.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    raf = requestAnimationFrame(draw);
  };

  const io2 = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(draw); }
    else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
  });
  io2.observe(cv);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else { running = true; raf = requestAnimationFrame(draw); }
  });
  raf = requestAnimationFrame(draw);
})();
