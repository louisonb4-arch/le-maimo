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
  const hero = $('#accueil'), arch = $('#arch'), archImg = $('img', arch), hshade = $('#hshade'), hbadge = $('#hbadge'), htitle = $('#htitle');
  const p1in = $('#p1 .in'), p2 = $('#p2');
  const cols = $$('#mos .col');
  const bw = $('#bigword'), foo = $('#foot');
  let chs = [], layout = '', lastY = 0;

  // Footer : le mot remplit pile la largeur (2 lignes sur mobile)
  const build = () => {
    const rows = ['MAÏMO'];
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
    const y = scrollY, vh = innerHeight, vw = innerWidth, mobile = vw < 900;
    const hr = hero.getBoundingClientRect(), fr = foo.getBoundingClientRect(), wr = bw.getBoundingClientRect();
    const tr = htitle.getBoundingClientRect();
    const p2top = p2.getBoundingClientRect().top;
    const colRects = cols.map(c => c.parentElement.getBoundingClientRect());

    // En-tête et barre de réservation
    const heroEnd = hero.offsetHeight - vh;
    top.classList.toggle('solid', y > heroEnd - 10);
    if (y > heroEnd && y > lastY + 4 && !body.classList.contains('menu-open')) top.classList.add('hide');
    if (y < lastY - 4) top.classList.remove('hide');
    dock.classList.toggle('show', y > heroEnd * .9 && fr.top > vh * .85);
    lastY = y;

    // Hero : l'arche monte à l'ouverture, puis s'ouvre en plein écran au scroll
    if (hr.bottom > 0) {
      const r = body.classList.contains('ready') ? (reduce ? 1 : ease(clamp((performance.now() - revealStart) / 1300))) : 0;
      const p = reduce ? 0 : clamp(-hr.top / Math.max(1, hr.height - vh));
      const t = ease(clamp(p / .85));
      const x0 = mobile ? vw * .07 : vw * .3;
      const t0 = (mobile ? 128 : 120);
      const b0 = Math.max(80, vh - (tr.top + (tr.height / 3) * .55) + (hr.top < 0 ? 0 : 0));
      const top0 = lerp(vh - b0, t0, r);
      const inTop = lerp(top0, 0, t), inX = lerp(x0, 0, t), inB = lerp(b0, 0, t);
      const rad = lerp((vw - 2 * x0) / 2, 0, t);
      arch.style.clipPath = `inset(${inTop}px ${inX}px ${inB}px ${inX}px round ${rad}px ${rad}px 0 0)`;
      archImg.style.transform = `scale(${lerp(1.18, 1, Math.max(t, r * .4))})`;
      hshade.style.opacity = t;
      const bs = hbadge.offsetWidth;
      hbadge.style.transform = `translate(${vw - x0 - bs * .78}px, ${top0 + (vw - 2 * x0) * .12}px) rotate(${p * 120}deg)`;
      hbadge.style.opacity = r * (1 - clamp(t * 3));
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

    // Footer : lettres qui jaillissent
    // départ quand le haut du mot entre à l'écran, fin quand on est tout en bas de la page
    const endTop = vh - (fr.bottom - wr.bottom) - wr.height;
    const fp = reduce ? 1 : clamp((vh - wr.top) / Math.max(1, vh - endTop));
    chs.forEach((c, i) => {
      const k = clamp((fp - i * .1) / .55), e = back(k);
      c.style.transform = `translateY(${(1 - e) * 120}%) rotate(${(1 - e) * (i % 2 ? 30 : -30)}deg) scale(${.55 + .45 * e})`;
      c.style.opacity = k > 0 ? 1 : 0;
    });
  }
  addEventListener('scroll', request, { passive: true });
  // Panneaux midi/soir plus hauts que l'écran : ils collent seulement une fois leur bas atteint
  const stick = () => $$('.svc .panel').forEach(p => { p.style.top = Math.min(0, innerHeight - p.offsetHeight) + 'px'; });
  addEventListener('resize', () => { fit(); stick(); request(); rail(); });
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
