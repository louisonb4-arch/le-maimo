(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = v => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const back = k => { const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  let ticking = false;
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };

  /* ---- Intro : persiennes ---- */
  const intro = $('#intro');
  $$('.slat', intro).forEach((s, i) => s.style.transitionDelay = (i * 0.055) + 's');
  let done = false, revealStart = 0;
  const openIntro = () => {
    if (done) return; done = true;
    intro.classList.add('open');
    setTimeout(() => {
      body.classList.add('ready');
      revealStart = performance.now();
      const loop = () => { request(); if (performance.now() - revealStart < 1500) requestAnimationFrame(loop); };
      loop();
    }, reduce ? 0 : 350);
    setTimeout(() => { intro.classList.add('gone'); if (!body.classList.contains('menu-open')) body.classList.remove('locked'); }, reduce ? 0 : 1500);
  };
  fontsReady.then(() => setTimeout(openIntro, reduce ? 0 : 2100));
  setTimeout(openIntro, 4500);
  intro.addEventListener('click', openIntro);

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
  const pio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting)), { threshold: .25 });
  $$('.svc .panel').forEach(p => pio.observe(p));

  /* ---- Références pour le scroll ---- */
  const top = $('#top'), dock = $('#dock');
  const hero = $('#accueil'), mast = $('#mast'), heroImg = $('.hero .ph img');
  const p1in = $('#p1 .in'), p2 = $('#p2');
  const cols = $$('#mos .col');
  const bw = $('#bigword'), foo = $('#foot');
  let chs = [], layout = '', lastY = 0;

  // Footer : le mot remplit pile la largeur (2 lignes sur mobile)
  const build = () => {
    const rows = ['MAÏMO'];
    if (rows.join() === layout) return; layout = rows.join();
    bw.innerHTML = rows.map(r => `<div class="row">${[...r].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join('')}</div>`).join('');
    chs = $$('.ch', bw);
  };
  const fitMast = () => {
    mast.style.fontSize = '100px';
    let nat = 0; $$('.ch', mast).forEach(c => nat += c.offsetWidth);
    mast.style.fontSize = (100 * mast.clientWidth / nat * .97) + 'px';
  };
  const fit = () => {
    fitMast();
    build();
    bw.style.fontSize = '100px';
    const w = foo.clientWidth - parseFloat(getComputedStyle(foo).paddingLeft) * 2;
    let nat = 0; $$('.ch', $('.row', bw)).forEach(c => nat += c.offsetWidth);
    bw.style.fontSize = (100 * w / nat * .99) + 'px';
  };

  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight, vw = innerWidth, mobile = vw < 900;
    const hr = hero.getBoundingClientRect(), fr = foo.getBoundingClientRect();
    const p2top = p2.getBoundingClientRect().top;
    const colRects = cols.map(c => c.parentElement.getBoundingClientRect());

    // En-tête et barre de réservation
    const heroEnd = hero.offsetHeight - 80;
    top.classList.toggle('light', y < heroEnd);
    top.classList.toggle('solid', y >= heroEnd);
    if (y > heroEnd && y > lastY + 4 && !body.classList.contains('menu-open')) top.classList.add('hide');
    if (y < lastY - 4) top.classList.remove('hide');
    dock.classList.toggle('show', y > heroEnd * .9 && fr.top > vh * .85);
    lastY = y;

    // Hero : la une glisse doucement au scroll
    if (!reduce && hr.bottom > 0 && performance.now() - revealStart > 2600 && body.classList.contains('ready')) {
      const k = Math.min(y, vh);
      heroImg.style.transition = 'none';
      heroImg.style.transform = `scale(${1.04 + k * .00025}) translateY(${k * .05}px)`;
      mast.style.transform = `translateY(${k * .18}px)`;
    }

    // Midi / soir : le panneau du midi recule quand le soir arrive
    if (!reduce) {
      const k = clamp(1 - p2top / vh);
      p1in.style.transform = `scale(${1 - k * .08})`;
      p1in.style.filter = `brightness(${1 - k * .35})`;
    }

    // Ambiance : la deuxième colonne glisse plus vite
    if (!reduce && colRects[1] && colRects[1].bottom > 0 && colRects[1].top < vh) {
      const c = (colRects[1].top + colRects[1].height / 2 - vh / 2) / vh;
      cols[1].style.transform = `translateY(${c * (mobile ? 70 : 110)}px)`;
      cols[0].style.transform = `translateY(${c * -20}px)`;
    }

  }
  addEventListener('scroll', request, { passive: true });
  // Panneaux midi/soir plus hauts que l'écran : ils collent seulement une fois leur bas atteint
  const stick = () => $$('.svc .panel').forEach(p => { p.style.top = Math.min(0, innerHeight - p.offsetHeight) + 'px'; });
  // iPhone : la barre de Safari déclenche des « resize » en hauteur pendant le scroll ; on ne recalcule que si la largeur change
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; fit(); } stick(); request(); rail(); });
  // Footer : le mot jaillit lettre par lettre quand il est bien visible, et se rejoue à chaque passage
  new IntersectionObserver(es => es.forEach(e => {
    if (e.intersectionRatio > .55) bw.classList.add('go');
    else if (!e.isIntersecting) bw.classList.remove('go');
  }), { threshold: [0, .55] }).observe(bw);
  if (reduce) bw.classList.add('go');
  stick(); fontsReady.then(stick);
  fit();
  fontsReady.then(() => { fit(); request(); });

  /* ---- Incontournables : rail de cartes ---- */
  const rl = $('#rail'), dishes = $$('.dish', rl), sigN = $('#sigN'), sigBar = $('#sigBar');
  let rt = false;
  function rail() {
    rt = false;
    const rc = rl.getBoundingClientRect(), mid = rc.left + rc.width / 2;
    let best = 0, bd = 1e9;
    dishes.forEach((d, i) => {
      const r = d.getBoundingClientRect(), dist = (r.left + r.width / 2 - mid) / r.width;
      if (Math.abs(dist) < bd) { bd = Math.abs(dist); best = i; }
      if (reduce) return;
      d.style.transform = `scale(${1 - Math.min(Math.abs(dist), 1) * .07})`;
      const img = $('img', d); if (img) img.style.transform = `translateX(${-dist * 7}%)`;
    });
    sigN.textContent = String(best + 1).padStart(2, '0');
    const max = rl.scrollWidth - rl.clientWidth;
    sigBar.style.width = (20 + (max > 0 ? rl.scrollLeft / max : 0) * 80) + '%';
  }
  rl.addEventListener('scroll', () => { if (!rt) { rt = true; requestAnimationFrame(rail); } }, { passive: true });
  rail();
  let down = false, sx = 0, sl = 0, moved = false;
  rl.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rl.scrollLeft; rl.style.scrollSnapType = 'none'; });
  addEventListener('pointerup', () => { if (!down) return; down = false; rl.style.scrollSnapType = ''; });
  addEventListener('pointermove', e => { if (!down) return; if (Math.abs(e.clientX - sx) > 5) moved = true; rl.scrollLeft = sl - (e.clientX - sx); });
  rl.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);

  /* ---- Carte : onglets + glisser ---- */
  const tabs = $$('#tabs [role=tab]'), tps = $$('#panels .tp'), tPos = $('#tPos');
  let cur = 0;
  const show = (i, focus) => {
    i = (i + tabs.length) % tabs.length; cur = i;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    tps.forEach((p, k) => {
      p.hidden = k !== i;
      if (k === i) {
        $$('.intro,.item', p).forEach((el, n) => el.style.setProperty('--i', n));
        p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter');
      }
    });
    const t = tabs[i], bar = t.parentElement;
    bar.scrollTo({ left: t.offsetLeft - (bar.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
    tPos.textContent = `${i + 1} / ${tabs.length} · glissez pour changer`;
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1, true); }
    });
  });
  $('#tNext').addEventListener('click', () => show(cur + 1));
  $('#tPrev').addEventListener('click', () => show(cur - 1));
  const panels = $('#panels');
  let tx = null, ty = null;
  panels.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  panels.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) show(cur + (dx < 0 ? 1 : -1));
    tx = ty = null;
  }, { passive: true });

  /* ---- Horaires : on surligne le jour ---- */
  const today = new Date().getDay();
  $$('#week li').forEach(li => { if (+li.dataset.d === today) li.classList.add('today'); });

  request();
})();
