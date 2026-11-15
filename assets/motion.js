// Homepage motion: staggered reveals, split-character headings, count-up stats,
// and scroll-linked ("scrubbed") effects driven by CSS custom properties.
// Everything here is decoration: with reduced motion (or if this file fails to
// load) the page is fully visible and static.
window.Motion = (function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FX = !reduce;
  if (FX) root.classList.add('fx');

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var OPEN = '“‘（《「『【';
  var CLOSE = '，。？！、；：”’）》」』】…—';

  // Split text into per-character spans. Punctuation stays glued to its neighbour
  // so line-breaking rules (no line starting with "。") still hold.
  function split(el, stepMs) {
    if (!el || el.dataset.split) return;
    var text = el.textContent;
    el.dataset.split = '1';
    if (!FX) return;
    var tokens = [], buf = '';
    for (var k = 0; k < text.length; k++) {
      var c = text[k];
      if (c === ' ') { if (buf) tokens.push(buf); tokens.push(' '); buf = ''; continue; }
      var latin = /[A-Za-z0-9'’\-]/.test(c);
      if (CLOSE.indexOf(c) >= 0) { buf += c; continue; }
      if (buf && !(OPEN.indexOf(buf[buf.length - 1]) >= 0) && !(latin && /[A-Za-z0-9'’\-]$/.test(buf))) { tokens.push(buf); buf = ''; }
      buf += c;
    }
    if (buf) tokens.push(buf);
    var wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    var n = 0;
    tokens.forEach(function (t) {
      if (t === ' ') { wrap.appendChild(document.createTextNode(' ')); return; }
      var s = document.createElement('span');
      s.className = 'ch'; s.textContent = t;
      s.style.setProperty('--i', n++);
      if (stepMs) s.style.setProperty('--step', stepMs + 'ms');
      wrap.appendChild(s);
    });
    // Screen readers get the plain sentence; the per-character spans are visual only.
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    el.textContent = '';
    el.appendChild(sr);
    el.appendChild(wrap);
  }

  function tag(sel, fx, cap) {
    var groups = new Map();
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.dataset.fx) return;
      var p = el.parentNode, i = groups.get(p) || 0;
      groups.set(p, i + 1);
      el.dataset.fx = fx;
      el.classList.add('reveal');
      el.style.setProperty('--i', cap ? Math.min(i, cap) : i);
    });
  }

  function countUp(el) {
    if (el.dataset.counted) return;
    var m = el.textContent.match(/^(\d+)(.*)$/);
    if (!m) return;
    el.dataset.counted = '1';
    if (!FX) return;
    var target = +m[1], tail = m[2], t0 = 0, dur = 1300;
    el.textContent = '0' + tail;
    var step = function (now) {
      if (!t0) t0 = now + 450;
      var p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + tail;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---- scroll-linked state ----
  var S = { panels: [], heroCard: null, nos: [], covers: [], quotes: null, ticker: null, footer: null, mega: null, sections: [] };
  var cache = new WeakMap();
  function setVar(el, name, v) {
    var c = cache.get(el); if (!c) cache.set(el, c = {});
    if (c[name] === v) return;
    c[name] = v; el.style.setProperty(name, v);
  }

  function collect() {
    S.panels = [].slice.call(document.querySelectorAll('main .panel:not(.hero-card)'));
    S.heroCard = document.querySelector('.hero-card');
    S.nos = [].slice.call(document.querySelectorAll('.section-head h2'));
    S.covers = [].slice.call(document.querySelectorAll('.series-card'));
    S.quotes = document.querySelector('.quotes');
    S.ticker = document.querySelector('.ticker');
    S.footer = document.querySelector('.site-footer');
    S.mega = document.querySelector('.mega');
  }

  var bar = document.getElementById('progress');
  var rail = null, lastY = scrollY, calm = 0, ticking = false;

  function frame() {
    ticking = false;
    var vh = innerHeight, y = scrollY;
    var max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.width = (max > 0 ? clamp(y / max, 0, 1) * 100 : 0) + '%';

    if (rail) {
      var cur = 0;
      S.sections.forEach(function (s, i) { if (s.el.getBoundingClientRect().top < vh * 0.5) cur = i; });
      S.sections.forEach(function (s, i) { s.link.classList.toggle('on', i === cur); });
    }
    if (!FX) return;

    S.panels.forEach(function (p) {
      var top = p.parentNode.getBoundingClientRect().top;
      setVar(p, '--e', clamp((vh - top) / (vh * 0.42), 0, 1).toFixed(3));
    });
    if (S.heroCard) setVar(S.heroCard, '--x', clamp(y / (S.heroCard.offsetHeight * 0.9), 0, 1).toFixed(3));
    var mid = function (el) { var r = el.getBoundingClientRect(); return clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1).toFixed(3); };
    S.nos.forEach(function (h) { setVar(h, '--p', mid(h.parentNode)); });
    S.covers.forEach(function (c) { setVar(c, '--p', mid(c.parentNode)); });
    if (S.quotes) setVar(S.quotes, '--p', mid(S.quotes));
    if (S.mega && S.footer) {
      var ft = S.footer.getBoundingClientRect().top;
      setVar(S.mega, '--e', clamp((vh - ft) / (S.mega.offsetHeight * 1.25), 0, 1).toFixed(3));
    }
    if (S.ticker) {
      var v = y - lastY;
      setVar(S.ticker, '--skew', clamp(-v * 0.35, -16, 16).toFixed(1) + 'deg');
      clearTimeout(calm);
      calm = setTimeout(function () { setVar(S.ticker, '--skew', '0deg'); }, 140);
    }
    lastY = y;
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });

  function buildRail() {
    var defs = [['top', '首页'], ['featured', '01 精选'], ['series', '02 系列'], ['quotes', '03 摘句'], ['archive', '04 文库'], ['about', '关于']];
    rail = document.createElement('nav');
    rail.className = 'rail'; rail.setAttribute('aria-label', '页面进度');
    defs.forEach(function (d) {
      var el = document.getElementById(d[0]); if (!el) return;
      var a = document.createElement('a');
      a.href = '#' + d[0]; a.innerHTML = '<span>' + d[1] + '</span><i></i>';
      a.addEventListener('click', function (e) { e.preventDefault(); el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
      rail.appendChild(a);
      S.sections.push({ el: el, link: a });
    });
    document.body.appendChild(rail);
  }

  // Called after the page (re)renders its dynamic parts.
  function refresh() {
    document.querySelectorAll('.section-head h2').forEach(function (h) {
      if (h.dataset.fx) return;
      h.dataset.fx = 'chars'; h.classList.add('reveal');
      var last = h.lastChild;
      if (last && last.nodeType === 3 && last.textContent.trim()) {
        var holder = document.createElement('span'); holder.className = 'h-text';
        holder.textContent = last.textContent; h.replaceChild(holder, last);
        split(holder, 60);
      }
    });
    tag('#featured-box .lead', 'wipe');
    tag('#featured-box .pick', 'right');
    document.querySelectorAll('.series-card').forEach(function (c, i) { if (!c.dataset.fx) { c.dataset.fx = 'deal'; c.style.setProperty('--i', i); c.style.setProperty('--r', (i % 2 ? -7 : 7) + 'deg'); } });
    tag('#list .group-head', 'head');
    tag('#list .archive > .row', 'left', 7);
    tag('.about > *', 'rise');
    document.querySelectorAll('.domain-strip li').forEach(function (li, i) { li.style.setProperty('--i', i); });
    document.querySelectorAll('.stat b').forEach(countUp);
    if (!rail) buildRail();
    collect();
    if (window.reveal) window.reveal();
    onScroll();
  }

  return { refresh: refresh, split: split };
})();
