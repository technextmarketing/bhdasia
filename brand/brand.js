(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* reveal on scroll */
  var rv = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* chapter spy */
  var links = $$('#railList a');
  var secs = links.map(function (a) { return $(a.getAttribute('href')); });
  var cur = $('#cur'), wordEls = $$('.rail-line i');
  function setActive(i) {
    links.forEach(function (a, k) { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if (cur) cur.textContent = links[i].textContent.replace(/^[IVX]+/, '');
    var a = links[i]; var list = $('#railList');
    if (a && list && list.scrollHeight > list.clientHeight) {
      var t = a.offsetTop - list.clientHeight / 2 + a.offsetHeight / 2;
      list.scrollTo({ top: t, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function onScroll() {
    var y = window.scrollY + window.innerHeight * 0.35, idx = 0;
    secs.forEach(function (s, k) { if (s && s.offsetTop <= y) idx = k; });
    setActive(idx);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    $('#prog').style.width = (p * 100).toFixed(1) + '%';
    var w = Math.min(2, Math.floor(p * 3));
    wordEls.forEach(function (e, k) { e.classList.toggle('on', k <= w && p > 0.02); });
  }
  var tick = false;
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; onScroll(); }); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* mobile menu */
  var rail = $('#rail'), mb = $('#menuBtn');
  function closeMenu() { rail.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); }
  if (mb) {
    mb.addEventListener('click', function () {
      var o = rail.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    links.forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* count-up */
  $$('[data-count]').forEach(function (el) {
    var to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '';
    function fmt(n) { return Math.round(n).toLocaleString('en-GB') + suf; }
    if (reduce || !('IntersectionObserver' in window)) { el.textContent = fmt(to); return; }
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; o.disconnect();
      var t0 = performance.now(), d = 1400;
      (function step(t) {
        var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * e);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* WCAG contrast, computed live */
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function L(h) { h = h.replace('#', ''); var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
  function ratio(a, b) { var x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  $$('.ctr-card').forEach(function (c) {
    var r = ratio(c.dataset.fg, c.dataset.bg), b = $('.badge', c);
    $('.ratio', c).textContent = r.toFixed(2) + ' : 1';
    if (r >= 7) { b.textContent = 'AAA'; b.className = 'badge aaa'; }
    else if (r >= 4.5) { b.textContent = 'AA'; b.className = 'badge aa'; }
    else if (r >= 3) { b.textContent = 'Large text only'; b.className = 'badge aa'; }
    else { b.textContent = 'Never as text'; b.className = 'badge fail'; }
  });

  /* copy HEX */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy'), old = b.textContent;
      function done() { b.textContent = 'Copied'; setTimeout(function () { b.textContent = old; }, 1400); }
      try { navigator.clipboard.writeText(v).then(done, done); } catch (e) { done(); }
    });
  });

  /* photo filter */
  var fb = $$('.filters button'), figs = $$('#pgrid .ph');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      fb.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      figs.forEach(function (p) { p.hidden = !(f === 'all' || p.getAttribute('data-cat') === f); });
    });
  });

  /* bloom from the pointer */
  $$('.bhd-btn').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      b.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* motion demo */
  var tracks = $$('#moGrid .track');
  function play() {
    tracks.forEach(function (t) { t.classList.remove('go'); });
    var dots = $$('#moGrid .dot');
    dots[1].style.transform = 'scale(.4)';
    setTimeout(function () {
      tracks.forEach(function (t) { t.classList.add('go'); });
      dots[1].style.transform = 'scale(1.2)';
    }, 60);
  }
  var rp = $('#replay');
  if (rp) rp.addEventListener('click', play);
  if (tracks.length) {
    var mo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { play(); mo.disconnect(); } }, { threshold: 0.4 });
    mo.observe($('#moGrid'));
  }
})();
