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

Opening: the gallery room from the original approved hero (`assets/gallery-room.webp`, `gallery-bench.webp`,
`zona-neutra-hero.webp`). When the preloader ring opens, the room appears, the spotlight comes on over
Zona Neutra, then the bench and the name (timings in the `.sala` block of `site.css`).

Signature: the **light switch** in the top bar. The site starts with the light on. Turning it off darkens the
room (the spotlight and floor reflections go away) and works photographed both lit and glowing with the same
framing (`PARES` in `site.js`: Whale, Obra Solar) swap to the glowing photo; with the light on, a soft spotlight
appears behind them. The button pulses once after the opening so visitors notice it.

## Structure

| File | Role |
| --- | --- |
| `index.html` | Markup and PT text; head script starts the preloader with safety timers |
| `site.css` | All styles (tokens at the top) |
| `site.js` | Preloader, Lenis, PT/EN (`T` object), light switch, reveals, featured works, collection (images or list), artwork dialog, exhibitions, press, visit |
| `data/conteudo.js` | Contact, honours and EN translations of techniques/materials — taken from hermessantos.com.br |
| `data/agenda.json` / `data/agenda.js` | Exhibitions/events and press (edited in the panel) |
| `api/painel.js`, `painel/` | The editing panel: server function and page |
| `data/obras.json` / `data/obras.js` | 40 works (title, year, technique, dimensions, material, photos) from the current site |
| `data/rede.js` | Voronoi line network (the pattern of the openwork sculptures) drawn behind the visit section |
| `assets/og.jpg`, `ferramentas/og.html` | Link preview image (1200×630) for WhatsApp/Instagram/Facebook and the template it was rendered from |
| `robots.txt` | Keeps search engines out while the site is in approval, but lets link-preview bots read the page |
| `assets/obras/` | Artwork photos as WebP: `-g` (up to 1800 px) and `-p` (up to 760 px) |
| `assets/hermes-marca.png` | Swoosh cropped from the official logo, used in the top bar |
| `assets/vendor/lenis.*` | Lenis 1.1.20 smooth scroll, vendored |
| `ferramentas/` | Python scripts that regenerate the data and images (`baixar_obras.py`, `baixar_extras.py`, `gerar_rede.py`) |

## Panel (`/painel`)

Hermes edits works (with photos), exhibitions/events and press himself at `/painel` (password login, PT-BR,
works on the phone). Each "Salvar no site" sends the full data to `api/painel.js`, which validates it and writes
one commit to `main` through the GitHub API (data files + new photos; photos no longer used are deleted).
Vercel then redeploys, so the change is live in about a minute. Photos are resized in the browser
(up to 1600 px and 760 px, WebP or JPEG on older Safari) before upload.

- Data it owns: `data/obras.json` + `data/obras.js` (works; `destaque: 1–6` = featured order on the home page)
  and `data/agenda.json` + `data/agenda.js` (exhibitions and press). The `.js` files are generated: edit through
  the panel, or edit the `.json` and the matching `.js` together.
- Safety: password checked on the server, signed 12-hour session, strict validation of every field and photo path,
  refuses to save if more than 3 items would disappear at once, and refuses stale saves (someone saved in between).
- Setup on Vercel (Project → Settings → Environment Variables, Production), then redeploy:
  - `PAINEL_SENHA`: the panel password (8+ characters).
  - `GITHUB_TOKEN`: a fine-grained GitHub token for this repository only, permission "Contents: Read and write".
  Without them the panel answers that it is not configured; the public site is not affected.
- The panel commits to GitHub, so **run `git pull` before editing the site locally**.
- Local test without GitHub: copy the site to another folder and run
  `node ferramentas/servidor-painel.mjs <copy> 3197` with `PAINEL_SENHA` and `PAINEL_LOCAL_DIR=<copy>` set;
  changes are written to the copy.

## Editing content

- Portuguese text lives in `index.html`; English strings are in the `T` object at the top of `site.js`.
- Works, exhibitions and press: through the panel (`/painel`).
- Contact, honours and EN translations of techniques/materials: `data/conteudo.js`.
- Featured works: the `destaque` field (1–6) set in the panel. Lit/glow photo pairs: `PARES` in `site.js` (only pairs with identical framing).
- `ferramentas/baixar_obras.py` / `baixar_extras.py` were used once to import the old site; do not rerun them (they would overwrite panel edits).
- Copy is deliberately short: one-line introduction, four-paragraph biography in a single text style. Exhibitions show the two latest years and press the five latest articles; a "see all" button opens the rest.
- When the site moves to its own domain, update the absolute `og:url` and `og:image` addresses in `index.html`.

## Motion and fallbacks

- Preloader: the official logo with a thin ring that completes as the page loads; at 100 % the ring glows and then expands past the screen edges while a soft circular opening in the black background reveals the site. About 3 s on the first visit, shorter on the second load in the same tab session. `site.js` always ends it within ~7.5 s; if `site.js` never runs, the head script removes it at 6 s.
- Reveals (`data-rv="up" | "words" | "develop"`), the paper block opening, caption parallax and the custom "View" cursor only run with the `motion` class, which is not added under `prefers-reduced-motion` (the light starts off and nothing animates).
- WhatsApp buttons (artwork interest, book a visit) open `wa.me` with a prefilled message.

## Validation

Checked in headless Edge (desktop 1440×900 PT and mobile 390×844 EN): no console errors, no horizontal overflow,
all sections render, light switch, list view, menu and artwork dialog work. Not certified: full WCAG AA audit,
production Lighthouse scores, real-device Safari, reduced-motion mode in a real browser.
