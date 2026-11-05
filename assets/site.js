// Theme toggle shared by all pages. The early <head> snippet applies the
// saved theme before paint; this wires up the button.
(function () {
  var root = document.documentElement;
  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });
})();

// Shared helpers for the article library (articles.json).
window.Lib = (function () {
  var ORDER = ['AI', '认知', '职场', '媒介', '游戏', '文学', '数学'];
  var GLYPH = { 'AI': '智', '认知': '心', '职场': '世', '媒介': '媒', '游戏': '戏', '文学': '文', '数学': '数' };
  var DESC = {
    'AI': '大模型、学习与认知的边界，以及技术如何重新定义“人”。',
    '认知': '心理防御、学习与智力、亲密关系里的困惑与自我觉察。',
    '职场': '上班、自由职业、消费主义与贫穷的处境。',
    '媒介': '黑话、短视频、网络暴力与体育资本背后的媒介机制。',
    '游戏': '任天堂与宝可梦的工业史，以及游戏里的欲望与商业。',
    '文学': '轻小说、文本细读，和关于阅读本身的思考。',
    '数学': '积和式专著：定义、性质、计算方法与经典问题，附分层练习与详解。'
  };
  function catName(c) { return String(c || '未分类').replace(/^[^\p{L}\p{N}]+/u, '').trim(); }
  function catKey(c) {
    var n = catName(c);
    for (var i = 0; i < ORDER.length; i++) if (n.indexOf(ORDER[i]) >= 0) return ORDER[i];
    return n;
  }
  function catRank(c) { var i = ORDER.indexOf(catKey(c)); return i < 0 ? 99 : i; }
  function catDesc(c) { return DESC[catKey(c)] || ''; }
  function glyph(c) { return GLYPH[catKey(c)] || catName(c).charAt(0); }
  // Four-character names for tight places (tiles, chips) so labels never wrap mid-word.
  var SHORT = { 'AI': '技术哲学', '认知': '认知心理', '职场': '职场社会', '媒介': '媒介批判', '游戏': '游戏工业', '文学': '文学品读', '数学': '数学杂文' };
  function shortName(c) { return SHORT[catKey(c)] || catName(c); }
  function url(a) { return 'article_detail.html?file=' + encodeURIComponent(a.filename); }
  // Where the Markdown file lives: collections carry a repo-relative "path", others sit in articles/.
  function filePath(a) {
    var p = a.path || ('articles/' + a.filename);
    return p.split('/').map(encodeURIComponent).join('/');
  }
  function fileDir(a) { var p = a.path || ('articles/' + a.filename); return p.slice(0, p.lastIndexOf('/') + 1); }
  function wan(n) { return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + ' 万字' : n.toLocaleString() + ' 字'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sort(list) {
    return list.slice().sort(function (a, b) {
      return catRank(a.category) - catRank(b.category)
        || (a.series || '').localeCompare(b.series || '', 'zh')
        || (a.part || 0) - (b.part || 0)
        || a.title.localeCompare(b.title, 'zh');
    });
  }
  function source(a) {
    if (a.kind === '视频文案') return '《' + (a.series || '围炉夜话') + '》视频文案 · ' + (a.author || '');
    if (a.kind === '译文') return '译文 · ' + (a.author || '');
    if (a.kind === '专著章节') return '《' + a.series + '》第 ' + a.part + ' 章';
    if (a.kind) return a.kind;
    return '';
  }
  // Short label for an item inside its series (drops the shared series prefix).
  function partLabel(a) {
    var t = a.title.replace(/^.*?读后感\s*[（(].[)）][：:]?\s*/, '').replace(/^任天堂：世界的主宰\s*[（(].[)）]\s*/, '');
    if (!t) {
      if (a.subtitle) return a.subtitle;
      var first = (a.excerpt || '').replace(/[。！？].*$/, '');
      return first ? (first.length > 24 ? first.slice(0, 24) + '…' : first) : a.title;
    }
    return t + (a.subtitle ? '：' + a.subtitle : '');
  }
  var cache;
  function load() {
    if (!cache) cache = fetch('articles.json').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(sort);
    return cache;
  }
  return { load: load, catName: catName, catKey: catKey, catRank: catRank, catDesc: catDesc, url: url, wan: wan, esc: esc, source: source, sort: sort, partLabel: partLabel, glyph: glyph, shortName: shortName, ORDER: ORDER, filePath: filePath, fileDir: fileDir };
})();

// Header shadow, scroll reveals, shared colophon footer.
(function () {
  var header = document.querySelector('.site-header');
  if (header) {
    var onS = function () { header.classList.toggle('scrolled', scrollY > 8); };
    addEventListener('scroll', onS, { passive: true }); onS();
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  window.reveal = function (root) {
    (root || document).querySelectorAll('.reveal:not(.in)').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('in');
    });
  };
  window.reveal();

  var foot = document.querySelector('[data-colophon]');
  if (foot) {
    var base = foot.getAttribute('data-base') || '';
    var cats = [['智', 'AI与技术哲学'], ['心', '认知心理与成长'], ['世', '职场生存与社会'], ['媒', '媒介批判与互联网'], ['戏', '商业工业与游戏文化'], ['文', '文学品读与随笔'], ['数', '数学杂文']];
    foot.innerHTML =
      '<div class="mega" aria-hidden="true"><span>思辨</span><span class="seal"><i>之</i></span><span>境</span></div>' +
      '<div class="wrap"><div class="colophon">' +
        '<div><p class="motto"><b>沉淀真实的思考，解构复杂的现实。</b><br>一座按主题整理的长文文库，收录随笔长文、论文译文、视频文案与数学专著。</p></div>' +
        '<div><h4>领域</h4><ul>' + cats.slice(0, 4).map(function (c) { return '<li><a href="' + base + 'index.html#cat=' + encodeURIComponent(c[1]) + '">' + c[1] + '</a></li>'; }).join('') + '</ul></div>' +
        '<div><h4>&nbsp;</h4><ul>' + cats.slice(4).map(function (c) { return '<li><a href="' + base + 'index.html#cat=' + encodeURIComponent(c[1]) + '">' + c[1] + '</a></li>'; }).join('') + '</ul></div>' +
        '<div><h4>站点</h4><ul>' +
          '<li><a href="' + base + 'index.html#series">系列</a></li>' +
          '<li><a href="' + base + 'index.html#about">关于</a></li>' +
          '<li><a href="https://github.com/yule1048596-art/yule1048596-art.github.io">GitHub</a></li>' +
        '</ul></div>' +
      '</div><div class="footer-base"><span>© 2026 YULE · 思辨之境</span><span>原创内容 CC BY-NC-SA 4.0 · 整理与翻译内容版权归原作者</span></div></div>';
  }
})();

