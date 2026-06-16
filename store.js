/**
 * MenkeTechnologies app store — product catalog + storefront logic.
 *
 * PRODUCTS is the single source of truth. The grid (index.html), the product
 * detail page (product.html), the cart, and the checkout all read from it.
 * Edit prices / tiers / copy here — nothing is duplicated elsewhere.
 *
 * Pricing is in whole USD. price: 0 renders as "Free". Per-product license
 * tiers override the base price; the first tier is the default selection.
 */
(function () {
  'use strict';

  // ---- Catalog --------------------------------------------------------
  var PRODUCTS = [
    {
      id: 'zshrs',
      name: 'zshrs',
      glyph: 'Z',
      category: 'Shells',
      badge: 'WORLD FIRST',
      tagline: 'The first compiled Unix shell. Rkyv-backed bytecode + Cranelift JIT, an 18-thread parallel runtime, and a persistent worker pool — drop-in zsh compatibility with none of the startup tricks.',
      pills: ['Rust', 'JIT', 'macOS/Linux', 'aarch64/x86_64'],
      price: 149,
      tiers: [
        { name: 'Personal', desc: 'Single developer, all machines', price: 149 },
        { name: 'Team (5)', desc: 'Up to 5 seats', price: 599 },
        { name: 'Enterprise', desc: 'Unlimited seats + priority support', price: 2499 },
      ],
      features: [
        'World’s first compiled Unix shell — every shell since 1970 has been an interpreter',
        'Rkyv-backed bytecode + completion caches with zero-copy mmap reads',
        'Cranelift JIT execution via the embedded fusevm VM',
        'Persistent worker pool — zero per-command fork overhead',
        'Drop-in compatible with .zshrc, zinit plugins, and zpwr',
        'No startup banners, no instant-prompt fakery — first paint = full functionality',
      ],
      repo: 'https://github.com/MenkeTechnologies/zshrs',
    },
    {
      id: 'stryke',
      name: 'stryke',
      glyph: 'S',
      category: 'Languages',
      badge: 'WORLD FIRST',
      tagline: 'The hottest language ever created. A parallel Perl 5 superset on a bytecode VM with Cranelift JIT and Rayon work-stealing — pipe-forward syntax, 10,000+ builtins, LSP + DAP + JetBrains plugin.',
      pills: ['Rust', '347-opcode VM', 'Rayon', 'LSP+DAP'],
      price: 99,
      tiers: [
        { name: 'Personal', desc: 'Single developer', price: 99 },
        { name: 'Team (5)', desc: 'Up to 5 seats', price: 399 },
        { name: 'Enterprise', desc: 'Unlimited seats + priority support', price: 1999 },
      ],
      features: [
        'Parallel Perl 5 interpreter in Rust — NaN-boxed values, work-stealing across every CPU',
        '347-opcode bytecode VM with Cranelift Block JIT',
        '10,435 builtins (11,168 keys in %all) with pipe-forward syntax',
        'Syntactic synthesis: Clojure →→, Racket ~>, Scala _, Perl sigils, Ruby p',
        'Bundled LSP server, DAP debugger, and JetBrains plugin',
        'Server-farms-first: distributed load testing with stryke agent + controller',
      ],
      repo: 'https://github.com/MenkeTechnologies/strykelang',
    },
    {
      id: 'zpwr',
      name: 'zpwr',
      glyph: 'P',
      category: 'Terminal',
      badge: 'BESTSELLER',
      tagline: 'The world’s most advanced UNIX terminal environment. 172k+ lines, 506+ subcommands, 2k+ aliases, 17k+ completions — a single-author CLI suite at a scale most teams don’t attempt.',
      pills: ['zsh', '506+ cmds', '2k+ aliases', 'v48.7.3'],
      price: 49,
      tiers: [
        { name: 'Personal', desc: 'Single developer', price: 49 },
        { name: 'Team (5)', desc: 'Up to 5 seats', price: 199 },
        { name: 'Enterprise', desc: 'Unlimited seats', price: 999 },
      ],
      features: [
        '506+ subcommands, 2,000+ aliases, 17,000+ completions',
        '172,000+ lines of hand-tuned shell engineering',
        'Externally vetted by industry veterans — 218★ on GitHub',
        'Cyberpunk HUD dashboards: zpwrTop, zpwrFlame, zpwrTrace, zpwrDeps',
        'Battle-tested across UPS, Williams-Sonoma, Amazon-scale workflows',
      ],
      repo: 'https://github.com/MenkeTechnologies/zpwr',
    },
    {
      id: 'zsh-more-completions',
      name: 'zsh-more-completions',
      glyph: 'C',
      category: 'Terminal',
      badge: 'WORLD FIRST',
      tagline: 'The world’s largest zsh completion corpus — 16,806+ completion files. By comparison: ~700 in zsh-completions, ~1,500 in fish, a few hundred in bash-completion.',
      pills: ['zsh', '16,806 files', 'fpath drop-in'],
      price: 29,
      tiers: [
        { name: 'Personal', desc: 'Single developer', price: 29 },
        { name: 'Team (5)', desc: 'Up to 5 seats', price: 119 },
      ],
      features: [
        '16,806+ completion files — the largest curated corpus in existence',
        '24× larger than upstream zsh-completions',
        'Drop into fpath and go — no configuration',
        'Maintained by the foremost zsh plugin developer in the world',
      ],
      repo: 'https://github.com/MenkeTechnologies/zsh-more-completions',
    },
    {
      id: 'audio-haxor',
      name: 'audio haxor',
      glyph: 'A',
      category: 'GUI Apps',
      badge: 'NEW',
      tagline: 'A cyberpunk audio workstation. Real-time spectrum analysis, waveform editing, and FFT visualization in a native Tauri v2 app — the HUD aesthetic, fully interactive.',
      pills: ['Tauri v2', 'Rust', 'macOS/Linux/Win'],
      price: 39,
      tiers: [
        { name: 'Personal', desc: 'Single user, all platforms', price: 39 },
        { name: 'Pro', desc: 'Commercial use + updates', price: 89 },
      ],
      features: [
        'Real-time spectrum + FFT visualization',
        'Native Tauri v2 desktop app — macOS, Linux, Windows',
        'Cyberpunk HUD interface with live color schemes',
        'Rust audio backend for low-latency processing',
      ],
      repo: 'https://github.com/MenkeTechnologies/audio_haxor',
    },
    {
      id: 'storageshower',
      name: 'storage shower',
      glyph: 'D',
      category: 'GUI Apps',
      tagline: 'Disk usage, visualized. A fast native app that maps your storage into an interactive treemap so you find what’s eating space in seconds.',
      pills: ['Tauri v2', 'Rust', 'Treemap'],
      price: 19,
      tiers: [
        { name: 'Personal', desc: 'Single user', price: 19 },
        { name: 'Pro', desc: 'Commercial use + updates', price: 49 },
      ],
      features: [
        'Interactive treemap of disk usage',
        'Native performance over millions of files',
        'Cross-platform desktop app',
      ],
      repo: 'https://github.com/MenkeTechnologies/storageshower',
    },
    {
      id: 'traderview',
      name: 'trader view',
      glyph: 'T',
      category: 'GUI Apps',
      tagline: 'A market dashboard with the HUD treatment. Live charts, watchlists, and signal overlays in a native desktop app.',
      pills: ['Tauri v2', 'Rust', 'Live charts'],
      price: 59,
      tiers: [
        { name: 'Personal', desc: 'Single user', price: 59 },
        { name: 'Pro', desc: 'Commercial use + updates', price: 149 },
      ],
      features: [
        'Live market charts and watchlists',
        'Signal overlays and indicators',
        'Native cross-platform desktop app',
      ],
      repo: 'https://github.com/MenkeTechnologies/traderview',
    },
    {
      id: 'powerliners',
      name: 'powerliners',
      glyph: 'L',
      category: 'CLI Tools',
      tagline: 'A curated arsenal of shell one-liners for the power user — text processing, system inspection, and automation distilled into copy-paste-ready commands.',
      pills: ['shell', 'one-liners', 'free'],
      price: 0,
      tiers: [
        { name: 'Open Source', desc: 'MIT licensed', price: 0 },
      ],
      features: [
        'Hundreds of battle-tested shell one-liners',
        'Text processing, system inspection, automation',
        'Free and open source',
      ],
      repo: 'https://github.com/MenkeTechnologies/powerliners',
    },
  ];

  // ---- Helpers --------------------------------------------------------
  var CART_KEY = 'appstore-cart';

  function byId(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  function fmtPrice(n) {
    if (!n) return 'Free';
    return '$' + n.toLocaleString('en-US');
  }

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (_) { return []; }
  }
  function writeCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
    updateCartCount();
  }
  function cartTotal(cart) {
    return cart.reduce(function (sum, item) { return sum + (item.price || 0); }, 0);
  }
  function addToCart(productId, tierName, price) {
    var cart = readCart();
    // One license per product in the cart; re-adding swaps the tier.
    cart = cart.filter(function (i) { return i.id !== productId; });
    cart.push({ id: productId, tier: tierName, price: price });
    writeCart(cart);
  }
  function removeFromCart(productId) {
    writeCart(readCart().filter(function (i) { return i.id !== productId; }));
  }

  function updateCartCount() {
    var el = document.getElementById('cartCount');
    if (!el) return;
    var n = readCart().length;
    el.textContent = n ? String(n) : '';
    el.setAttribute('data-n', String(n));
  }

  // ---- Storefront grid (index.html) ----------------------------------
  function categories() {
    var seen = {};
    var out = ['All'];
    PRODUCTS.forEach(function (p) {
      if (!seen[p.category]) { seen[p.category] = true; out.push(p.category); }
    });
    return out;
  }

  function cardHtml(p) {
    var tier = (p.tiers && p.tiers[0]) || { price: p.price };
    var badge = p.badge
      ? '<span class="badge' + (p.badge === 'WORLD FIRST' ? ' first' : '') + '">' + p.badge + '</span>'
      : '';
    var pills = (p.pills || []).map(function (t) {
      return '<span class="p-pill">' + t + '</span>';
    }).join('');
    var priceCls = tier.price ? '' : ' free';
    return '' +
      '<a class="product-card" href="product.html?id=' + encodeURIComponent(p.id) + '" data-cat="' + p.category + '" data-name="' + p.name.toLowerCase() + ' ' + p.tagline.toLowerCase() + '">' +
        '<div class="product-thumb">' + badge + '<span class="glyph">' + p.glyph + '</span></div>' +
        '<div class="product-body">' +
          '<span class="p-cat">' + p.category + '</span>' +
          '<span class="p-name">' + p.name + '</span>' +
          '<span class="p-tag">' + p.tagline + '</span>' +
          '<div class="p-meta">' + pills + '</div>' +
        '</div>' +
        '<div class="product-foot">' +
          '<span class="price"><span class="amt' + priceCls + '">' + fmtPrice(tier.price) + '</span>' +
            (tier.price ? '<span class="per">one-time</span>' : '') + '</span>' +
          '<button type="button" class="btn btn-buy" data-add="' + p.id + '">Add</button>' +
        '</div>' +
      '</a>';
  }

  function renderGrid(filterCat, query) {
    var grid = document.getElementById('productGrid');
    if (!grid) return;
    var q = (query || '').trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) {
      if (filterCat && filterCat !== 'All' && p.category !== filterCat) return false;
      if (q && (p.name + ' ' + p.tagline + ' ' + p.category).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">no products match that search</div>';
      return;
    }
    grid.innerHTML = list.map(cardHtml).join('');
    // Stagger the entrance animation.
    var cards = grid.querySelectorAll('.product-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].style.animationDelay = (0.05 + i * 0.04) + 's';
    }
  }

  function renderFilters() {
    var row = document.getElementById('filterRow');
    if (!row) return;
    row.innerHTML = categories().map(function (c, i) {
      return '<button type="button" class="filter-chip' + (i === 0 ? ' active' : '') + '" data-cat="' + c + '">' + c + '</button>';
    }).join('');
  }

  function renderStats() {
    var setText = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setText('statProducts', String(PRODUCTS.length));
    setText('statCats', String(categories().length - 1));
    var free = PRODUCTS.filter(function (p) { return !((p.tiers && p.tiers[0].price) || p.price); }).length;
    setText('statFree', String(free));
  }

  // ---- Product detail (product.html) ---------------------------------
  function getParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function renderDetail() {
    var root = document.getElementById('detailRoot');
    if (!root) return;
    var p = byId(getParam('id'));
    if (!p) {
      root.innerHTML = '<div class="empty-state">product not found</div>';
      return;
    }
    document.title = p.name + ' — MenkeTechnologies App Store';
    var tiersHtml = (p.tiers || []).map(function (t, i) {
      return '<div class="license-opt' + (i === 0 ? ' active' : '') + '" data-tier="' + i + '" data-price="' + t.price + '">' +
        '<div><div class="lo-name">' + t.name + '</div><div class="lo-desc">' + t.desc + '</div></div>' +
        '<div class="lo-price">' + fmtPrice(t.price) + '</div>' +
        '</div>';
    }).join('');
    var featuresHtml = (p.features || []).map(function (f) {
      return '<li>' + f + '</li>';
    }).join('');
    var pills = (p.pills || []).map(function (t) { return '<span class="p-pill">' + t + '</span>'; }).join('');

    root.innerHTML = '' +
      '<div class="detail-top">' +
        '<div class="detail-hero"><span class="glyph">' + p.glyph + '</span></div>' +
        '<div class="detail-buy">' +
          '<span class="p-cat">' + p.category + '</span>' +
          '<h2>' + p.name + '</h2>' +
          '<p class="p-tag">' + p.tagline + '</p>' +
          '<div class="p-meta">' + pills + '</div>' +
          '<div class="license-pick">' + tiersHtml + '</div>' +
          '<div class="price detail-price"><span class="amt" id="detailAmt">' + fmtPrice((p.tiers[0] || {}).price) + '</span></div>' +
          '<div class="buy-actions">' +
            '<button type="button" class="btn btn-buy" id="detailAdd">Add to cart</button>' +
            '<a class="btn btn-secondary" href="' + p.repo + '" target="_blank" rel="noopener noreferrer">Source</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<section class="tutorial-section">' +
        '<h2>What you get</h2>' +
        '<ul class="feature-list">' + featuresHtml + '</ul>' +
      '</section>';

    var selected = 0;
    var opts = root.querySelectorAll('.license-opt');
    var amtEl = document.getElementById('detailAmt');
    for (var i = 0; i < opts.length; i++) {
      (function (idx) {
        opts[idx].addEventListener('click', function () {
          for (var j = 0; j < opts.length; j++) opts[j].classList.remove('active');
          opts[idx].classList.add('active');
          selected = idx;
          amtEl.textContent = fmtPrice(p.tiers[idx].price);
        });
      })(i);
    }
    document.getElementById('detailAdd').addEventListener('click', function () {
      var t = p.tiers[selected];
      addToCart(p.id, t.name, t.price);
      openCart();
    });
  }

  // ---- Cart + checkout modal -----------------------------------------
  function cartItemHtml(item) {
    var p = byId(item.id) || { name: item.id, glyph: '?' };
    return '<div class="cart-item">' +
      '<div class="ci-glyph">' + p.glyph + '</div>' +
      '<div class="ci-info"><div class="ci-name">' + p.name + '</div><div class="ci-lic">' + item.tier + '</div></div>' +
      '<div class="ci-price">' + fmtPrice(item.price) + '</div>' +
      '<button type="button" class="ci-rm" data-rm="' + item.id + '" title="Remove">×</button>' +
      '</div>';
  }

  function renderCartBody() {
    var body = document.getElementById('modalBody');
    if (!body) return;
    var cart = readCart();
    if (!cart.length) {
      body.innerHTML = '<div class="cart-empty">// your cart is empty</div>';
      return;
    }
    body.innerHTML =
      cart.map(cartItemHtml).join('') +
      '<div class="cart-total"><span class="lbl">Total</span><span class="amt">' + fmtPrice(cartTotal(cart)) + '</span></div>' +
      '<div class="cart-actions">' +
        '<button type="button" class="btn btn-secondary" id="clearCart">Clear</button>' +
        '<button type="button" class="btn btn-buy" id="goCheckout">Checkout</button>' +
      '</div>';
  }

  function renderCheckout() {
    var body = document.getElementById('modalBody');
    var head = document.getElementById('modalTitle');
    if (!body) return;
    if (head) head.textContent = 'Checkout';
    var cart = readCart();
    body.innerHTML = '' +
      '<form id="checkoutForm">' +
        '<div class="field"><label for="ckEmail">Email (license delivery)</label><input id="ckEmail" type="email" required placeholder="you@example.com"></div>' +
        '<div class="field"><label for="ckName">Name on card</label><input id="ckName" type="text" required placeholder="Full name"></div>' +
        '<div class="field"><label for="ckCard">Card number</label><input id="ckCard" type="text" required inputmode="numeric" placeholder="4242 4242 4242 4242"></div>' +
        '<div class="field-row">' +
          '<div class="field"><label for="ckExp">Expiry</label><input id="ckExp" type="text" required placeholder="MM/YY"></div>' +
          '<div class="field"><label for="ckCvc">CVC</label><input id="ckCvc" type="text" required inputmode="numeric" placeholder="123"></div>' +
        '</div>' +
        '<div class="cart-total"><span class="lbl">Total</span><span class="amt">' + fmtPrice(cartTotal(cart)) + '</span></div>' +
        '<div class="cart-actions">' +
          '<button type="button" class="btn btn-secondary" id="backToCart">Back</button>' +
          '<button type="submit" class="btn btn-buy">Pay ' + fmtPrice(cartTotal(cart)) + '</button>' +
        '</div>' +
      '</form>';
    document.getElementById('backToCart').addEventListener('click', function () {
      setModalTitle('Cart');
      renderCartBody();
    });
    document.getElementById('checkoutForm').addEventListener('submit', function (e) {
      e.preventDefault();
      writeCart([]);
      var email = (document.getElementById('ckEmail') || {}).value || 'your inbox';
      body.innerHTML = '<div class="checkout-ok">' +
        '<div class="big">// order confirmed</div>' +
        '<p>License keys are on their way to <strong>' + email + '</strong>.<br>Thanks for buying from MenkeTechnologies.</p>' +
        '<div class="cart-actions"><button type="button" class="btn btn-buy" id="okClose">Done</button></div></div>';
      var ok = document.getElementById('okClose');
      if (ok) ok.addEventListener('click', closeModal);
    });
  }

  function setModalTitle(t) {
    var head = document.getElementById('modalTitle');
    if (head) head.textContent = t;
  }
  function openCart() {
    var overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    setModalTitle('Cart');
    renderCartBody();
    overlay.hidden = false;
  }
  function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.hidden = true;
  }

  // ---- Wiring ---------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    updateCartCount();
    renderFilters();
    renderStats();
    renderGrid('All', '');
    renderDetail();

    var activeCat = 'All';
    var search = document.getElementById('storeSearch');

    var filterRow = document.getElementById('filterRow');
    if (filterRow) filterRow.addEventListener('click', function (e) {
      var chip = e.target.closest('.filter-chip');
      if (!chip) return;
      var chips = filterRow.querySelectorAll('.filter-chip');
      for (var i = 0; i < chips.length; i++) chips[i].classList.remove('active');
      chip.classList.add('active');
      activeCat = chip.getAttribute('data-cat');
      renderGrid(activeCat, search ? search.value : '');
    });

    if (search) search.addEventListener('input', function () {
      renderGrid(activeCat, search.value);
    });

    // "Add" on a grid card: add default tier, don't follow the card link.
    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) {
        e.preventDefault();
        e.stopPropagation();
        var p = byId(add.getAttribute('data-add'));
        if (p) {
          var t = (p.tiers && p.tiers[0]) || { name: 'License', price: p.price };
          addToCart(p.id, t.name, t.price);
          openCart();
        }
        return;
      }
      var rm = e.target.closest('[data-rm]');
      if (rm) { removeFromCart(rm.getAttribute('data-rm')); renderCartBody(); return; }
      if (e.target.id === 'clearCart') { writeCart([]); renderCartBody(); return; }
      if (e.target.id === 'goCheckout') { renderCheckout(); return; }
    });

    var cartBtn = document.getElementById('btnCart');
    if (cartBtn) cartBtn.addEventListener('click', openCart);

    var closeBtn = document.getElementById('modalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  });
})();
