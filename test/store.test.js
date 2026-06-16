'use strict';
/*
 * Storefront integrity tests — no dependencies, runs on `node --test`.
 *
 * store.js is a browser IIFE with no exports, so each test loads the source
 * into a minimal DOM/localStorage shim and asserts on the HTML it renders
 * (the same surface a browser would paint). This catches catalog regressions
 * — missing fields, broken download wiring, sparse detail copy, stale pricing
 * copy — without a real browser.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CODE = fs.readFileSync(path.join(ROOT, 'store.js'), 'utf8');

// Minimal DOM shim. `run(targetId, search)` evaluates store.js with the given
// element id present (capturing its innerHTML) and location.search, returning
// { html, stats }. Other getElementById lookups return null (the code guards
// for that) except the hero stat spans, whose textContent we capture.
function run(targetId, search) {
  const stats = {};
  const DYN = ['detailAdd', 'detailAmt']; // ids inserted into innerHTML at runtime
  const STAT = ['statProducts', 'statCats', 'statFree'];
  let html = '';
  const fakeEl = (cap) => ({
    _h: '', style: {}, hidden: false,
    addEventListener() {}, removeEventListener() {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    getAttribute() { return null; }, setAttribute() {}, removeAttribute() {},
    textContent: '',
    querySelector() { return fakeEl(); },
    querySelectorAll() { return Object.assign([], { forEach: Array.prototype.forEach }); },
    get innerHTML() { return this._h; },
    set innerHTML(v) { this._h = v; if (cap) cap(v); },
  });
  const localStore = {};
  global.localStorage = {
    getItem: (k) => (k in localStore ? localStore[k] : null),
    setItem: (k, v) => { localStore[k] = String(v); },
    removeItem: (k) => { delete localStore[k]; },
  };
  global.location = { search: search || '', href: '' };
  global.document = {
    addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') cb(); },
    getElementById(id) {
      if (id === targetId) return fakeEl((v) => { html = v; });
      if (DYN.includes(id)) return fakeEl();
      if (STAT.includes(id)) {
        return { set textContent(v) { stats[id] = v; }, get textContent() { return stats[id]; } };
      }
      return null;
    },
    querySelector() { return null; },
    documentElement: {
      getAttribute() { return 'dark'; }, setAttribute() {},
      style: { setProperty() {}, removeProperty() {} },
    },
    body: { classList: { toggle() {}, add() {} } },
    createElement() { return fakeEl(); },
  };
  global.window = global;
  // eslint-disable-next-line no-eval
  eval(CODE);
  return { html, stats };
}

function gridIds(html) {
  return [...html.matchAll(/product\.html\?id=([^"]+)"/g)].map((m) => decodeURIComponent(m[1]));
}

test('store.js parses and renders the grid', () => {
  const { html } = run('productGrid', '');
  assert.ok(html.includes('product-card'), 'renders product cards');
  assert.ok(!html.includes('[object'), 'no [object Object] leaks');
});

test('catalog has the expected size and unique ids', () => {
  const { html, stats } = run('productGrid', '');
  const ids = gridIds(html);
  assert.ok(ids.length >= 60, `expected >= 60 products, got ${ids.length}`);
  assert.strictEqual(new Set(ids).size, ids.length, 'product ids are unique');
  assert.strictEqual(stats.statProducts, String(ids.length), 'stat count matches rendered cards');
});

test('free products download from GitHub; paid products add to cart', () => {
  const { html } = run('productGrid', '');
  // Split cards and check each independently.
  const cards = html.split('class="product-card"').slice(1);
  assert.ok(cards.length >= 60);
  for (const card of cards) {
    const free = /amt free/.test(card) || />Free</.test(card);
    if (free) {
      const m = card.match(/data-download="([^"]+)"/);
      assert.ok(m, 'free card has a download button');
      assert.match(
        m[1],
        /^https:\/\/github\.com\/MenkeTechnologies\/[^"]+\/(releases\/latest|tags)$/,
        `download URL well-formed: ${m && m[1]}`,
      );
    } else {
      assert.match(card, /data-add="/, 'paid card has add-to-cart');
      assert.match(card, /per major version/, 'paid card shows per-major-version pricing');
    }
  }
});

test('no stale pricing copy remains', () => {
  assert.ok(!/lifetime/i.test(CODE), 'no "lifetime" pricing copy');
  const { html } = run('productGrid', '');
  assert.ok(!html.includes('>one-time<'), 'no "one-time" label rendered');
});

test('every product detail page has an overview and rich features', () => {
  const { html } = run('productGrid', '');
  for (const id of gridIds(html)) {
    const { html: d } = run('detailRoot', '?id=' + encodeURIComponent(id));
    assert.ok(d.includes('Overview'), `${id}: has Overview section`);
    const bullets = (d.match(/<li>/g) || []).length;
    assert.ok(bullets >= 3, `${id}: has >= 3 feature bullets (got ${bullets})`);
    assert.ok(!d.includes('[object'), `${id}: no object leaks`);
  }
});

test('paid detail page: add-to-cart, per-major-version note, no lifetime', () => {
  const { html } = run('detailRoot', '?id=audio-haxor');
  assert.match(html, /id="detailAdd"/, 'has Add to cart');
  assert.match(html, /per major version/, 'shows per-major-version label');
  assert.match(html, /Future major versions are a separate purchase/, 'has model note');
  assert.match(html, /license-opt/, 'has license tier picker');
  assert.ok(!/lifetime/i.test(html), 'no lifetime copy');
});

test('free detail page: download CTA, no cart, no version note', () => {
  const { html } = run('detailRoot', '?id=zshrs');
  assert.match(html, /releases\/latest/, 'links to GitHub release');
  assert.ok(!html.includes('id="detailAdd"'), 'no add-to-cart on free product');
  assert.ok(!html.includes('Future major versions'), 'no per-version note on free product');
  assert.match(html, /Overview/, 'has overview');
});

test('proprietary (private-repo) products do not link a public Source', () => {
  // audio-haxor / zpwr-synth etc. have no repo set, so no Source button.
  const { html } = run('detailRoot', '?id=audio-haxor');
  assert.ok(!html.includes('>Source<'), 'no Source link for private-repo product');
});

test('checkout renders line items + per-major-version totals when cart has items', () => {
  const { html } = runWithCart('checkoutRoot', [
    { id: 'audio-haxor', tier: 'Pro', price: 89 },
    { id: 'zpwr-synth', tier: 'Studio', price: 99 },
  ]);
  assert.match(html, /checkout-wrap/, 'renders checkout layout');
  assert.match(html, /Pay now/, 'has pay button');
  assert.ok(html.includes('$188'), 'sums line items (89 + 99)');
});

// Variant of run() that seeds the cart before evaluation.
function runWithCart(targetId, cart) {
  const stats = {};
  let html = '';
  const fakeEl = (cap) => ({
    _h: '', style: {}, hidden: false,
    addEventListener() {}, removeEventListener() {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    getAttribute() { return null; }, setAttribute() {}, removeAttribute() {},
    textContent: '',
    querySelector() { return fakeEl(); },
    querySelectorAll() { return Object.assign([], { forEach: Array.prototype.forEach }); },
    get innerHTML() { return this._h; },
    set innerHTML(v) { this._h = v; if (cap) cap(v); },
  });
  const localStore = { 'appstore-cart': JSON.stringify(cart) };
  global.localStorage = {
    getItem: (k) => (k in localStore ? localStore[k] : null),
    setItem: (k, v) => { localStore[k] = String(v); },
    removeItem: (k) => { delete localStore[k]; },
  };
  global.location = { search: '', href: '' };
  global.document = {
    addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') cb(); },
    getElementById(id) { return id === targetId ? fakeEl((v) => { html = v; }) : null; },
    querySelector() { return null; },
    documentElement: { getAttribute() { return 'dark'; }, setAttribute() {}, style: { setProperty() {}, removeProperty() {} } },
    body: { classList: { toggle() {}, add() {} } },
    createElement() { return fakeEl(); },
  };
  global.window = global;
  // eslint-disable-next-line no-eval
  eval(CODE);
  return { html, stats };
}

test('HTML pages reference the shared assets and mount points', () => {
  const pages = {
    'index.html': ['store.css', 'hud-theme.js', 'store.js', 'id="productGrid"', 'id="modalOverlay"'],
    'product.html': ['store.css', 'hud-theme.js', 'store.js', 'id="detailRoot"'],
    'checkout.html': ['store.css', 'hud-theme.js', 'store.js', 'id="checkoutRoot"'],
  };
  for (const [page, needles] of Object.entries(pages)) {
    const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
    for (const needle of needles) {
      assert.ok(src.includes(needle), `${page} references ${needle}`);
    }
  }
});
