# Galeria Hermes Santos — site

Static HTML, CSS and JavaScript. No build step, no package install. Deployed on Vercel
(`hermes-santos-gallery`) straight from this repository.

## Preview

Run `python -m http.server 8090 --bind 127.0.0.1` and open http://127.0.0.1:8090/ (English: `/?lang=en`).

## Structure

| File | Role |
| --- | --- |
| `index.html` | Page markup, PT text, head script that starts the preloader/intro with safety timers |
| `hero.css`, `hero.js` | Approved gallery-room hero (entrance timeline, compact menu). `hero.js` waits for `window.HermesIntro` so the room lights up as the preloader curtain lifts |
| `site.css`, `site.js` | Everything after the hero: preloader, sticky top bar, manifesto, horizontal featured works, counters, collection grid with filters and artwork dialog, about, exhibitions timeline, press, visit |
| `data/conteudo.js` | Contact, exhibitions, honours, press and EN translations of techniques/materials — taken from hermessantos.com.br |
| `data/obras.json` / `data/obras.js` | 40 works (title, year, technique, dimensions, material, photos) from the current site |
| `data/rede.js` | Voronoi line network (the pattern of the openwork sculptures) drawn in the preloader and the visit section |
| `assets/obras/` | Artwork photos as WebP: `-g` (up to 1800 px) and `-p` (up to 760 px) |
| `assets/vendor/lenis.*` | Lenis 1.1.20 smooth scroll, vendored |
| `ferramentas/` | Python scripts that regenerate the data and images (`baixar_obras.py`, `baixar_extras.py`, `gerar_rede.py`) |

## Editing content

- Text in Portuguese lives in `index.html`; English strings are in the `T` object at the top of `site.js`.
- Exhibitions, press, contact: `data/conteudo.js`.
- Works: edit `data/obras.json` and regenerate `data/obras.js` (`ferramentas/baixar_extras.py` does it), or edit `data/obras.js` directly.
- Featured works: `DESTAQUES` list in `site.js`.

## Motion and fallbacks

- Preloader: counter 0–100, network drawing, gold sheen on the logo, curtain. Shorter on the second load in the same tab session. `site.js` always ends it within ~5.6 s; if `site.js` never runs, the head script removes it at 6 s.
- Reveals (`data-rv="up" | "words" | "develop"`), counters, gold sweep and 3D buttons only run with the `motion` class, which is not added under `prefers-reduced-motion`. Without JavaScript the page shows all PT content statically except the JS-rendered lists.
- WhatsApp buttons (artwork interest, book a visit) open `wa.me` with a prefilled message.

## Validation

Checked in headless Edge (desktop 1440×900 and mobile 390×844, PT and EN): no console errors, all sections render, dialog and menu open. Not certified: full WCAG AA audit, production Lighthouse scores, real-device Safari.
