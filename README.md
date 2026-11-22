# Hermes Santos — site

Static HTML, CSS and JavaScript. No build step, no package install. Deployed on Vercel
(`hermes-santos-gallery`) straight from this repository: a push to `main` publishes.

## Preview

Run `python -m http.server 8090 --bind 127.0.0.1` and open http://127.0.0.1:8090/ (English: `/?lang=en`).

## Direction

The works live in the dark and the reading happens on paper. Almost every photo has a black background and
many pieces are painted with strontium aluminate, which glows in the dark, so the works sections are black
and the about/exhibitions/press block is light paper. Type: Newsreader (titles, long text, artwork titles in
italic) and Hanken Grotesk (navigation, captions, data), both from Google Fonts.

Signature: the **light switch** in the top bar. Works photographed both lit and glowing with the same framing
(`PARES` in `site.js`: Whale, Obra Solar) swap between the two photos; with the light on, a soft spotlight
appears behind the works. After the opening, the room goes dark on its own.

## Structure

| File | Role |
| --- | --- |
| `index.html` | Markup and PT text; head script starts the preloader with safety timers |
| `site.css` | All styles (tokens at the top) |
| `site.js` | Preloader, Lenis, PT/EN (`T` object), light switch, reveals, featured works, collection (images or list), artwork dialog, exhibitions, press, visit |
| `data/conteudo.js` | Contact, exhibitions, honours, press and EN translations of techniques/materials — taken from hermessantos.com.br |
| `data/obras.json` / `data/obras.js` | 40 works (title, year, technique, dimensions, material, photos) from the current site |
| `data/rede.js` | Voronoi line network (the pattern of the openwork sculptures) drawn in the preloader and the visit section |
| `assets/obras/` | Artwork photos as WebP: `-g` (up to 1800 px) and `-p` (up to 760 px) |
| `assets/hermes-marca.png` | Swoosh cropped from the official logo, used in the top bar |
| `assets/vendor/lenis.*` | Lenis 1.1.20 smooth scroll, vendored |
| `ferramentas/` | Python scripts that regenerate the data and images (`baixar_obras.py`, `baixar_extras.py`, `gerar_rede.py`) |

## Editing content

- Portuguese text lives in `index.html`; English strings are in the `T` object at the top of `site.js`.
- Exhibitions, press, contact: `data/conteudo.js`.
- Works: edit `data/obras.json` and regenerate `data/obras.js` (`ferramentas/baixar_extras.py` does it), or edit `data/obras.js` directly.
- Featured works: `DESTAQUES` list in `site.js`. Lit/glow photo pairs: `PARES` (only pairs with identical framing).

## Motion and fallbacks

- Preloader: counter, network drawing that turns phosphor green when loaded, curtain. Shorter on the second load in the same tab session. `site.js` always ends it within ~6.2 s; if `site.js` never runs, the head script removes it at 6 s.
- Reveals (`data-rv="up" | "words" | "develop"`), the paper block opening, caption parallax and the custom "View" cursor only run with the `motion` class, which is not added under `prefers-reduced-motion` (the light starts off and nothing animates).
- WhatsApp buttons (artwork interest, book a visit) open `wa.me` with a prefilled message.

## Validation

Checked in headless Edge (desktop 1440×900 PT and mobile 390×844 EN): no console errors, no horizontal overflow,
all sections render, light switch, list view, menu and artwork dialog work. Not certified: full WCAG AA audit,
production Lighthouse scores, real-device Safari, reduced-motion mode in a real browser.
