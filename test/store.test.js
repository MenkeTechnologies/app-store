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

// Recursively list every file under assets/ as repo-relative POSIX paths.
function listAssets(dir = path.join(ROOT, 'assets')) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listAssets(abs));
    else out.push(path.relative(ROOT, abs).split(path.sep).join('/'));
  }
  return out;
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

test('GUI apps render screenshots in grid, hero, and gallery; assets exist', () => {
  const GUI = ['audio-haxor', 'traderview', 'zpwr-synth', 'zpwr-fx', 'zpwr-midi-fx'];
  const { html: grid } = run('productGrid', '');
  const referenced = new Set();

  for (const id of GUI) {
    const { html: d } = run('detailRoot', '?id=' + encodeURIComponent(id));
    assert.match(d, /class="detail-hero has-shot"/, `${id}: hero uses a screenshot`);
    assert.match(d, /data-shot="0"/, `${id}: hero opens the lightbox`);
    for (const m of d.matchAll(/src="(assets\/[^"]+\.webp)"/g)) referenced.add(m[1]);
  }

  // audio-haxor has many shots -> a gallery with multiple thumbnails.
  const { html: ah } = run('detailRoot', '?id=audio-haxor');
  assert.match(ah, /<h2>Screenshots<\/h2>/, 'audio-haxor: gallery section');
  assert.ok((ah.match(/class="shot-thumb"/g) || []).length >= 6, 'audio-haxor: multiple thumbnails');

  // single-shot apps don't render a redundant gallery.
  const { html: tv } = run('detailRoot', '?id=traderview');
  assert.ok(!tv.includes('<h2>Screenshots</h2>'), 'traderview: no gallery for a single shot');

  // grid cards for GUI apps show an <img>, not the glyph.
  assert.match(grid, /class="thumb-shot"/, 'grid cards render screenshot thumbnails');

  // every referenced asset file actually exists on disk.
  for (const src of referenced) {
    assert.ok(fs.existsSync(path.join(ROOT, src)), `asset missing: ${src}`);
  }
  assert.ok(referenced.size >= GUI.length, 'each GUI app references at least one asset');
});

