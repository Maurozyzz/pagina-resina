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

/* ---------- Product technical sheets (modal) ---------- */
const PRODUCTS = {
  cristal: {
    title: 'Epoxi Cristal',
    image: 'https://dcdn-us.mitiendanube.com/stores/007/097/879/products/reves-porc-l-r6v-a5c137f9e2f59cc85f17670268367384-480-0.webp',
    desc: 'Resina epoxi transparente de dos componentes para superficies decorativas donde el brillo, el espesor y la transparencia son protagonistas.',
    features: [
      'Alta transparencia y brillo',
      'Resistencia al amarillamiento',
      'Ideal para mesas río, mesadas y piezas encapsuladas',
      'Perfecto para proyectos personalizados'
    ],
    apps: ['Mesas río', 'Mesadas', 'Artesanías', 'Superficies decorativas']
  },
  pisos: {
    title: 'Pisos Epoxi',
    image: 'https://dcdn-us.mitiendanube.com/stores/007/097/879/products/img_20260118_143713471-17f649576e7beb5a0517695445363977-480-0.webp',
    desc: 'Revestimiento bicomponente diseñado para pisos industriales, comerciales y residenciales sometidos a uso intensivo, con una superficie continua y sin juntas.',
    features: [
      'Alta resistencia mecánica y química',
      'Soporta tránsito pesado y autoelevadores',
      'Superficies antideslizantes según necesidad',
      'Fácil limpieza y mantenimiento'
    ],
    apps: ['Industrias', 'Depósitos', 'Talleres', 'Comercios', 'Garajes']
  },
  autonivelantes: {
    title: 'Autonivelantes',
    image: 'https://dcdn-us.mitiendanube.com/stores/007/097/879/products/img_20150531_140001-7f7c1ab79b2578207a17670274695586-480-0.webp',
    desc: 'Sistema epoxi que ofrece una terminación lisa, uniforme y de alta resistencia, ideal para ambientes que requieren precisión, higiene y estética.',
    features: [
      'Nivelación perfecta',
      'Alta resistencia química y mecánica',
      'Terminación brillante o mate',
      'Ideal para áreas de producción y laboratorios'
    ],
    apps: ['Industrias', 'Hospitales', 'Laboratorios', 'Comercios', 'Oficinas']
  },
  morteros: {
    title: 'Morteros Epoxi',
    image: 'https://dcdn-us.mitiendanube.com/stores/007/097/879/products/reparacion6-bc737ec450b6c13a3517695430126992-480-0.webp',
    desc: 'Sistema de revestimiento industrial pensado para nivelar, reparar y reconstruir superficies sometidas a tránsito pesado y alta exigencia mecánica.',
    features: [
      'Alta resistencia al impacto y la abrasión',
      'Excelente adherencia',
      'Resistencia química y térmica',
      'Ideal para reparaciones y recubrimientos de alto espesor'
    ],
    apps: ['Reparación de pisos', 'Rampas y muelles', 'Depósitos', 'Talleres']
  },
  anticorrosivos: {
    title: 'Anticorrosivos',
    image: 'https://dcdn-us.mitiendanube.com/stores/007/097/879/products/pintura-anticorresiva-portada-casa-lima-9fea77a4a137bfc4fb17670286233141-480-0.webp',
    desc: 'Recubrimiento epoxi de bajos sólidos formulado para proteger estructuras metálicas, brindando una barrera resistente frente a la corrosión.',
    features: [
      'Protección contra la corrosión',
      'Alta adherencia sobre superficies metálicas',
      'Terminaciones resistentes y duraderas',
      'Disponible en distintos colores y texturas'
    ],
    apps: ['Estructuras metálicas', 'Tanques y cisternas', 'Plantas de proceso', 'Industrias químicas']
  },
  drenantes: {
    title: 'Drenantes e impermeabilización',
    image: 'https://dcdn-us.mitiendanube.com/stores/007/097/879/products/whatsapp-image-2026-01-02-at-2-57-43-pm-af0c42519d8c00047217673895750478-480-0.webp',
    desc: 'Soluciones para pisos drenantes de alta permeabilidad y sistemas epoxi bituminosos que impermeabilizan y protegen contra la humedad.',
    features: [
      'Alta permeabilidad y seguridad antideslizante',
      'Ideal para exteriores',
      'Protección contra la humedad',
      'Impermeabilización de estructuras'
    ],
    apps: ['Exteriores', 'Terrazas', 'Estructuras expuestas a humedad']
  }
};

const modal = document.getElementById('productModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalFeatures = document.getElementById('modalFeatures');
const modalApps = document.getElementById('modalApps');
const modalWaLink = document.getElementById('modalWaLink');
let lastFocusedEl = null;

function openModal(id) {
  const data = PRODUCTS[id];
  if (!data) return;

  modalImage.src = data.image;
  modalImage.alt = data.title;
  modalTitle.textContent = data.title;
  modalDesc.textContent = data.desc;

  modalFeatures.innerHTML = '';
  data.features.forEach(f => {
    const li = document.createElement('li');
    li.innerHTML = '<i class="ph ph-check-circle"></i><span></span>';
    li.querySelector('span').textContent = f;
    modalFeatures.appendChild(li);
  });

  modalApps.innerHTML = '';
  data.apps.forEach(a => {
    const span = document.createElement('span');
    span.textContent = a;
    modalApps.appendChild(span);
  });

  modalWaLink.href = 'https://wa.me/5491131336580?text=' + encodeURIComponent('Hola, quiero consultar por ' + data.title);

  lastFocusedEl = document.activeElement;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  modal.querySelector('.modal__close').focus();
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (lastFocusedEl) lastFocusedEl.focus();
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
}

document.querySelectorAll('[data-product]').forEach(card => {
  card.addEventListener('click', () => openModal(card.dataset.product));
});

modal.querySelectorAll('[data-modal-close]').forEach(el => {
  el.addEventListener('click', closeModal);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
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
    const seg = 1;              // scroll-time allotted to each panel
    const fade = .28;           // fraction of a segment spent fading in/out
    const total = panels.length * seg;

    gsap.set(panels, { opacity: 0, y: 26, scale: .96, filter: 'blur(0px)' });

    // Ease the opening headline in while the section is still scrolling into
    // view, so it's already settled by the time the pin engages instead of
    // popping in fully-formed the instant scrolling locks.
    gsap.fromTo(panels[0],
      { opacity: 0, y: 34, scale: .96, filter: 'blur(8px)' },
      {
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', ease: 'none',
        scrollTrigger: {
          trigger: '.cristal',
          start: 'top 90%',
          end: 'top top',
          scrub: .6,
        }
      }
    );

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
      const segStart = i * seg;
      const segEnd = segStart + seg;

      if (i > 0) {
        stackTl.fromTo(panel,
          { opacity: 0, y: 26, scale: .96, filter: 'blur(6px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: fade, ease: 'power1.out' },
          segStart
        );
      }
      if (i < panels.length - 1) {
        stackTl.to(panel,
          { opacity: 0, y: -26, scale: 1.04, filter: 'blur(6px)', duration: fade, ease: 'power1.in' },
          segEnd - fade
        );
      }
    });

    stackTl.to({}, { duration: .001 }, total);
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
