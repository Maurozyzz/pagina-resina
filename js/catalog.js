document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Nav ---------- */
const nav = document.getElementById('nav');
const navBurger = document.getElementById('navBurger');
const navMobile = document.getElementById('navMobile');

window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });
nav.classList.toggle('is-scrolled', window.scrollY > 40);

navBurger.addEventListener('click', () => {
  navMobile.classList.toggle('is-open');
});
navMobile.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navMobile.classList.remove('is-open'));
});

/* ---------- Scroll reveal ---------- */
if (reduceMotion || typeof gsap === 'undefined') {
  document.querySelectorAll('[data-reveal]').forEach(el => {
    el.style.opacity = 1;
    el.style.transform = 'none';
  });
} else {
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll('[data-reveal]').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 28 }, {
      opacity: 1, y: 0, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });
}
