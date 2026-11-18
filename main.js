(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = v => Math.min(1, Math.max(0, v));
  const back = k => { const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  /* ---- Intro : persiennes ---- */
  const intro = $('#intro');
  $$('.slat', intro).forEach((s, i) => s.style.transitionDelay = (i * 0.055) + 's');
  let done = false;
  const openIntro = () => {
    if (done) return; done = true;
    intro.classList.add('open');
    setTimeout(() => body.classList.add('ready'), reduce ? 0 : 350);
    setTimeout(() => { intro.classList.add('gone'); if (!body.classList.contains('menu-open')) body.classList.remove('locked'); }, reduce ? 0 : 1500);
  };
  fontsReady.then(() => setTimeout(openIntro, reduce ? 0 : 2100));
  setTimeout(openIntro, 4500);                 // filet de sécurité
  intro.addEventListener('click', openIntro);  // tap pour passer

  /* ---- Menu ---- */
  const burger = $('#burger'), nav = $('#nav');
  const toggleMenu = open => {
    body.classList.toggle('menu-open', open);
    body.classList.toggle('locked', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.setAttribute('aria-hidden', !open);
    if (open) setTimeout(() => $('a', nav).focus({ preventScroll: true }), 300);
  };
  burger.addEventListener('click', () => toggleMenu(!body.classList.contains('menu-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('menu-open')) { toggleMenu(false); burger.focus(); } });

  /* ---- Apparitions ---- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('[data-r],[data-clip]').forEach(el => io.observe(el));

  /* ---- Éléments pilotés par le scroll ---- */
  const top = $('#top'), dock = $('#dock'), hero = $('#accueil'), hImg = $('.hero .pic img');
  const vit = $('#manifeste'), lns = $$('.ln', vit), vbg = $('.bg', vit), vbg2 = $('.bg2', vit), veil = $('.veil', vit), glass = $('.glass', vit);
  const pita = $('.pita', vit), vsub = $('.sub', vit), vhint = $('.hint', vit);
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const cards = $$('.card');
  const bw = $('#bigword'), foo = $('#foot');
  let chs = [], layout = '', lastY = 0, ticking = false;

  // Footer : le mot remplit pile la largeur (2 lignes sur mobile)
  const build = () => {
    const rows = innerWidth < 700 ? ['MAÏ', 'MO'] : ['MAÏMO'];
    if (rows.join() === layout) return; layout = rows.join();
    bw.innerHTML = rows.map(r => `<div class="row">${[...r].map(c => `<span class="ch">${c}</span>`).join('')}</div>`).join('');
    chs = $$('.ch', bw);
  };
  const fit = () => {
    build();
    bw.style.fontSize = '100px';
    const w = foo.clientWidth - parseFloat(getComputedStyle(foo).paddingLeft) * 2;
    let nat = 0; $$('.ch', $('.row', bw)).forEach(c => nat += c.offsetWidth);
    bw.style.fontSize = (100 * w / nat * .99) + 'px';
  };

  function frame() {
    ticking = false;
    // 1) lectures
    const y = scrollY, vh = innerHeight, vw = innerWidth, h = hero.offsetHeight;
    const vr = vit.getBoundingClientRect();
    const fr = foo.getBoundingClientRect();
    const mobile = vw < 900;
    const cardTops = mobile ? cards.map(c => c.getBoundingClientRect().top) : null;
    const cardH = mobile && cards[0] ? cards[0].offsetHeight : 1;

    // 2) écritures
    top.classList.toggle('solid', y > 40);
    if (y > h && y > lastY + 4 && !body.classList.contains('menu-open')) top.classList.add('hide');
    if (y < lastY - 4) top.classList.remove('hide');
    dock.classList.toggle('show', y > h * .7 && fr.top > vh * .85);
    lastY = y;

    if (body.classList.contains('ready')) {
      hImg.style.transition = 'none';
      hImg.style.transform = `scale(1.04) translateY(${Math.min(y, vh) * .08}px)`;
    }

    // La vitrine : les lignes pivotent comme vues de l'autre côté de la vitre
    const p = reduce ? 1 : clamp(-vr.top / (vr.height - vh));
    if (vr.bottom > -50 && vr.top < vh + 50) {
      lns.forEach((l, i) => {
        const k = ease(clamp((p - .08 - i * .07) / .3));
        l.style.transform = `rotateY(${180 * (1 - k)}deg)`;
        l.style.opacity = .72 + .28 * k;
      });
      const z = ease(clamp((p - .15) / .7));
      vbg.style.transform = vbg2.style.transform = `scale(${1 + z * .35})`;
      vbg2.style.opacity = z;
      veil.style.opacity = .85 + z * .15;
      glass.style.transform = `translateX(${p * 260}%)`;
      pita.classList.toggle('on', p > .52);
      vsub.classList.toggle('on', p > .66);
      vhint.style.opacity = p > .05 ? 0 : 1;
    }

    // Cartes empilées (mobile)
    if (mobile) cards.forEach((c, i) => {
      if (i === cards.length - 1) return;
      const k = clamp(1 - (cardTops[i + 1] - cardTops[i]) / cardH);
      c.style.transform = `scale(${1 - k * .06})`;
      c.style.filter = `brightness(${1 - k * .15})`;
    });

    // Footer : lettres qui jaillissent
    const fp = reduce ? 1 : clamp((vh - fr.top) / Math.min(fr.height, vh));
    chs.forEach((c, i) => {
      const k = clamp((fp - .05 - i * .08) / .4), e = back(k);
      c.style.transform = `translateY(${(1 - e) * 120}%) rotate(${(1 - e) * (i % 2 ? 30 : -30)}deg) scale(${.55 + .45 * e})`;
      c.style.opacity = k > 0 ? 1 : 0;
    });
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { fit(); request(); });
  fit();
  fontsReady.then(() => { fit(); request(); });

  /* ---- Midi / Soir ---- */
  const sw = $('#switch');
  $$('button', sw).forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.v;
    sw.dataset.v = v;
    $$('button', sw).forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.panel').forEach(p => p.hidden = p.dataset.p !== v);
  }));

  /* ---- Carte : catégorie active ---- */
  const chips = $$('#chips a');
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    chips.forEach(c => {
      const on = c.getAttribute('href') === '#' + e.target.id;
      c.classList.toggle('on', on);
      if (on) c.parentElement.scrollTo({ left: c.offsetLeft - (c.parentElement.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
    });
  }), { rootMargin: '-35% 0px -60% 0px' });
  $$('.cat').forEach(c => cio.observe(c));

  /* ---- Galerie : progression + glisser à la souris ---- */
  const track = $('#track'), prog = $('#prog');
  const upd = () => {
    const max = track.scrollWidth - track.clientWidth;
    prog.style.width = (25 + (max > 0 ? track.scrollLeft / max : 0) * 75) + '%';
  };
  track.addEventListener('scroll', upd, { passive: true }); upd();
  let down = false, sx = 0, sl = 0;
  track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = track.scrollLeft; track.style.scrollSnapType = 'none'; });
  addEventListener('pointerup', () => { if (!down) return; down = false; track.style.scrollSnapType = ''; });
  addEventListener('pointermove', e => { if (down) track.scrollLeft = sl - (e.clientX - sx); });

  request();
})();
