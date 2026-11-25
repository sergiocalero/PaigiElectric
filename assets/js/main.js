/* Paigi Electric — JS sin dependencias */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  /* ---------- Menú móvil ---------- */
  var btn = $('.menu-btn'), nav = $('.nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- Menú: marcar la sección de la página de inicio que se está viendo ---------- */
  var secLinks = [];
  $$('.nav a').forEach(function (a) {
    // "#servicios" -> id servicios; "cargadores.html" -> id cargadores (si esa sección existe en esta página)
    var h = a.getAttribute('href') || '', id = h.charAt(0) === '#' ? h.slice(1) : h.replace(/\.html$/, '');
    var sec = id && !/[\/?#.]/.test(id) ? d.getElementById(id) : null;
    if (sec) secLinks.push({ a: a, sec: sec });
  });
  if (secLinks.length) {
    var activeLink = null, ticking = false;
    function mark(link) {
      if (link === activeLink) return;
      activeLink = link;
      secLinks.forEach(function (o) {
        if (o.a === link) o.a.setAttribute('aria-current', 'location'); else o.a.removeAttribute('aria-current');
      });
    }
    function spy() {
      ticking = false;
      var found = null, line = 120; // por debajo de la cabecera fija
      secLinks.forEach(function (o) {
        var r = o.sec.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) found = o.a;
      });
      // al llegar al final de la página, la última sección (Contacto) aunque no alcance la línea
      if (window.innerHeight + window.pageYOffset >= d.documentElement.scrollHeight - 4) found = secLinks[secLinks.length - 1].a;
      mark(found);
    }
    function queue() { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    secLinks.forEach(function (o) { o.a.addEventListener('click', function () { mark(o.a); }); });
    spy();
  }

  /* ---------- Internacionalización ---------- */
  var LANGS = ['es', 'ca', 'en', 'de', 'fr'];
  var dict = window.I18N || {};

  // Idioma preferido del navegador entre los disponibles (si no hay ninguno: inglés)
  function fromBrowser() {
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : (navigator.language ? [navigator.language] : []);
    for (var i = 0; i < list.length; i++) {
      var c = String(list[i]).toLowerCase().split('-')[0];
      if (LANGS.indexOf(c) > -1) return c;
    }
    return list.length ? 'en' : 'es'; // idioma no disponible: inglés como lengua franca
  }
  // La elección manual del selector solo se respeta mientras el idioma del navegador sea el mismo
  // con el que se hizo; si el visitante cambia el idioma de su navegador, la web lo sigue.
  function detect() {
    var auto = fromBrowser(), saved = store('lang');
    if (saved && LANGS.indexOf(saved) > -1 && store('langAuto') === auto) return saved;
    return auto;
  }

  function apply(lang) {
    var t = dict[lang] || {};
    root.lang = lang;
    $$('[data-i18n]').forEach(function (el) {
      if (el.__es === undefined) el.__es = el.innerHTML;
      var v = lang === 'es' ? undefined : t[el.getAttribute('data-i18n')];
      el.innerHTML = v !== undefined ? v : el.__es;
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.__esAttr = el.__esAttr || {};
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var p = pair.split(':'), a = p[0].trim(), k = p[1].trim();
        if (el.__esAttr[a] === undefined) el.__esAttr[a] = el.getAttribute(a);
        var v = lang === 'es' ? undefined : t[k];
        el.setAttribute(a, v !== undefined ? v : el.__esAttr[a]);
      });
    });
    var more = $('.cookie-more');
    if (more) more.href = 'https://policies.google.com/technologies/cookies?hl=' + lang;
    var sel = $('#lang');
    if (sel && sel.value !== lang) sel.value = lang;
  }

  var current = detect();
  var sel = $('#lang');
  if (sel) sel.addEventListener('change', function () { current = sel.value; store('lang', current); store('langAuto', fromBrowser()); apply(current); });
  apply(current);
  window.addEventListener('languagechange', function () { current = detect(); apply(current); });

  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Cookies y Google Tag Manager (solo tras consentimiento) ---------- */
  var GTM = 'GTM-WM8959N';
  function loadGTM() {
    if (window.__gtmLoaded) return;
    window.__gtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = d.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM;
    d.head.appendChild(s);
  }
  var banner = $('#cookie-banner');
  var consent = store('cookieConsent'); // 'true' = aceptado (compatible con la versión anterior), 'false' = rechazado
  if (consent === 'true') loadGTM();
  else if (consent !== 'false' && banner) banner.hidden = false;

  function decide(accepted) {
    var was = store('cookieConsent') === 'true';
    store('cookieConsent', accepted ? 'true' : 'false');
    if (banner) banner.hidden = true;
    if (accepted) loadGTM();
    else if (was) location.reload(); // retira el script ya cargado
  }
  var ok = $('#cookie-accept'), no = $('#cookie-reject'), reopen = $('#cookie-open');
  if (ok) ok.addEventListener('click', function () { decide(true); });
  if (no) no.addEventListener('click', function () { decide(false); });
  if (reopen) reopen.addEventListener('click', function () { if (banner) banner.hidden = false; });

  /* ---------- Visor de imágenes (con gestos táctiles) ---------- */
  var lb = $('#lightbox');
  var items = $$('[data-full]');
  if (lb && items.length && typeof lb.showModal === 'function') {
    var img = $('img', lb), cap = $('.lb-cap', lb), stage = $('.lb-inner', lb);
    var prevBtn = $('.lb-prev', lb), nextBtn = $('.lb-next', lb);
    var idx = 0, busy = false, swiped = false;

    // Fotos distintas: dos productos pueden compartir la misma imagen
    var srcs = [], groups = {};
    items.forEach(function (it) {
      var u = it.getAttribute('data-full');
      if (!groups[u]) { groups[u] = []; srcs.push(u); }
      groups[u].push(it);
    });
    function label(it) {
      var id = it.getAttribute('aria-labelledby'), el = id && d.getElementById(id);
      return el ? el.textContent.trim() : '';
    }
    function show(i) {
      idx = (i + srcs.length) % srcs.length;
      var u = srcs[idx], text = groups[u].map(label).filter(Boolean).join(' · ');
      img.src = u; img.alt = text; cap.textContent = text;
      [1, -1].forEach(function (k) { new Image().src = srcs[(idx + k + srcs.length) % srcs.length]; }); // precarga vecinas
    }
    if (srcs.length < 2) { prevBtn.hidden = true; nextBtn.hidden = true; }

    function go(dir) {
      if (busy || srcs.length < 2) return;
      busy = true;
      var w = stage.clientWidth * 0.4;
      img.style.transition = 'transform .15s ease-in, opacity .15s ease-in';
      img.style.transform = 'translateX(' + (-dir * w) + 'px)'; img.style.opacity = '0';
      setTimeout(function () {
        show(idx + dir);
        img.style.transition = 'none'; img.style.transform = 'translateX(' + (dir * w) + 'px)';
        var ready = img.decode ? img.decode().catch(function () {}) : Promise.resolve();
        ready.then(function () {
          void img.offsetWidth;
          img.style.transition = 'transform .2s ease-out, opacity .2s ease-out';
          img.style.transform = ''; img.style.opacity = '';
          setTimeout(function () { busy = false; }, 200);
        });
      }, 150);
    }
    function reset() { img.style.transition = 'transform .2s ease-out'; img.style.transform = ''; img.style.opacity = ''; }

    items.forEach(function (it) {
      it.addEventListener('click', function () { show(srcs.indexOf(it.getAttribute('data-full'))); lb.showModal(); });
    });
    $('.lb-close', lb).addEventListener('click', function () { lb.close(); });
    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });
    lb.addEventListener('click', function (e) {
      if (swiped) return; // el clic que sigue a un arrastre no debe cerrar el visor
      if (e.target === lb || e.target.classList.contains('lb-inner')) lb.close();
    });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });
    lb.addEventListener('close', function () { img.removeAttribute('src'); reset(); busy = false; });

    // Gestos: arrastrar la imagen a izquierda/derecha (táctil, lápiz o ratón)
    var sx = 0, sy = 0, dx = 0, t0 = 0, dragging = false, horizontal = false;
    stage.addEventListener('pointerdown', function (e) {
      if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
      dragging = true; horizontal = false; sx = e.clientX; sy = e.clientY; dx = 0; t0 = Date.now();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dx = e.clientX - sx;
      var dy = e.clientY - sy;
      if (!horizontal) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { dragging = false; return; } // gesto vertical: no es un deslizamiento
        horizontal = true;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      }
      img.style.transition = 'none';
      img.style.transform = 'translateX(' + dx + 'px)';
      img.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / (stage.clientWidth * 0.9)));
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      if (!horizontal) return;
      swiped = true; setTimeout(function () { swiped = false; }, 120);
      var fast = Date.now() - t0 < 260 && Math.abs(dx) > 30;
      if (Math.abs(dx) > Math.max(60, stage.clientWidth * 0.18) || fast) go(dx < 0 ? 1 : -1);
      else reset();
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', function () { if (dragging && horizontal) reset(); dragging = false; });
  }
})();
