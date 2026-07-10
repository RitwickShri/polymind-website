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
    { c: '74,92,150',  a: 0.60, r: 0.62, x: 0.14, y: 0.22, sx: 0.24, sy: 0.18, fx: 0.118, fy: 0.096, ph: 0.0 },
    { c: '10,16,38',   a: 0.85, r: 0.66, x: 0.86, y: 0.10, sx: 0.18, sy: 0.16, fx: 0.084, fy: 0.108, ph: 2.1 },
    { c: '255,103,36', a: 0.46, r: 0.50, x: 0.76, y: 0.78, sx: 0.22, sy: 0.17, fx: 0.101, fy: 0.127, ph: 4.2 },
    { c: '194,65,12',  a: 0.30, r: 0.44, x: 0.30, y: 0.88, sx: 0.26, sy: 0.14, fx: 0.132, fy: 0.089, ph: 1.3 },
    { c: '46,60,110',  a: 0.55, r: 0.55, x: 0.52, y: 0.46, sx: 0.28, sy: 0.22, fx: 0.072, fy: 0.081, ph: 3.4 }
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
    ctx.fillStyle = '#1D274E';
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
