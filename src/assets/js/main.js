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

  /* Header: solid navy at the top, frosted navy glass once the page moves. */
  function header() {
    var head = document.querySelector('[data-head]');
    if (!head) return;
    var paint = function () { head.classList.toggle('is-solid', window.scrollY > 24); };
    window.addEventListener('scroll', paint, { passive: true });
    paint();
  }

  /* Scroll reveals that can never leave a section blank (as on R&R). Nothing
     is hidden at load, so screenshots, print and slow devices see the whole
     page. On the first scroll, only items still below the fold are marked;
     each is unmarked as it arrives. */
  function reveals() {
    if (reduced || typeof IntersectionObserver === 'undefined') return;
    var items = [];
    $$('[data-rail]').forEach(function (rail) { items.push([rail, 0]); });
    $$('[data-col]').forEach(function (col) {
      var kids = [];
      Array.prototype.forEach.call(col.children, function (child) {
        var cs = getComputedStyle(child);
        var isTrack = (cs.display === 'grid' || cs.display === 'flex') && child.children.length > 1 && !child.hasAttribute('data-arms');
        if (isTrack) Array.prototype.forEach.call(child.children, function (g) { kids.push(g); });
        else kids.push(child);
      });
      kids.forEach(function (el, i) { items.push([el, (i % 4) * 120]); });
    });
    if (!items.length) return;
    // Items appear once they are a fifth of the way up the screen, where the
    // eye is, and hide again only when fully below it, so they replay each
    // time the visitor scrolls back down.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.remove('pre'); });
    }, { rootMargin: '0px 0px -20% 0px' });
    var gone = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting && e.boundingClientRect.top > 0) e.target.classList.add('pre');
      });
    });
    var arm = function () {
      window.removeEventListener('scroll', arm);
      var fold = window.innerHeight;
      items.forEach(function (it) {
        var el = it[0];
        if (el.getBoundingClientRect().top < fold) return;
        el.style.setProperty('--d', it[1] + 'ms');
        el.classList.add('rev', 'pre');
        io.observe(el);
        gone.observe(el);
      });
    };
    window.addEventListener('scroll', arm, { passive: true });
  }

  /* Section numbers roll from the previous number to their own (01 -> 02)
     as the section comes up the screen, and reset once fully below it so
     the roll replays. Numbers already on screen at load stay put. */
  function numbers() {
    if (reduced || typeof IntersectionObserver === 'undefined') return;
    var nums = $$('.secnum').filter(function (el) {
      var txt = el.textContent.trim();
      var n = parseInt(txt, 10);
      if (isNaN(n)) return false;
      var prev = String(Math.max(n - 1, 0));
      while (prev.length < txt.length) prev = '0' + prev;
      var roll = document.createElement('span');
      roll.className = 'secnum-roll';
      roll.setAttribute('aria-hidden', 'true');
      roll.innerHTML = '<span class="secnum-track"><span>' + prev + '</span><span>' + txt + '</span></span>';
      el.appendChild(roll);
      el.classList.add('has-roll', 'is-rolled');
      return true;
    });
    if (!nums.length) return;
    var hide = function (el) { el.classList.add('is-reset'); el.classList.remove('is-rolled'); };
    var arm = function () {
      window.removeEventListener('scroll', arm);
      var fold = window.innerHeight;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('is-reset'); e.target.classList.add('is-rolled'); } });
      }, { rootMargin: '0px 0px -20% 0px' });
      var gone = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (!e.isIntersecting && e.boundingClientRect.top > 0) hide(e.target); });
      });
      nums.forEach(function (el) {
        if (el.getBoundingClientRect().top >= fold) hide(el);
        io.observe(el);
        gone.observe(el);
      });
    };
    window.addEventListener('scroll', arm, { passive: true });
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

  /* Header scroll progress: the gold line fills as the page scrolls. */
  function scrollProgress() {
    var bar = document.querySelector('[data-progress]');
    if (!bar) return;
    var queued = false;
    var paint = function () {
      queued = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ')';
    };
    var onScroll = function () { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    paint();
  }

  /* One-shot entrances: the dark-band rule draws across, the 06 bullet squares
     pop in. Drawn by default; like the reveals, only what is still below the
     fold on the first scroll waits to animate. */
  function entrances() {
    if (reduced || typeof IntersectionObserver === 'undefined') return;
    var els = $$('[data-draw], [data-pop]');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.remove('is-waiting');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    var arm = function () {
      window.removeEventListener('scroll', arm);
      var fold = window.innerHeight;
      els.forEach(function (el) {
        if (el.getBoundingClientRect().top < fold) return;
        el.classList.add('is-waiting');
        io.observe(el);
      });
    };
    window.addEventListener('scroll', arm, { passive: true });
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

  header();
  navSpy();
  scrollProgress();
  entrances();
  reveals();
  numbers();
  arms();
  timeline();
  investorForm();
})();