test('non-GUI products keep the glyph thumbnail, no screenshots', () => {
  const { html } = run('detailRoot', '?id=zshrs');
  assert.ok(!html.includes('detail-hero has-shot'), 'zshrs: no screenshot hero');
  assert.match(html, /class="detail-hero"><span class="glyph"/, 'zshrs: glyph hero');
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

test('published HTML doc sites link to GitHub Pages, with reference only where it exists', () => {
  // zshrs ships all three docs (index + reference + report).
  const z = run('detailRoot', '?id=zshrs').html;
  assert.match(z, /href="https:\/\/menketechnologies\.github\.io\/zshrs\/"[^>]*>[\s\S]*?Documentation ↗/, 'zshrs links its Documentation site');
  assert.match(z, /menketechnologies\.github\.io\/zshrs\/reference\.html"[^>]*>[\s\S]*?API Reference ↗/, 'zshrs links its API Reference');
  assert.match(z, /menketechnologies\.github\.io\/zshrs\/report\.html"[^>]*>[\s\S]*?Engineering Report ↗/, 'zshrs links its Engineering Report');

  // awkrs ships index + report but no reference.html — must not link one.
  const a = run('detailRoot', '?id=awkrs').html;
  assert.match(a, /menketechnologies\.github\.io\/awkrs\/"[^>]*>[\s\S]*?Documentation ↗/, 'awkrs links its Documentation site');
  assert.match(a, /menketechnologies\.github\.io\/awkrs\/report\.html/, 'awkrs links its Engineering Report');
  assert.ok(!a.includes('awkrs/reference.html'), 'awkrs does not link a non-existent API Reference');

  // Proprietary product: no Pages docs, no broken doc-card.
  const ah = run('detailRoot', '?id=audio-haxor').html;
  assert.ok(!ah.includes('github.io'), 'audio-haxor links no GitHub Pages docs (proprietary)');

  // Pages-disabled plugin keeps its PDF and links no 404-ing HTML doc.
  const fx = run('detailRoot', '?id=zpwr-fx').html;
  assert.ok(!fx.includes('github.io/zpwr-fx'), 'zpwr-fx links no HTML doc site (Pages disabled)');
  assert.match(fx, /Block Catalog \(PDF\)/, 'zpwr-fx still links its block-catalog PDF');
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

test('screenshot assets: refs resolve, no orphans, all webp, size-budgeted', () => {
  // Pull every assets/ reference straight from source (covers all products,
  // not just the ones we render in this run).
  const refs = new Set(
    [...CODE.matchAll(/assets\/[A-Za-z0-9._/-]+\.(?:webp|png|jpe?g|gif)/g)].map((m) => m[0]),
  );
  assert.ok(refs.size >= 16, `expected >= 16 asset refs, got ${refs.size}`);
  for (const ref of refs) {
    assert.ok(!path.isAbsolute(ref), `asset ref must be relative: ${ref}`);
    assert.match(ref, /\.webp$/, `asset ref must be webp: ${ref}`);
    assert.ok(fs.existsSync(path.join(ROOT, ref)), `referenced asset missing: ${ref}`);
  }
  // Every file on disk must be referenced (no dead weight) and stay small —
  // the whole point was shrinking retina PNGs, so guard against a re-bloat.
  const BUDGET = 300 * 1024;
  for (const rel of listAssets()) {
    assert.match(rel, /\.webp$/, `assets/ should hold webp only, found: ${rel}`);
    assert.ok(refs.has(rel), `orphan asset not referenced anywhere: ${rel}`);
    const bytes = fs.statSync(path.join(ROOT, rel)).size;
    assert.ok(bytes <= BUDGET, `${rel} is ${Math.round(bytes / 1024)}KB, over ${BUDGET / 1024}KB`);
  }
});

test('audio-haxor gallery: sequential shot indices, one caption + alt each', () => {
  const { html } = run('detailRoot', '?id=audio-haxor');
  const gallery = html.slice(html.indexOf('<h2>Screenshots</h2>'));
  const thumbs = [...gallery.matchAll(/class="shot-thumb" data-shot="(\d+)"/g)].map((m) => Number(m[1]));
  assert.ok(thumbs.length >= 6, `gallery has thumbnails (got ${thumbs.length})`);
  assert.deepStrictEqual(thumbs, thumbs.map((_, i) => i), 'data-shot indices are 0..n-1 in order');
  const caps = [...gallery.matchAll(/class="shot-cap">([^<]+)</g)].map((m) => m[1].trim());
  assert.strictEqual(caps.length, thumbs.length, 'one caption per thumbnail');
  assert.ok(caps.every((c) => c.length > 0), 'all captions non-empty');
  const alts = [...gallery.matchAll(/<img src="assets[^"]+" alt="([^"]*)"/g)].map((m) => m[1]);
  assert.ok(alts.length >= thumbs.length && alts.every((a) => a.length > 0), 'every gallery image has alt text');
});

test('screenshot hero appears on exactly the GUI products', () => {
  const GUI = new Set(['audio-haxor', 'traderview', 'zpwr-synth', 'zpwr-fx', 'zpwr-midi-fx', 'ztranslator']);
  const { html } = run('productGrid', '');
  for (const id of gridIds(html)) {
    const { html: d } = run('detailRoot', '?id=' + encodeURIComponent(id));
    assert.strictEqual(d.includes('detail-hero has-shot'), GUI.has(id), `${id}: hero has-shot mismatch`);
  }
});

test('hero stats match the rendered grid (categories + free count)', () => {
  const { html, stats } = run('productGrid', '');
  const cards = html.split('class="product-card"').slice(1);
  const cats = new Set();
  let free = 0;
  for (const c of cards) {
    const m = c.match(/data-cat="([^"]+)"/);
    if (m) cats.add(m[1]);
    if (/amt free/.test(c) || />Free</.test(c)) free++;
  }
  assert.strictEqual(stats.statCats, String(cats.size), 'statCats equals distinct rendered categories');
  assert.strictEqual(stats.statFree, String(free), 'statFree equals rendered free-card count');
});

test('detail hero shows the full screenshot — no cover-crop (regression guard)', () => {
  const css = fs.readFileSync(path.join(ROOT, 'store.css'), 'utf8');
  const hero = css.match(/\.detail-hero\.has-shot\s*\{([^}]*)\}/);
  assert.ok(hero, '.detail-hero.has-shot rule exists');
  assert.match(hero[1], /height:\s*auto/, 'hero hugs the image height (height:auto)');
  const img = css.match(/\.detail-hero\.has-shot img\s*\{([^}]*)\}/);
  assert.ok(img, '.detail-hero.has-shot img rule exists');
  assert.ok(!/object-fit:\s*cover/.test(img[1]), 'hero image must not cover-crop');
  assert.match(img[1], /height:\s*auto/, 'hero image height:auto');
});

test('lightbox keyboard navigation is wired in source', () => {
  assert.match(CODE, /function openLightbox/, 'has openLightbox');
  assert.match(CODE, /function stepLightbox/, 'has stepLightbox');
  assert.match(CODE, /ArrowLeft/, 'handles ArrowLeft');
  assert.match(CODE, /ArrowRight/, 'handles ArrowRight');
  assert.match(CODE, /closeLightbox\(\);\s*closeModal\(\)/, 'Escape closes the lightbox');
});

test('every grid card exposes name, category, tagline, and a price', () => {
  const { html } = run('productGrid', '');
  const cards = html.split('class="product-card"').slice(1);
  assert.ok(cards.length >= 60);
  for (const c of cards) {
    const id = (c.match(/id=([^"&]+)/) || [])[1];
    assert.match(c, /class="p-name">[^<]+</, `${id}: has a name`);
    assert.match(c, /class="p-cat">[^<]+</, `${id}: has a category`);
    assert.match(c, /class="p-tag">[^<]+</, `${id}: has a tagline`);
    assert.match(c, /class="amt[^"]*">[^<]+</, `${id}: has a price`);
  }
});

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