// Mobile menu + back-to-top seal.
(function () {
  var header = document.querySelector('.site-header');
  var nav = header && header.querySelector('.nav');
  if (nav) {
    var links = nav.querySelectorAll('a');
    var panel = document.createElement('nav');
    panel.className = 'mnav'; panel.setAttribute('aria-label', '移动端导航'); panel.id = 'mnav';
    links.forEach(function (a) { var c = a.cloneNode(true); c.removeAttribute('class'); panel.appendChild(c); });
    header.appendChild(panel);
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'icon-btn menu-btn'; btn.setAttribute('aria-label', '打开菜单');
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'mnav');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8h16M4 16h16"/></svg>';
    nav.appendChild(btn);
    var close = function () { header.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  var top = document.createElement('button');
  top.type = 'button'; top.className = 'to-top'; top.setAttribute('aria-label', '回到顶部');
  top.innerHTML = '<span>↑</span><small>顶</small>';
  top.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });
  document.body.appendChild(top);
  var onS = function () { top.classList.toggle('show', scrollY > 900); };
  addEventListener('scroll', onS, { passive: true }); onS();
})();

// Highlight the nav link of the section in view (homepage anchors only).
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"], .mnav a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var ids = {};
  links.forEach(function (a) { ids[a.getAttribute('href').slice(1)] = true; });
  var visible = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
    var current = Object.keys(ids).filter(function (id) { return visible[id]; }).pop() || '';
    links.forEach(function (a) { a.classList.toggle('active', !!current && a.getAttribute('href') === '#' + current); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(ids).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
})();
