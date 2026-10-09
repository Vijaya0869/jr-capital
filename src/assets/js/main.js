/* JR Capital — page behaviour. Every block guards on its own markup, so this
   file is safe to load on any page. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* Nav: mark the link for the section currently under the header. */
  function navSpy() {
    var links = $$('[data-nav]');
    if (!links.length) return;
    var ids = $$('section[id]').map(function (s) { return s.id; });
    var current = null;
    var onScroll = function () {
      var active = null;
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) active = id;
      });
      // Sections without a nav link keep the last linked one highlighted.
      if (active && !links.some(function (a) { return a.dataset.nav === active; })) {
        for (var i = ids.indexOf(active); i >= 0; i--) {
          if (links.some(function (a) { return a.dataset.nav === ids[i]; })) { active = ids[i]; break; }
          if (i === 0) active = null;
        }
      }
      if (active === current) return;
      current = active;
      links.forEach(function (a) {
        if (a.dataset.nav === active) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Hero entrance (GSAP). Waits briefly for the deferred CDN script. */
  function heroIntro(tries) {
    if (reduced || !document.querySelector('[data-hero]')) return;
    var gsap = window.gsap;
    if (!gsap) {
      if ((tries || 0) < 30) setTimeout(function () { heroIntro((tries || 0) + 1); }, 100);
      return;
    }
    gsap.timeline({ delay: 0.3, defaults: { ease: 'power2.out', duration: 0.8 } })
      .from('[data-hero="kicker"]', { opacity: 0, y: 8 })
      .from('[data-hero="head"]', { opacity: 0, y: 28 }, '-=0.62')
      .from('[data-hero="rule"]', { scaleX: 0, duration: 0.52 }, '-=0.58')
      .from('[data-hero="lede"]', { opacity: 0, y: 8 }, '-=0.46')
      .from('[data-hero="actions"]', { opacity: 0, y: 8 }, '-=0.66')
      .from('[data-hero="plate"]', { opacity: 0, y: 28 }, '-=0.72');
  }

  /* Scroll reveals: CSS owns the motion, an IntersectionObserver owns the
     state. Markup is visible by default; only [data-reveal] dims, so a failed
     script can never leave the page blank. */
  function reveals() {
    if (reduced || typeof IntersectionObserver === 'undefined') return;
    var targets = [];
    $$('[data-rail]').forEach(function (rail) { targets.push([rail, 'block', 0]); });
    $$('[data-col]').forEach(function (col) {
      var kids = [];
      Array.prototype.forEach.call(col.children, function (child) {
        var cs = getComputedStyle(child);
        var isTrack = (cs.display === 'grid' || cs.display === 'flex') && child.children.length > 1;
        if (isTrack) Array.prototype.forEach.call(child.children, function (g) { kids.push(g); });
        else kids.push(child);
      });
      kids.forEach(function (el, i) {
        targets.push([el, el.matches('h2, h3, h4, p, blockquote') ? 'text' : 'block', (i % 4) * 0.07]);
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('is-in');
        else if (e.boundingClientRect.top > 0) e.target.classList.remove('is-in');
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    targets.forEach(function (t) {
      var el = t[0];
      el.setAttribute('data-reveal', t[1] === 'text' ? 'text' : '');
      el.style.transitionDelay = t[2] && !el.hasAttribute('data-arm') ? t[2] + 's' : '';
      io.observe(el);
    });
  }

  /* Platform arms: hover/focus/arrow-key navigation, auto-advance that
     yields to the visitor. */
  function arms() {
    var wrap = document.querySelector('[data-arms]');
    if (!wrap) return;
    var list = $$('[data-arm]', wrap);
    if (!list.length) return;
    var active = 0, held = false;
    var go = function (i) {
      active = (i + list.length) % list.length;
      list.forEach(function (a, n) {
        a.classList.toggle('is-active', n === active);
        a.classList.toggle('is-passed', n < active);
      });
    };
    go(0);
    list.forEach(function (a, i) {
      a.addEventListener('click', function () { held = true; go(i); });
      a.addEventListener('mouseenter', function () { held = true; go(i); });
      a.addEventListener('focus', function () { held = true; go(i); });
      a.addEventListener('mouseleave', function () { held = false; });
    });
    wrap.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      held = true; go(active + d); list[active].focus(); e.preventDefault();
    });
    if (!reduced) setInterval(function () { if (!held) go(active + 1); }, 4000);
  }

  /* "How it works" timeline: the gold rail fills as steps scroll past. */
  function timeline() {
    var tl = document.querySelector('[data-tl]');
    if (!tl) return;
    var steps = $$('[data-tl-step]', tl);
    var fill = tl.querySelector('[data-tl-fill]');
    if (!steps.length) return;
    var index = -1, target = 0, eased = 0, locked = false;
    var paint = function () { if (fill) fill.style.height = (eased * 100).toFixed(2) + '%'; };
    var show = function (i, preview) {
      if (i === index && preview !== true) return;
      index = i;
      steps.forEach(function (st, n) {
        st.classList.toggle('is-on', n === i);
        st.classList.toggle('is-past', n < i);
      });
      target = steps.length > 1 ? i / (steps.length - 1) : 1;
      paint();
    };
    var onScroll = function () {
      if (locked) {
        var box = tl.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) locked = false;
        else return;
      }
      var mark = window.innerHeight * 0.66, i = -1;
      steps.forEach(function (st, n) { if (st.getBoundingClientRect().top < mark) i = n; });
      if (i >= 0) show(i);
    };
    var tick = function () {
      eased += (target - eased) * 0.085;
      if (Math.abs(target - eased) < 0.0004) eased = target;
      paint();
      requestAnimationFrame(tick);
    };
    steps.forEach(function (step, i) {
      step.addEventListener('mouseenter', function () { if (!reduced) show(i, true); });
      step.addEventListener('focus', function () { show(i, true); });
      step.addEventListener('click', function () { locked = true; show(i); });
      step.addEventListener('keydown', function (e) {
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        steps[(i + d + steps.length) % steps.length].focus();
      });
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    show(0);
    onScroll();
    eased = reduced ? 1 : target;
    paint();
    if (!reduced) requestAnimationFrame(tick);
  }

  /* Investor list: posts to Netlify Forms without leaving the page. */
  function investorForm() {
    var form = document.querySelector('[data-investor-form]');
    if (!form) return;
    var status = form.querySelector('[data-status]');
    var button = form.querySelector('[data-submit]');
    var email = form.dataset.email;
    var say = function (msg, ok) {
      status.textContent = msg;
      status.classList.add('is-shown');
      status.classList.toggle('is-ok', !!ok);
      status.classList.toggle('is-bad', !ok);
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var g = function (k) { return (data.get(k) || '').toString().trim(); };
      data.set('subject', 'Investor list — ' + g('first') + ' ' + g('last'));
      var label = button.innerHTML;
      button.disabled = true;
      button.textContent = 'Sending…';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.classList.add('is-sent');
        say(form.dataset.success || 'Thank you. You are on the list.', true);
      }).catch(function () {
        button.disabled = false;
        button.innerHTML = label;
        say('That did not send. Try again, or email ' + email + '.', false);
      });
    });
  }

  navSpy();
  heroIntro();
  reveals();
  arms();
  timeline();
  investorForm();
})();
