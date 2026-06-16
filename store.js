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
    {
      id: 'zshrs',
      name: 'zshrs',
      glyph: 'Z',
      category: 'Developer Tools',
      badge: 'WORLD FIRST',
      tagline: 'The first compiled Unix shell. Rkyv-backed bytecode + Cranelift JIT, an 18-thread parallel runtime, and a persistent worker pool — drop-in zsh compatibility with none of the startup tricks. Free and open source.',
      pills: ['Rust', 'JIT', 'macOS/Linux', 'Free / OSS'],
      price: 0,
      tiers: [
        { name: 'Open Source', desc: 'MIT licensed', price: 0 },
      ],
      features: [
        'World’s first compiled Unix shell — every shell since 1970 has been an interpreter',
        'Rkyv-backed bytecode + completion caches with zero-copy mmap reads',
        'Cranelift JIT execution via the embedded fusevm VM',
        'Persistent worker pool — zero per-command fork overhead',
        'Drop-in compatible with .zshrc, zinit plugins, and zpwr',
        'No startup banners or instant-prompt fakery — first paint = full functionality',
      ],
      download: 'https://github.com/MenkeTechnologies/zshrs/releases/latest',
      repo: 'https://github.com/MenkeTechnologies/zshrs',
    },
    {
      id: 'strykelang',
      name: 'stryke',
      glyph: '~>',
      category: 'Developer Tools',
      badge: 'WORLD FIRST',
      tagline: 'The hottest language ever created. A parallel Perl 5 superset on a bytecode VM with Cranelift JIT and Rayon work-stealing — pipe-forward syntax, 10,000+ builtins, LSP + DAP + JetBrains plugin. Free and open source.',
      pills: ['Rust', '347-opcode VM', 'Rayon', 'Free / OSS'],
      price: 0,
      tiers: [
        { name: 'Open Source', desc: 'MIT licensed', price: 0 },
      ],
      features: [
        'Parallel Perl 5 interpreter in Rust — NaN-boxed values, work-stealing across every CPU',
        '347-opcode bytecode VM with Cranelift Block JIT',
        '10,435 builtins (11,168 keys in %all) with pipe-forward syntax',
        'Syntactic synthesis: Clojure →→, Racket ~>, Scala _, Perl sigils, Ruby p',
        'Bundled LSP server, DAP debugger, and JetBrains plugin',
        'Server-farms-first: distributed load testing with stryke agent + controller',
      ],
      download: 'https://github.com/MenkeTechnologies/strykelang/releases/latest',
      repo: 'https://github.com/MenkeTechnologies/strykelang',
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

  // Free / open-source products download from GitHub instead of going to cart.
  function isFree(p) {
    var t = (p.tiers && p.tiers[0]) || { price: p.price };
    return !t.price;
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
          (isFree(p)
            ? '<button type="button" class="btn btn-buy" data-download="' + (p.download || p.repo) + '">Download ↗</button>'
            : '<button type="button" class="btn btn-buy" data-add="' + p.id + '">Add</button>') +
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
    var free = isFree(p);

    // Free products download from GitHub; paid products pick a license + add to cart.
    var pricingHtml = free
      ? '<div class="price detail-price"><span class="amt free">Free</span><span class="per">open source</span></div>'
      : '<div class="license-pick">' + tiersHtml + '</div>' +
        '<div class="price detail-price"><span class="amt" id="detailAmt">' + fmtPrice((p.tiers[0] || {}).price) + '</span></div>';
    var actionsHtml = free
      ? '<a class="btn btn-buy" href="' + (p.download || p.repo) + '" target="_blank" rel="noopener noreferrer">Download ↗</a>' +
        '<a class="btn btn-secondary" href="' + p.repo + '" target="_blank" rel="noopener noreferrer">Source</a>'
      : '<button type="button" class="btn btn-buy" id="detailAdd">Add to cart</button>' +
        '<a class="btn btn-secondary" href="' + p.repo + '" target="_blank" rel="noopener noreferrer">Source</a>';

    root.innerHTML = '' +
      '<div class="detail-top">' +
        '<div class="detail-hero"><span class="glyph">' + p.glyph + '</span></div>' +
        '<div class="detail-buy">' +
          '<span class="p-cat">' + p.category + '</span>' +
          '<h2>' + p.name + '</h2>' +
          '<p class="p-tag">' + p.tagline + '</p>' +
          '<div class="p-meta">' + pills + '</div>' +
          pricingHtml +
          '<div class="buy-actions">' + actionsHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<section class="tutorial-section">' +
        '<h2>What you get</h2>' +
        '<ul class="feature-list">' + featuresHtml + '</ul>' +
      '</section>';

    if (free) return;

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

  // ---- Checkout page (checkout.html) ---------------------------------
  // Discount codes: code -> { type: 'pct'|'flat', value }. Edit freely.
  var DISCOUNTS = {
    LAUNCH20: { type: 'pct', value: 20, label: '20% off' },
    HUD10:    { type: 'flat', value: 10, label: '$10 off' },
  };
  var appliedCode = null;

  function discountAmount(subtotal) {
    if (!appliedCode) return 0;
    var d = DISCOUNTS[appliedCode];
    if (!d) return 0;
    var amt = d.type === 'pct' ? Math.round(subtotal * d.value / 100) : d.value;
    return Math.min(amt, subtotal);
  }

  function sumItemHtml(item) {
    var p = byId(item.id) || { name: item.id, glyph: '?' };
    return '<div class="sum-item">' +
      '<div class="si-thumb">' + p.glyph + '<span class="si-qty">1</span></div>' +
      '<div class="si-info"><div class="si-name">' + p.name + '</div><div class="si-lic">' + item.tier + ' license</div></div>' +
      '<div class="si-price">' + fmtPrice(item.price) + '</div>' +
      '</div>';
  }

  function summaryHtml() {
    var cart = readCart();
    var subtotal = cartTotal(cart);
    var disc = discountAmount(subtotal);
    var total = subtotal - disc;
    var discLine = disc
      ? '<div class="sum-line"><span>Discount (' + appliedCode + ')</span><span>-' + fmtPrice(disc) + '</span></div>'
      : '';
    return '' +
      cart.map(sumItemHtml).join('') +
      '<div class="discount-row">' +
        '<input type="text" id="discountInput" placeholder="Discount code or gift card" value="' + (appliedCode || '') + '">' +
        '<button type="button" class="btn btn-secondary" id="applyDiscount">Apply</button>' +
      '</div>' +
      '<div class="discount-applied' + (appliedCode ? '' : ' hidden') + '" id="discountMsg"></div>' +
      '<div class="sum-line"><span>Subtotal · ' + cart.length + ' item' + (cart.length === 1 ? '' : 's') + '</span><span>' + fmtPrice(subtotal) + '</span></div>' +
      discLine +
      '<div class="sum-line"><span>Taxes</span><span>Calculated at fulfillment</span></div>' +
      '<div class="sum-line total"><span class="t-lbl">Total</span><span class="t-amt"><span class="cur">USD</span>' + fmtPrice(total) + '</span></div>';
  }

  function renderCheckoutPage() {
    var root = document.getElementById('checkoutRoot');
    if (!root) return;
    var cart = readCart();
    if (!cart.length) {
      root.innerHTML = '<div class="empty-state">your cart is empty — <a href="index.html">back to the store</a></div>';
      return;
    }

    root.innerHTML = '' +
      '<div class="checkout-wrap">' +
        '<div class="checkout-col">' +
          // Express checkout wallets
          '<div class="checkout-block">' +
            '<p class="express-label">Express checkout</p>' +
            '<div class="wallet-grid">' +
              '<button type="button" class="wallet-btn shop" data-wallet="shop">shop</button>' +
              '<button type="button" class="wallet-btn paypal" data-wallet="paypal">PayPal</button>' +
              '<button type="button" class="wallet-btn gpay" data-wallet="gpay"><span class="gp-g">G</span>&nbsp;Pay</button>' +
              '<button type="button" class="wallet-btn venmo" data-wallet="venmo">venmo</button>' +
            '</div>' +
            '<div class="or-divider">OR</div>' +
          '</div>' +
          // Contact
          '<div class="checkout-block">' +
            '<h3>Contact</h3>' +
            '<div class="field"><input id="ckEmail" type="email" required placeholder="Email (license delivery)"></div>' +
            '<label class="check-checkbox"><input type="checkbox" id="ckNews" checked> Email me product updates and new releases</label>' +
          '</div>' +
          // Payment
          '<div class="checkout-block">' +
            '<h3>Payment</h3>' +
            '<p class="checkout-note">All transactions are secure and encrypted.</p>' +
            '<form id="checkoutForm"><div class="pay-methods" id="payMethods">' +
              '<div class="pay-method active" data-method="card">' +
                '<div class="pay-method-head"><span class="radio"></span><span class="pm-label">Credit card</span>' +
                  '<span class="pm-art"><span class="card-chip visa">VISA</span><span class="card-chip mc">MC</span><span class="card-chip amex">AMEX</span><span class="card-chip more">+5</span></span>' +
                '</div>' +
                '<div class="pay-method-body">' +
                  '<div class="field"><input id="ckCard" type="text" inputmode="numeric" placeholder="Card number" autocomplete="cc-number"></div>' +
                  '<div class="field-row">' +
                    '<div class="field"><input id="ckExp" type="text" placeholder="Expiration date (MM / YY)" autocomplete="cc-exp"></div>' +
                    '<div class="field"><input id="ckCvc" type="text" inputmode="numeric" placeholder="Security code" autocomplete="cc-csc"></div>' +
                  '</div>' +
                  '<div class="field"><input id="ckName" type="text" placeholder="Name on card" autocomplete="cc-name"></div>' +
                '</div>' +
              '</div>' +
              '<div class="pay-method" data-method="shop">' +
                '<div class="pay-method-head"><span class="radio"></span><span class="pm-label">Shop Pay · pay in full or installments</span><span class="brand-logo shop">shop</span></div>' +
                '<div class="pay-method-body"><p class="checkout-note">You will be redirected to Shop Pay to complete your purchase securely.</p></div>' +
              '</div>' +
              '<div class="pay-method" data-method="paypal">' +
                '<div class="pay-method-head"><span class="radio"></span><span class="pm-label">PayPal</span><span class="brand-logo paypal">PayPal</span></div>' +
                '<div class="pay-method-body"><div id="paypalButtonContainer"><p class="checkout-note">You will be redirected to PayPal to complete your purchase securely.</p></div></div>' +
              '</div>' +
            '</div>' +
            // Billing
            '<div class="checkout-block" style="margin-top:1.3rem;">' +
              '<h3>Billing address</h3>' +
              '<div class="field"><label for="ckCountry">Country / Region</label>' +
                '<select id="ckCountry"><option>United States</option><option>Canada</option><option>United Kingdom</option><option>Australia</option><option>Germany</option><option>Other</option></select></div>' +
              '<div class="field-row">' +
                '<div class="field"><input id="ckFirst" type="text" placeholder="First name" autocomplete="given-name"></div>' +
                '<div class="field"><input id="ckLast" type="text" placeholder="Last name" autocomplete="family-name"></div>' +
              '</div>' +
              '<div class="field"><input id="ckAddr" type="text" placeholder="Address" autocomplete="street-address"></div>' +
              '<div class="field-row">' +
                '<div class="field"><input id="ckCity" type="text" placeholder="City" autocomplete="address-level2"></div>' +
                '<div class="field"><input id="ckState" type="text" placeholder="State / Province" autocomplete="address-level1"></div>' +
                '<div class="field"><input id="ckZip" type="text" placeholder="ZIP / Postal code" autocomplete="postal-code"></div>' +
              '</div>' +
            '</div>' +
            '<button type="submit" class="btn btn-buy pay-now-btn" id="payNow">Pay now</button>' +
            '</form>' +
          '</div>' +
        '</div>' +
        // Right: order summary
        '<aside class="checkout-summary" id="checkoutSummary">' + summaryHtml() + '</aside>' +
      '</div>';

    wireCheckoutPage(root);
  }

  function refreshSummary(root) {
    var summary = root.querySelector('#checkoutSummary');
    if (summary) { summary.innerHTML = summaryHtml(); wireSummary(root); }
  }

  function wireSummary(root) {
    var apply = root.querySelector('#applyDiscount');
    var input = root.querySelector('#discountInput');
    var msg = root.querySelector('#discountMsg');
    if (apply && input) apply.addEventListener('click', function () {
      var code = input.value.trim().toUpperCase();
      if (DISCOUNTS[code]) {
        appliedCode = code;
        refreshSummary(root);
        var m2 = root.querySelector('#discountMsg');
        if (m2) { m2.classList.remove('hidden', 'bad'); m2.textContent = '✓ ' + DISCOUNTS[code].label + ' applied'; }
      } else {
        appliedCode = null;
        if (msg) { msg.classList.remove('hidden'); msg.classList.add('bad'); msg.textContent = '✗ invalid code'; }
      }
    });
    if (msg && appliedCode && DISCOUNTS[appliedCode]) {
      msg.classList.remove('hidden', 'bad');
      msg.textContent = '✓ ' + DISCOUNTS[appliedCode].label + ' applied';
    }
  }

  function wireCheckoutPage(root) {
    wireSummary(root);

    // Payment-method accordion (single open at a time).
    var methods = root.querySelector('#payMethods');
    if (methods) methods.addEventListener('click', function (e) {
      var head = e.target.closest('.pay-method-head');
      if (!head) return;
      var all = methods.querySelectorAll('.pay-method');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
      head.parentElement.classList.add('active');
    });

    // Express wallet buttons + branded radios route to the provider.
    // INTEGRATION HOOKS: replace the alert() calls below.
    //   shop / shopPay  -> redirect to your Shopify hosted checkout URL
    //   paypal          -> render PayPal Smart Buttons into #paypalButtonContainer
    //   gpay / venmo    -> Google Pay / Braintree-Venmo SDK
    function startWallet(name) {
      // e.g. shop: location.href = SHOPIFY_CHECKOUT_URL;
      completeOrder(root, name);
    }
    root.querySelectorAll('[data-wallet]').forEach(function (b) {
      b.addEventListener('click', function () { startWallet(b.getAttribute('data-wallet')); });
    });

    var form = root.querySelector('#checkoutForm');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var active = root.querySelector('.pay-method.active');
      var method = active ? active.getAttribute('data-method') : 'card';
      completeOrder(root, method);
    });
  }

  function completeOrder(root, method) {
    // CLIENT-SIDE PLACEHOLDER — no real charge happens here. Wire `method`
    // to Stripe / PayPal / Shopify before going live (see README).
    var emailEl = root.querySelector('#ckEmail');
    var email = (emailEl && emailEl.value) || 'your inbox';
    writeCart([]);
    appliedCode = null;
    root.innerHTML = '<div class="checkout-ok" style="max-width:34rem;margin:3rem auto;">' +
      '<div class="big">// order confirmed</div>' +
      '<p>Paid via <strong>' + method + '</strong>.<br>License keys are on their way to <strong>' + email + '</strong>.<br>Thanks for buying from MenkeTechnologies.</p>' +
      '<div class="cart-actions" style="justify-content:center;margin-top:1rem;"><a class="btn btn-buy" href="index.html">Back to store</a></div></div>';
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
    renderCheckoutPage();

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
      var dl = e.target.closest('[data-download]');
      if (dl) {
        e.preventDefault();
        e.stopPropagation();
        window.open(dl.getAttribute('data-download'), '_blank', 'noopener');
        return;
      }
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
      if (e.target.id === 'goCheckout') { location.href = 'checkout.html'; return; }
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
