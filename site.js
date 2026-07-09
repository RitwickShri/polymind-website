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
