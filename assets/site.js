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
  var ORDER = ['AI', '认知', '职场', '媒介', '游戏', '文学'];
  var DESC = {
    'AI': '大模型、学习与认知的边界，以及技术如何重新定义“人”。',
    '认知': '心理防御、学习与智力、亲密关系里的困惑与自我觉察。',
    '职场': '上班、自由职业、消费主义与贫穷的处境。',
    '媒介': '黑话、短视频、网络暴力与体育资本背后的媒介机制。',
    '游戏': '任天堂与宝可梦的工业史，以及游戏里的欲望与商业。',
    '文学': '轻小说、文本细读，和关于阅读本身的思考。'
  };
  function catName(c) { return String(c || '未分类').replace(/^[^\p{L}\p{N}]+/u, '').trim(); }
  function catKey(c) {
    var n = catName(c);
    for (var i = 0; i < ORDER.length; i++) if (n.indexOf(ORDER[i]) === 0) return ORDER[i];
    return n;
  }
  function catRank(c) { var i = ORDER.indexOf(catKey(c)); return i < 0 ? 99 : i; }
  function catDesc(c) { return DESC[catKey(c)] || ''; }
  function url(a) { return 'article_detail.html?file=' + encodeURIComponent(a.filename); }
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
  return { load: load, catName: catName, catKey: catKey, catRank: catRank, catDesc: catDesc, url: url, wan: wan, esc: esc, source: source, sort: sort, partLabel: partLabel };
})();
