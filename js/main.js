/* ==========================================================================
   HK ZANVIX CO., LIMITED — Global Script  [复用-B]
   The single JavaScript file for the whole site.
   Responsibilities:
     A) Shared site header  [复用-C]
     B) Shared site footer  [复用-D]
     C) SEO configuration + JSON-LD  [复用-F]
     D) IntersectionObserver reveal engine  [复用-G]
     E) SVG sprite loader + mascot replacement  [复用-E]
     F) Navigation, smooth scroll, back-to-top, news filter, form validation
     G) Active navigation state by path
   ========================================================================== */
(function () {
  'use strict';

  /* Mark the document as script-capable so CSS can enable reveal animations
     without hiding content when JavaScript is unavailable. */
  document.documentElement.classList.add('js');

  /* ---------------------------------------------------------------------
     0. CONSTANTS
     --------------------------------------------------------------------- */
  var COMPANY = {
    name: 'HK ZANVIX CO., LIMITED',
    shortName: 'HK ZANVIX',
    address: 'Room 701 (Unit 127), 7/F, Tower B, New Mandarin Plaza, 14 Science Museum Road, Tsim Sha Tsui East, Hong Kong',
    website: 'zhiruntong.com',
    url: 'https://zhiruntong.com/',
    support: 'support@zhiruntong.com',
    accounts: 'qiuwentao@zhiruntong.com',
    scope: 'IT development and consultancy, import/export & wholesale of general goods, business advisory and marketing planning.'
  };

  var SPRITE_URL = 'images/sprite.svg';

  /* `href="./"` is correct on a served site (the web server maps "/" to
     index.html) and keeps index.html out of the public URL. On a plain
     `file://` preview "./" resolves to the *folder* URI and the browser
     renders an OS directory listing instead of the homepage, so the home
     link is switched at runtime. */
  var IS_FILE_PROTOCOL = (window.location.protocol === 'file:');
  var HOME_HREF = IS_FILE_PROTOCOL ? './index.html' : './';

  var NAV_ITEMS = [
    { label: 'Home', href: HOME_HREF, page: 'home' },
    { label: 'Services', href: './services.html', page: 'services' },
    { label: 'Culture', href: './culture.html', page: 'culture' },
    { label: 'News', href: './news.html', page: 'news' },
    { label: 'Contact', href: './contact.html', page: 'contact' }
  ];

  var MASCOT_EMOJI = {
    cat: '🐱', dog: '🐶', fox: '🦊', panda: '🐼', rabbit: '🐰',
    bear: '🐻', owl: '🦉', penguin: '🐧', smile: '😊', 'heart-eyes': '😍',
    wink: '😉', 'thumbs-up': '👍', party: '🎉', 'rocket-cat': '🚀'
  };

  /* ---------------------------------------------------------------------
     C. SEO CONFIGURATION  [复用-F]
     --------------------------------------------------------------------- */
  var SEO = {
    '/': {
      title: 'HK ZANVIX CO., LIMITED — International Trade, IT Development & Advisory',
      description: 'HK ZANVIX CO., LIMITED delivers IT development and consultancy, import/export & wholesale of general goods, and business advisory & marketing planning — with a mobile management app for Apple and Google Play.',
      canonical: 'https://zhiruntong.com/',
      og: { type: 'website', title: 'HK ZANVIX CO., LIMITED — Trade, Technology & Advisory', description: 'International trade, IT development and consultancy, business advisory and marketing planning, plus a mobile management app for every line of business.', image: 'https://zhiruntong.com/images/hero.png' },
      twitter: { card: 'summary_large_image', title: 'HK ZANVIX CO., LIMITED', description: 'International trade, IT development and consultancy, business advisory and marketing planning.', image: 'https://zhiruntong.com/images/hero.png' }
    },
    '/services.html': {
      title: 'Services — IT Development, Import/Export & Wholesale, Business Advisory | HK ZANVIX',
      description: 'Three business lines, one operating platform: IT development and consultancy, import/export & wholesale of general goods, and business advisory & marketing planning — managed through the HK ZANVIX mobile app.',
      canonical: 'https://zhiruntong.com/services.html',
      og: { type: 'website', title: 'Services | HK ZANVIX CO., LIMITED', description: 'IT development and consultancy, import/export & wholesale of general goods, business advisory and marketing planning.', image: 'https://zhiruntong.com/images/hero.png' },
      twitter: { card: 'summary_large_image', title: 'Services | HK ZANVIX CO., LIMITED', description: 'Three business lines managed through one mobile platform.', image: 'https://zhiruntong.com/images/hero.png' }
    },
    '/culture.html': {
      title: 'Our Culture & Milestones | HK ZANVIX CO., LIMITED',
      description: 'The mission, vision and values behind HK ZANVIX CO., LIMITED, our company milestones, team spirit and global compliance approach.',
      canonical: 'https://zhiruntong.com/culture.html',
      og: { type: 'website', title: 'Our Culture | HK ZANVIX CO., LIMITED', description: 'Mission, vision, values and the story of HK ZANVIX CO., LIMITED.', image: 'https://zhiruntong.com/images/hero.png' },
      twitter: { card: 'summary_large_image', title: 'Our Culture | HK ZANVIX CO., LIMITED', description: 'Mission, vision, values and company milestones.', image: 'https://zhiruntong.com/images/hero.png' }
    },
    '/news.html': {
      title: 'News & Insights | HK ZANVIX CO., LIMITED',
      description: 'Company announcements, trade insights, technology updates and partnership news from HK ZANVIX CO., LIMITED.',
      canonical: 'https://zhiruntong.com/news.html',
      og: { type: 'website', title: 'News & Insights | HK ZANVIX CO., LIMITED', description: 'Announcements, trade insights and technology updates.', image: 'https://zhiruntong.com/images/hero.png' },
      twitter: { card: 'summary_large_image', title: 'News & Insights | HK ZANVIX CO., LIMITED', description: 'Announcements, trade insights and technology updates.', image: 'https://zhiruntong.com/images/hero.png' }
    },
    '/contact.html': {
      title: 'Contact Us — Hong Kong Office | HK ZANVIX CO., LIMITED',
      description: 'Reach HK ZANVIX CO., LIMITED in Tsim Sha Tsui East, Hong Kong. Business support support@zhiruntong.com, key accounts qiuwentao@zhiruntong.com.',
      canonical: 'https://zhiruntong.com/contact.html',
      og: { type: 'website', title: 'Contact Us | HK ZANVIX CO., LIMITED', description: 'Hong Kong office details, business support and key accounts contacts.', image: 'https://zhiruntong.com/images/hero.png' },
      twitter: { card: 'summary_large_image', title: 'Contact Us | HK ZANVIX CO., LIMITED', description: 'Hong Kong office details and contact channels.', image: 'https://zhiruntong.com/images/hero.png' }
    },
    '/privacy.html': {
      title: 'Privacy Policy | HK ZANVIX CO., LIMITED',
      description: 'How HK ZANVIX CO., LIMITED collects, uses, shares and protects personal data across this website and our mobile application, including advertising and analytics practices.',
      canonical: 'https://zhiruntong.com/privacy.html',
      og: { type: 'website', title: 'Privacy Policy | HK ZANVIX CO., LIMITED', description: 'Data collection, use, sharing, advertising practices and regional privacy rights.', image: 'https://zhiruntong.com/images/hero.png' },
      twitter: { card: 'summary_large_image', title: 'Privacy Policy | HK ZANVIX CO., LIMITED', description: 'How we collect, use and protect your personal data.', image: 'https://zhiruntong.com/images/hero.png' }
    },
    '/terms.html': {
      title: 'Terms of Service | HK ZANVIX CO., LIMITED',
      description: 'The terms governing use of the HK ZANVIX website and mobile application, our services, purchases, advertising, intellectual property and dispute resolution under Hong Kong law.',
      canonical: 'https://zhiruntong.com/terms.html',
      og: { type: 'website', title: 'Terms of Service | HK ZANVIX CO., LIMITED', description: 'Terms governing the HK ZANVIX website and mobile application.', image: 'https://zhiruntong.com/images/hero.png' },
      twitter: { card: 'summary_large_image', title: 'Terms of Service | HK ZANVIX CO., LIMITED', description: 'Terms governing the HK ZANVIX website and mobile application.', image: 'https://zhiruntong.com/images/hero.png' }
    }
  };

  function pathKey() {
    var p = window.location.pathname || '/';
    if (p.charAt(0) !== '/') { p = '/' + p; }
    if (p.length > 1 && p.charAt(p.length - 1) === '/') { p = p.slice(0, -1); }
    if (/\/index\.html$/i.test(p)) { p = p.replace(/\/index\.html$/i, ''); }
    if (p === '') { p = '/'; }
    return p;
  }

  function setMeta(attr, key, content) {
    if (!content) { return; }
    var el = document.head.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function applySEO() {
    var cfg = SEO[pathKey()];
    if (!cfg) { return; }
    document.title = cfg.title;
    setMeta('name', 'description', cfg.description);
    setMeta('property', 'og:title', cfg.og.title);
    setMeta('property', 'og:description', cfg.og.description);
    setMeta('property', 'og:url', cfg.canonical);
    setMeta('property', 'og:type', cfg.og.type);
    setMeta('property', 'og:site_name', COMPANY.name);
    setMeta('property', 'og:image', cfg.og.image);
    setMeta('name', 'twitter:card', cfg.twitter.card);
    setMeta('name', 'twitter:title', cfg.twitter.title);
    setMeta('name', 'twitter:description', cfg.twitter.description);
    setMeta('name', 'twitter:image', cfg.twitter.image);
    setMeta('name', 'twitter:site', '@zhiruntong');

    var link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', cfg.canonical);
  }

  function injectJSONLD() {
    if (document.getElementById('jsonld-organization')) { return; }
    var data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: COMPANY.name,
      alternateName: COMPANY.shortName,
      url: COMPANY.url,
      logo: COMPANY.url + 'images/logo.png',
      email: COMPANY.support,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Room 701 (Unit 127), 7/F, Tower B, New Mandarin Plaza, 14 Science Museum Road',
        addressLocality: 'Tsim Sha Tsui East',
        addressRegion: 'Hong Kong',
        addressCountry: 'HK'
      },
      contactPoint: [{
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: COMPANY.support,
        availableLanguage: ['English', 'Chinese']
      }],
      sameAs: [COMPANY.url]
    };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jsonld-organization';
    script.textContent = JSON.stringify(data, null, 2);
    document.head.appendChild(script);
  }

  /* ---------------------------------------------------------------------
     A. SHARED SITE HEADER  [复用-C]
     --------------------------------------------------------------------- */
  function icon(id, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#' + id + '"></use></svg>';
  }

  function brandMarkup(href) {
    return '<a class="brand" href="' + href + '">' +
      '<span class="brand__mark">' + icon('logo') + '</span>' +
      '<span class="brand__text">' +
        '<span class="brand__name">' + COMPANY.shortName + '</span>' +
        '<span class="brand__sub">Trade · Tech · Advisory</span>' +
      '</span>' +
    '</a>';
  }

  function buildHeader() {
    var host = document.getElementById('site-header');
    if (!host) { return null; }

    var nav = '';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      nav += '<a class="nav__link" data-nav="' + NAV_ITEMS[i].page + '" href="' + NAV_ITEMS[i].href + '">' + NAV_ITEMS[i].label + '</a>';
    }

    var html =
      '<header class="site-header">' +
        '<div class="site-header__inner">' +
          brandMarkup(HOME_HREF) +
          '<nav class="nav" id="site-nav" aria-label="Primary navigation">' + nav + '</nav>' +
          '<div class="header__actions">' +
            '<a class="btn btn--primary btn--sm" href="./contact.html">' + icon('arrow-right') + 'Get in touch</a>' +
            '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open navigation menu">' +
              icon('menu', 'icon--menu') + icon('close', 'icon--close') +
            '</button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<div class="nav-scrim" hidden></div>';

    host.outerHTML = html;
    return document.querySelector('.site-header');
  }

  /* ---------------------------------------------------------------------
     B. SHARED SITE FOOTER  [复用-D]
     --------------------------------------------------------------------- */
  function buildFooter() {
    var host = document.getElementById('site-footer');
    if (!host) { return null; }

    var html =
      '<footer class="site-footer">' +
        '<div class="container">' +
          '<div class="site-footer__grid">' +
            '<div>' +
              brandMarkup(HOME_HREF) +
              '<p class="site-footer__about">' + COMPANY.scope + ' — delivered from Hong Kong with a mobile platform that keeps every line of business in one place.</p>' +
            '</div>' +
            '<div>' +
              '<h4 class="site-footer__title">Explore</h4>' +
              '<ul class="site-footer__list">' +
                '<li><a href="' + HOME_HREF + '">Home</a></li>' +
                '<li><a href="./services.html">Services</a></li>' +
                '<li><a href="./culture.html">Culture</a></li>' +
                '<li><a href="./news.html">News</a></li>' +
                '<li><a href="./contact.html">Contact</a></li>' +
              '</ul>' +
            '</div>' +
            '<div>' +
              '<h4 class="site-footer__title">Business lines</h4>' +
              '<ul class="site-footer__list">' +
                '<li><a href="./services.html#it">IT development &amp; consultancy</a></li>' +
                '<li><a href="./services.html#trade">Import/export &amp; wholesale</a></li>' +
                '<li><a href="./services.html#advisory">Business advisory &amp; planning</a></li>' +
                '<li><a href="./services.html#app">Mobile management app</a></li>' +
              '</ul>' +
            '</div>' +
            '<div>' +
              '<h4 class="site-footer__title">Company information</h4>' +
              '<ul class="site-footer__contact">' +
                '<li>' + icon('briefcase') + '<span><strong>Company</strong><br>' + COMPANY.name + '</span></li>' +
                '<li>' + icon('map-pin') + '<span><strong>Office</strong><br>' + COMPANY.address + '</span></li>' +
                '<li>' + icon('globe') + '<span><strong>Website</strong><br><a href="' + COMPANY.url + '" rel="noopener">' + COMPANY.website + '</a></span></li>' +
                '<li>' + icon('mail') + '<span><strong>Business support</strong><br><a href="mailto:' + COMPANY.support + '">' + COMPANY.support + '</a></span></li>' +
                '<li>' + icon('users') + '<span><strong>Key accounts</strong><br><a href="mailto:' + COMPANY.accounts + '">' + COMPANY.accounts + '</a></span></li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
          '<div class="site-footer__bottom">' +
            '<p>&copy; <span data-current-year>' + new Date().getFullYear() + '</span> ' + COMPANY.name + '. All rights reserved.</p>' +
            '<ul class="site-footer__legal">' +
              '<li><a href="./privacy.html">Privacy Policy</a></li>' +
              '<li><a href="./terms.html">Terms of Service</a></li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<span class="mascot mascot--lg site-footer__mascot" data-mascot="rocket-cat" aria-hidden="true"></span>' +
      '</footer>';

    host.outerHTML = html;
    return document.querySelector('.site-footer');
  }

  /* ---------------------------------------------------------------------
     E. SPRITE LOADER + MASCOT REPLACEMENT  [复用-E]
     --------------------------------------------------------------------- */
  function replaceMascots() {
    var nodes = document.querySelectorAll('[data-mascot]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var id = el.getAttribute('data-mascot');
      if (!id) { continue; }
      el.removeAttribute('data-mascot');
      el.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#' + id + '"></use></svg>';
    }
  }

  function applyEmojiFallback() {
    var uses = document.querySelectorAll('use');
    for (var i = 0; i < uses.length; i++) {
      var use = uses[i];
      var ref = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
      var id = ref.replace('#', '');
      var host = use.closest ? use.closest('.mascot') : null;
      var emoji = MASCOT_EMOJI[id];
      if (host) {
        host.classList.add('mascot--emoji');
        host.textContent = emoji || '🐾';
        var w = host.getBoundingClientRect().width || 96;
        host.style.fontSize = Math.round(w * 0.74) + 'px';
      } else if (emoji) {
        var parent = use.parentNode;
        if (parent) { parent.textContent = emoji; }
      }
    }
  }

  function injectSprite(markup) {
    var holder = document.createElement('div');
    holder.innerHTML = markup;
    var svg = holder.querySelector('svg');
    if (!svg) { throw new Error('Sprite markup invalid'); }
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.overflow = 'hidden';
    document.body.insertBefore(svg, document.body.firstChild);
  }

  function loadSpriteText() {
    if (window.fetch) {
      return fetch(SPRITE_URL, { credentials: 'same-origin' })
        .then(function (res) {
          if (!res.ok) { throw new Error('HTTP ' + res.status); }
          return res.text();
        });
    }
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', SPRITE_URL, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) { resolve(xhr.responseText); }
          else { reject(new Error('HTTP ' + xhr.status)); }
        }
      };
      xhr.onerror = function () { reject(new Error('Network error')); };
      xhr.send();
    });
  }

  function loadSprite() {
    return loadSpriteText()
      .then(function (markup) { injectSprite(markup); })
      .catch(function (err) {
        /* Graceful degradation: a plain file:// preview cannot read local
           assets through fetch/XHR. Icons are lost but the layout, the
           wordmark and every mascot stay legible through the emoji
           fallback instead of collapsing to empty boxes. */
        if (window.console && console.warn) {
          console.warn('[HK ZANVIX] Sprite unavailable, using fallback icons.', err);
        }
        applyEmojiFallback();
      });
  }

  /* ---------------------------------------------------------------------
     D. REVEAL ENGINE  [复用-G]
     --------------------------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll('.reveal, .stagger');
    if (!targets.length) { return; }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      for (var i = 0; i < targets.length; i++) { targets[i].classList.add('in'); }
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    for (var j = 0; j < targets.length; j++) { io.observe(targets[j]); }
  }

  /* Animated counters */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) { return; }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var decimals = (String(target).split('.')[1] || '').length;
      if (reduce) { el.textContent = target.toFixed(decimals); return; }
      var start = performance.now();
      var dur = 1400;
      /* Safety net: requestAnimationFrame is throttled in background tabs, so
         guarantee the final value lands even if the loop never completes. */
      setTimeout(function () { el.textContent = target.toFixed(decimals); }, dur + 400);
      (function step(now) {
        var p = Math.min((now - start) / dur, 1);
        if (p >= 1) { el.textContent = target.toFixed(decimals); return; }
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        requestAnimationFrame(step);
      })(start);
    }

    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < nodes.length; i++) { run(nodes[i]); }
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    for (var j = 0; j < nodes.length; j++) { io.observe(nodes[j]); }
  }

  /* ---------------------------------------------------------------------
     F. NAVIGATION, SCROLL, FILTERS, FORMS
     --------------------------------------------------------------------- */
  function initNav(header) {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    var scrim = document.querySelector('.nav-scrim');
    if (!toggle || !nav) { return; }

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      if (scrim) { scrim.classList.toggle('is-open', open); }
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      document.body.classList.toggle('is-locked', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    if (scrim) {
      scrim.addEventListener('click', function () { setOpen(false); });
    }
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) { setOpen(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setOpen(false); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) { setOpen(false); }
    });
  }

  function initActiveNav() {
    var file = (window.location.pathname || '/');
    file = file.substring(file.lastIndexOf('/') + 1).toLowerCase();
    var page = (!file || file === 'index.html') ? 'home' : file.replace(/\.html$/, '');
    var links = document.querySelectorAll('.nav__link[data-nav]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('data-nav') === page) {
        links[i].classList.add('is-active');
        links[i].setAttribute('aria-current', 'page');
      }
    }
  }

  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) { return; }
      var id = link.getAttribute('href');
      if (!id || id === '#') { return; }
      var target = document.querySelector(id);
      if (!target) { return; }
      e.preventDefault();
      var header = document.querySelector('.site-header');
      var offset = header ? header.offsetHeight + 20 : 20;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  }

  function initHeaderScroll(header) {
    if (!header) { return; }
    var last = window.pageYOffset;
    function update() {
      var y = window.pageYOffset;
      header.classList.toggle('is-stuck', y > 8);
      if (y > 320 && y > last + 4) { header.classList.add('is-hidden'); }
      else if (y < last - 4 || y <= 320) { header.classList.remove('is-hidden'); }
      last = y;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = icon('arrow-up');
    document.body.appendChild(btn);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', function () {
      btn.classList.toggle('is-visible', window.pageYOffset > 500);
    }, { passive: true });
  }

  function initFaq() {
    var items = document.querySelectorAll('.faq__item');
    for (var i = 0; i < items.length; i++) {
      (function (item) {
        var q = item.querySelector('.faq__q');
        var a = item.querySelector('.faq__a');
        if (!q || !a) { return; }
        q.addEventListener('click', function () {
          var open = item.classList.toggle('is-open');
          q.setAttribute('aria-expanded', open ? 'true' : 'false');
          a.style.maxHeight = open ? (a.scrollHeight + 40) + 'px' : '0px';
        });
      })(items[i]);
    }
  }

  function initFilters() {
    var filters = document.querySelectorAll('[data-filter]');
    if (!filters.length) { return; }
    var cards = document.querySelectorAll('[data-category]');

    function apply(value) {
      var shown = 0;
      for (var i = 0; i < cards.length; i++) {
        var cat = cards[i].getAttribute('data-category') || '';
        var match = (value === 'all' || cat === value || cat.split(' ').indexOf(value) !== -1);
        cards[i].style.display = match ? '' : 'none';
        if (match) {
          shown++;
          cards[i].classList.remove('in');
          /* restart the reveal transition for the newly shown card */
          void cards[i].offsetWidth;
          cards[i].classList.add('in');
        }
      }
      var empty = document.querySelector('[data-empty-state]');
      if (empty) { empty.hidden = shown > 0; }
      var count = document.querySelector('[data-filter-count]');
      if (count) { count.textContent = shown; }
    }

    for (var j = 0; j < filters.length; j++) {
      filters[j].addEventListener('click', function () {
        for (var k = 0; k < filters.length; k++) {
          filters[k].classList.remove('is-active');
          filters[k].setAttribute('aria-pressed', 'false');
        }
        this.classList.add('is-active');
        this.setAttribute('aria-pressed', 'true');
        apply(this.getAttribute('data-filter'));
      });
    }
  }

  function initForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) { return; }
    var status = form.querySelector('[data-form-status]');

    function fail(field, message) {
      var wrap = field.closest('.field');
      if (!wrap) { return; }
      wrap.classList.add('is-invalid');
      var err = wrap.querySelector('.field__error');
      if (err) { err.textContent = message; }
    }

    function clear(field) {
      var wrap = field.closest('.field');
      if (!wrap) { return; }
      wrap.classList.remove('is-invalid');
      var err = wrap.querySelector('.field__error');
      if (err) { err.textContent = ''; }
    }

    function validate() {
      var ok = true;
      var fields = form.querySelectorAll('input, textarea');
      for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type === 'checkbox') {
          if (field.required && !field.checked) {
            fail(field, 'Please accept the privacy and terms notice to continue.');
            ok = false;
          } else { clear(field); }
          continue;
        }
        if (!field.value.trim()) {
          if (field.required) {
            fail(field, 'This field is required.');
            ok = false;
          }
          continue;
        }
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim())) {
          fail(field, 'Please enter a valid email address.');
          ok = false;
          continue;
        }
        clear(field);
      }
      return ok;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        if (status) {
          status.setAttribute('data-state', 'error');
          status.textContent = 'Please correct the highlighted fields and try again.';
          status.hidden = false;
        }
        return;
      }
      if (status) {
        status.setAttribute('data-state', 'ok');
        status.textContent = 'Thank you — your enquiry has been received. Our business support team will reply within one business day.';
        status.hidden = false;
      }
      form.reset();
    });

    var fields = form.querySelectorAll('input, textarea');
    for (var j = 0; j < fields.length; j++) {
      fields[j].addEventListener('blur', function () { validate(); });
      fields[j].addEventListener('input', function () { clear(this); });
    }
  }

  /* Static pages can carry their own home link; make sure the file:// switch
     is applied everywhere, not only to the injected header and footer. */
  function fixHomeLinks() {
    if (!IS_FILE_PROTOCOL) { return; }
    var links = document.querySelectorAll('a[href="./"]');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('href', HOME_HREF);
    }
  }

  function refreshYear() {
    var nodes = document.querySelectorAll('[data-current-year]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = String(new Date().getFullYear());
    }
  }

  /* ---------------------------------------------------------------------
     BOOT
     --------------------------------------------------------------------- */
  function boot() {
    var header = buildHeader();
    buildFooter();

    applySEO();
    injectJSONLD();
    replaceMascots();
    fixHomeLinks();
    refreshYear();

    initNav(header);
    initActiveNav();
    initHeaderScroll(header);
    initSmoothScroll();
    initBackToTop();
    initFaq();
    initFilters();
    initForm();
    initReveal();
    initCounters();

    loadSprite();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
