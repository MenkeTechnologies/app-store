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
      id: 'audio-haxor',
      name: 'audio haxor',
      glyph: 'A',
      category: 'Desktop Apps',
      badge: 'BESTSELLER',
      tagline: 'A Tauri v2 / JUCE desktop app that jacks into your audio plugin directories, maps every VST2/VST3/AU/CLAP it finds, scans sample libraries and DAW projects, and checks the web for newer plugin versions — all behind a cyberpunk CRT interface.',
      pills: ['Tauri v2', 'JUCE', 'VST/AU/CLAP', 'macOS/Linux/Win'],
      price: 39,
      tiers: [
        { name: 'Personal', desc: 'Single user, all platforms', price: 39 },
        { name: 'Pro', desc: 'Commercial use + lifetime updates', price: 89 },
      ],
      features: [
        'Maps every VST2 / VST3 / AU / CLAP plugin on your system into a live grid',
        'Architecture badges (ARM64 / x86_64 / Universal) from direct Mach-O / PE parsing',
        'Scans audio sample libraries and discovers DAW project files',
        'Checks the web for newer plugin versions and flags available updates',
        'Full changelog of every scan',
        'Cyberpunk CRT interface: neon glow, scanline overlays, glitch effects, color schemes',
      ],
      repo: 'https://github.com/MenkeTechnologies/Audio-Haxor',
    },
    {
      id: 'traderview',
      name: 'traderview',
      glyph: 'T',
      category: 'Desktop Apps',
      badge: 'SAVES $2,604/YR',
      tagline: 'A TraderVue-style trading journal that replaces TraderVue + DayTradeDash + StockInvest.us in one self-hosted binary. Import broker CSV → atomic execution rows → FIFO trade roll-up → equity curve, summary stats, and per-trade / per-day markdown journal.',
      pills: ['Tauri v2', 'Embedded Postgres', '13 brokers', '20+ reports'],
      price: 79,
      tiers: [
        { name: 'Desktop', desc: 'Single user, embedded Postgres', price: 79 },
        { name: 'Self-Hosted Web', desc: 'Multi-user axum server + JWT auth', price: 199 },
      ],
      features: [
        'Replaces TraderVue ($30/mo) + DayTradeDash ($187/mo) + StockInvest.us — data stays on your machine',
        'Executions are the atom; trades are FIFO-derived per (account, symbol)',
        'Embedded Postgres downloads on first launch — zero external dependencies on desktop',
        '13 broker CSV importers; 20+ reports at TraderVue parity',
        'Stocks, options, futures, and forex across one workspace',
        'Schedule C business expenses + Schedule E rental property tracking',
        'Same crates ship a Tauri desktop app and a multi-user axum web server',
      ],
      repo: 'https://github.com/MenkeTechnologies/traderview',
    },
    {
      id: 'zpwr-synth',
      name: 'zpwr-synth',
      glyph: 'S',
      category: 'Audio Plugins',
      badge: 'NEW',
      tagline: 'A polyphonic multi-layer synthesizer plugin built on JUCE. Stacked oscillator layers, a state-variable filter, per-voice ADSR envelopes, LFOs, and a routable mod matrix — shipping as VST3, AU, and CLAP.',
      pills: ['JUCE', 'VST3/AU/CLAP', 'Mod matrix', 'macOS/Linux/Win'],
      price: 49,
      tiers: [
        { name: 'Personal', desc: 'Single user, all formats', price: 49 },
        { name: 'Studio', desc: 'Commercial use + lifetime updates', price: 99 },
      ],
      features: [
        'Multi-layer voice architecture — stack independent oscillator layers per voice',
        'Oscillators with selectable waveforms, coarse/fine tune, and per-osc level',
        'State-variable filter: cutoff, resonance, filter type, envelope amount',
        'Per-voice ADSR amplitude and filter envelopes',
        'LFOs with rate and waveform control',
        'Routable mod matrix (ModSlot sources → destinations)',
        'Ships as VST3, AU, and CLAP via JUCE + clap-juce-extensions',
      ],
      repo: 'https://github.com/MenkeTechnologies/zpwr-synth',
    },
    {
      id: 'zpwr-fx',
      name: 'zpwr-fx',
      glyph: 'F',
      category: 'Audio Plugins',
      badge: 'NEW',
      tagline: 'A multi-effect rack plugin built on JUCE — compressor, drive, filter, chorus, tremolo, delay, reverb, and gain in one module, shipping as VST3, AU, and CLAP.',
      pills: ['JUCE', 'VST3/AU/CLAP', '8 effects', 'macOS/Linux/Win'],
      price: 39,
      tiers: [
        { name: 'Personal', desc: 'Single user, all formats', price: 39 },
        { name: 'Studio', desc: 'Commercial use + lifetime updates', price: 89 },
      ],
      features: [
        'Dynamics: compressor with threshold, ratio, attack, release',
        'Drive / distortion with selectable modes',
        'Filter section: cutoff, resonance, Q',
        'Modulation: chorus and tremolo (rate, depth, width)',
        'Time-based: delay (time, feedback, mix) and reverb (size, damp, width)',
        'Output gain staging',
        'Ships as VST3, AU, and CLAP via JUCE + clap-juce-extensions',
      ],
      repo: 'https://github.com/MenkeTechnologies/zpwr-fx',
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
