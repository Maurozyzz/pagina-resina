document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Nav ---------- */
const nav = document.getElementById('nav');
const navBurger = document.getElementById('navBurger');
const navMobile = document.getElementById('navMobile');

window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

navBurger.addEventListener('click', () => {
  navMobile.classList.toggle('is-open');
});
navMobile.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navMobile.classList.remove('is-open'));
});

if (reduceMotion || typeof gsap === 'undefined') {
  document.querySelectorAll('[data-reveal]').forEach(el => {
    el.style.opacity = 1;
    el.style.transform = 'none';
  });
} else {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Hero entrance ---------- */
  gsap.set('[data-reveal]', { opacity: 0, y: 28 });
  const heroTl = gsap.timeline({ delay: .2 });
  heroTl.to('.hero__title .line', { opacity: 1, y: 0, duration: .9, stagger: .12, ease: 'power3.out' })
        .to('.hero__sub', { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.5')
        .to('.hero__ctas', { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.5');

  /* ---------- Hero parallax on scroll ---------- */
  gsap.to('.hero__img', {
    yPercent: 14,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__glow--a', { y: 120, x: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__glow--b', { y: -80, x: -30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Generic scroll reveal for everything else ---------- */
  document.querySelectorAll('[data-reveal]').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.to(el, {
      opacity: 1, y: 0, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* ---------- Epoxi Cristal sticky-stack ---------- */
  const cristalPin = document.getElementById('cristalPin');
  if (cristalPin) {
    const panels = gsap.utils.toArray('[data-cristal-panel]', cristalPin);
    const stackTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.cristal',
        start: 'top top',
        end: () => '+=' + (panels.length * 900),
        pin: true,
        scrub: .6,
      }
    });

    panels.forEach((panel, i) => {
      if (i === 0) return;
      stackTl.fromTo(panel, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'none' }, i - 1);
      if (i < panels.length) {
        stackTl.to(panels[i - 1], { opacity: 0, y: -40, duration: 1, ease: 'none' }, i - 1 + .5);
      }
    });
  }

  /* ---------- Gallery horizontal pan ---------- */
  const galleryTrack = document.getElementById('galleryTrack');
  const galleryPin = document.getElementById('galleryPin');
  if (galleryTrack && galleryPin) {
    ScrollTrigger.create({
      trigger: '.gallery',
      start: 'top top',
      end: () => '+=' + (galleryTrack.scrollWidth - window.innerWidth + 200),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: self => {
        const distance = galleryTrack.scrollWidth - window.innerWidth + 200;
        gsap.set(galleryTrack, { x: -distance * self.progress });
      }
    });
  }

  /* ---------- Bento hover tilt (desktop only) ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.bento__card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, { rotateX: y * -6, rotateY: x * 6, duration: .4, ease: 'power2.out', transformPerspective: 800 });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: .5, ease: 'power2.out' });
      });
    });
  }
}
