# app-store

MenkeTechnologies App Store — a static storefront for selling the
MenkeTechnologies audio products: **audio haxor** (Tauri/JUCE plugin scanner),
**traderview** (self-hosted trading journal), **zpwr-synth** (JUCE synthesizer
plugin), and **zpwr-fx** (JUCE multi-effect plugin).

Uses the same HUD / cyberpunk design system as the strykelang docs
(`hud-static.css`, `tutorial.css`, `hud-theme.js`) so the store and the docs
share one visual language: Orbitron + Share Tech Mono, CRT scanlines, neon
borders, and five swappable color schemes (Cyberpunk, Midnight, Matrix, Ember,
Arctic) plus light/dark.

## Run

Pure static site — no build step. Open `index.html` in a browser, or serve the
directory:

```
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Layout

| File            | Purpose                                                        |
|-----------------|---------------------------------------------------------------|
| `index.html`    | Storefront: hero, search, category filters, product grid      |
| `product.html`  | Product detail page, reads `?id=<product>` from the URL        |
| `store.js`      | Product catalog (single source of truth) + grid/cart/checkout |
| `store.css`     | Commerce surfaces (cards, prices, cart, modal, detail)        |
| `hud-static.css`| Vendored design system — CSS variables, header, buttons, CRT  |
| `tutorial.css`  | Vendored section / card / animation styles                    |
| `hud-theme.js`  | Theme / CRT / neon toggles + color-scheme switcher            |

## Editing the catalog

All products, prices, license tiers, and feature copy live in the `PRODUCTS`
array at the top of `store.js`. The grid, the detail page, the cart, and the
checkout all read from it — nothing is duplicated. To add a product, append one
object; to change a price, edit its `tiers`.

Prices are whole USD; `price: 0` (or a `$0` tier) renders as **Free**. The
cart, totals, and checkout are client-side only — wire `store.js`'s checkout
submit handler to a real payment backend (Stripe, etc.) before taking money.
