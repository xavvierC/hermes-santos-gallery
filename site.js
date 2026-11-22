/* Galeria Hermes Santos — comportamento do site.
   Preloader com a rede se desenhando, rolagem suave (Lenis), PT/EN, revelações na rolagem,
   destaques em rolagem horizontal, acervo com filtros e ficha da obra, linha do tempo, imprensa e visita.
   Os dados vêm de data/conteudo.js, data/obras.js e data/rede.js. */
(() => {
  const raiz = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const H = window.HERMES || {};
  const OBRAS = window.HERMES_OBRAS || [];
  const REDE = window.HERMES_REDE || {};
  const movimento = raiz.classList.contains('motion');
  const EN = new URLSearchParams(location.search).get('lang') === 'en';
  const fimIntro = () => window.__fimIntro && window.__fimIntro();
  window.__hsAssumiu = true;

  /* ---------- textos em inglês (o português já está no HTML) ---------- */
  const T = {
    pular: 'Skip to content', menu: 'Menu', fechar: 'Close', rolar: 'Scroll to content',
    'nav.obras': 'Works', 'nav.sobre': 'About', 'nav.exposicoes': 'Exhibitions', 'nav.imprensa': 'Press', 'nav.contato': 'Contact',
    'hero.sub': 'ART GALLERY', 'hero.alt': 'Zona Neutra, by Hermes Santos: a disc of light fibres around a dark centre',
    'm.rotulo': 'Studio · Alphaville, São Paulo',
    'm.titulo': 'Between steel and the <em class="ouro">poetry of form.</em>',
    'm.texto': 'Three decades of industry turned into sculpture, painting, glass and light. Works born from the precision of the machine that end in the lightness of the gesture.',
    'm.cta': 'Explore the works',
    'd.rotulo': 'Featured works', 'd.titulo': 'Matter that <em class="ouro">glows.</em>',
    'n.aria': 'In numbers', 'n.obras': 'works in the collection', 'n.eventos': 'exhibitions and events',
    'n.paises': 'countries: Brazil, USA and Uruguay', 'n.anos': 'years of industry and engineering',
    'a.rotulo': 'Collection', 'a.titulo': 'All works', 'a.filtrar': 'Filter by technique',
    's.rotulo': 'About the artist', 's.titulo': 'A <em class="ouro">seeker.</em>', 's.alt': 'Portrait of Hermes Santos',
    's.p1': 'Hermes Santos is a visual artist and designer with a singular background. Trained in mechanics and with more than three decades in automotive manufacturing, he developed his artistic practice on his own, through direct observation of materials and experimentation with the processes that transform matter.',
    's.p2': 'Founder of Modefer, a reference in the auto parts industry, he draws on his experience in management and engineering to bring the technologies of his industrial park — robotics, laser cutting and additive manufacturing — to aesthetic ends.',
    's.p3': 'He describes his method as that of a seeker. The discipline and precision of heavy industry merge with an interest in organic forms and fluidity, in works that explore the duality between technical rigidity and visual lightness.',
    's.p4': 'He lives and works in São Paulo. His production ranges from steel and brass sculptures to paintings, glass works and multimedia installations, and is part of private collections and international exhibitions.',
    'e.rotulo': 'Exhibitions and awards', 'e.titulo': 'From São Paulo to <em class="ouro">New York.</em>', 'e.honrarias': 'Honours',
    'i.rotulo': 'Press', 'i.titulo': 'In the press',
    'v.rotulo': 'Galeria Hermes Santos', 'v.titulo': 'Visit the <em class="ouro">gallery.</em>',
    'v.endereco': 'Address', 'v.mapa': 'Get directions ↗', 'v.horario': 'Opening hours',
    'v.horas': 'Monday to Friday, 9 am to 6 pm<br>Saturday, 9 am to 1 pm', 'v.contato': 'Contact', 'v.agendar': 'Book a visit',
    'f.ano': 'Year', 'f.dimensoes': 'Dimensions', 'f.material': 'Material', 'f.interesse': 'I’m interested',
    'f.anterior': '← Previous', 'f.proxima': 'Next →',
  };
  const txt = (pt, en) => (EN ? en : pt);
  const MESES = EN ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function traduzir() {
    if (!EN) return;
    raiz.lang = 'en';
    const desc = $('meta[name="description"]');
    if (desc) desc.content = 'Galeria Hermes Santos in Alphaville, São Paulo. Steel, brass and glass sculptures, paintings and installations by the artist Hermes Santos.';
    $$('[data-i18n]').forEach(el => { const v = T[el.dataset.i18n]; if (v) el.innerHTML = v; });
    $$('[data-i18n-alt]').forEach(el => { const v = T[el.dataset.i18nAlt]; if (v) el.alt = v; });
    $$('[data-i18n-aria]').forEach(el => { const v = T[el.dataset.i18nAria]; if (v) el.setAttribute('aria-label', v); });
    const brand = $('.gallery-brand'); if (brand) brand.href = '?lang=en';
  }

  function idiomas() {
    const troca = $('[data-idioma-troca]');
    if (troca) { troca.textContent = EN ? 'PT' : 'EN'; troca.href = EN ? './' : '?lang=en'; troca.lang = EN ? 'pt-BR' : 'en'; }
    $$('[data-idioma]').forEach(a => {
      if ((a.dataset.idioma === 'en') === EN) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------- utilidades ---------- */
  const el = (tag, cls, texto) => { const e = document.createElement(tag); if (cls) e.className = cls; if (texto != null) e.textContent = texto; return e; };
  const tecnica = t => (EN ? (H.tecnicaEn || {})[t] || t : t);
  const material = m => {
    if (!EN || !m) return m;
    return (H.materialEn || []).reduce((s, [a, b]) => s.split(a).join(b), m);
  };
  const zap = msg => `https://wa.me/${(H.contato || {}).whatsapp}?text=${encodeURIComponent(msg)}`;
  const dataCurta = d => {
    if (!d) return '—';
    const [dia, mes] = d.split('/');
    const m = MESES[+mes - 1];
    return EN ? `${m} ${+dia}` : `${dia} ${m}`;
  };
  const srcset = f => `${f.p} 760w, ${f.g} ${Math.min(f.w, 1800)}w`;

  /* ---------- palavras sob máscara ---------- */
  let contaPalavra = 0;
  function dividir(no, ouro) {
    [...no.childNodes].forEach(filho => {
      if (filho.nodeType === 3) {
        const partes = filho.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        partes.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.append(document.createTextNode(' ')); return; }
          const caixa = el('span', 'palavra');
          const dentro = el('span', null, p);
          dentro.style.setProperty('--i', contaPalavra++);
          caixa.append(dentro);
          frag.append(caixa);
        });
        filho.replaceWith(frag);
      } else if (filho.nodeType === 1 && filho.tagName !== 'BR') {
        if (filho.classList.contains('ouro')) filho.classList.add('dividido');
        dividir(filho, ouro || filho.classList.contains('ouro'));
      }
    });
  }
  function prepararPalavras() {
    if (!movimento) return;
    $$('[data-rv="words"]').forEach(t => {
      contaPalavra = 0;
      t.setAttribute('aria-label', t.textContent.replace(/\s+/g, ' ').trim());
      dividir(t);
      $$('.palavra', t).forEach(p => p.setAttribute('aria-hidden', 'true'));
    });
  }

  /* ---------- revelar ao rolar ---------- */
  const observador = 'IntersectionObserver' in window ? new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visto');
      observador.unobserve(e.target);
      if (e.target.__aoVer) e.target.__aoVer();
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: .12 }) : null;
  const observar = (alvo, aoVer) => {
    if (aoVer) alvo.__aoVer = aoVer;
    if (observador && movimento) observador.observe(alvo);
    else { alvo.classList.add('visto'); if (aoVer) aoVer(); }
  };
  function prepararRevelacoes() {
    $$('[data-rv]').forEach(alvo => {
      if (alvo.dataset.rv === 'up') {
        const irmaos = [...alvo.parentElement.children].filter(x => x.dataset.rv === 'up');
        alvo.style.setProperty('--atraso', `${Math.min(irmaos.indexOf(alvo), 5) * 0.09}s`);
      }
      observar(alvo);
    });
    const manifesto = $('#manifesto'); if (manifesto) observar(manifesto);
    $$('[data-conta]').forEach(n => {
      const fim = +n.dataset.conta;
      if (!movimento) return;
      n.textContent = '0';
      observar(n, () => {
        const t0 = performance.now(), dur = 1800;
        const passo = t => {
          const p = Math.min(1, (t - t0) / dur);
          n.textContent = Math.round(fim * (1 - Math.pow(2, -10 * p)));
          if (p < 1) requestAnimationFrame(passo); else n.textContent = fim;
        };
        requestAnimationFrame(passo);
      });
    });
  }

  /* ---------- rede de linhas (Voronoi das esculturas) ---------- */
  function desenharRede(svg, caminhos, durMax) {
    if (!svg || !caminhos || !caminhos.length) return;
    const ns = 'http://www.w3.org/2000/svg';
    const n = caminhos.length;
    caminhos.forEach((d, i) => {
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      p.style.setProperty('--d', `${(i / n) * durMax}s`);
      p.style.setProperty('--dur', `${0.8 + (i % 5) * 0.15}s`);
      svg.append(p);
    });
  }

  /* ---------- preloader ---------- */
  function preloader() {
    const tela = $('#preloader');
    if (!raiz.classList.contains('com-preloader') || !tela) { fimIntro(); return; }
    let jaViu = false;
    try { jaViu = sessionStorage.getItem('hs-intro') === '1'; sessionStorage.setItem('hs-intro', '1'); } catch (e) { /* sem armazenamento */ }
    const rede = $('#plRede');
    desenharRede(rede, REDE.preloader, jaViu ? 0.5 : 1.3);
    requestAnimationFrame(() => requestAnimationFrame(() => rede && rede.classList.add('desenha')));
    const num = $('#plNum'), barra = $('#plBarra');
    const t0 = performance.now();
    const minimo = jaViu ? 600 : 2100, maximo = 4200;
    let carregado = document.readyState === 'complete', valor = 0, saiu = false, limpo = false;
    window.addEventListener('load', () => { carregado = true; }, { once: true });
    // fim garantido: mesmo se a aba ficar em segundo plano, a página nunca fica presa sem rolagem
    const limpar = () => {
      if (limpo) return; limpo = true;
      raiz.classList.remove('com-preloader', 'preloader-sai'); tela.remove(); fimIntro(); if (lenis) lenis.start();
    };
    const sair = () => {
      if (saiu) return; saiu = true;
      raiz.classList.add('preloader-sai');
      setTimeout(fimIntro, 250);
      setTimeout(limpar, 1050);
    };
    setTimeout(limpar, 5600);
    const quadro = t => {
      if (saiu) return;
      const decorrido = t - t0;
      const pronto = (carregado && decorrido > minimo) || decorrido > maximo;
      const alvo = pronto ? 100 : Math.min(92, (decorrido / minimo) * 92);
      valor += (alvo - valor) * (pronto ? 0.2 : 0.08);
      if (pronto && valor > 99.4) valor = 100;
      num.textContent = Math.floor(valor);
      barra.style.transform = `scaleX(${valor / 100})`;
      if (valor >= 100) { setTimeout(sair, 180); return; }
      requestAnimationFrame(quadro);
    };
    requestAnimationFrame(quadro);
  }

  /* ---------- rolagem suave ---------- */
  let lenis = null;
  function rolagem() {
    if (movimento && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      if (raiz.classList.contains('com-preloader')) lenis.stop();
    }
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      const alvo = id.length > 1 && $(id);
      if (!alvo) return;
      e.preventDefault();
      fecharMenu();
      if (lenis) lenis.scrollTo(alvo, { offset: alvo.id === 'conteudo' ? 0 : -20, duration: 1.6 });
      else alvo.scrollIntoView({ behavior: movimento ? 'smooth' : 'auto' });
      if (id !== '#conteudo') history.replaceState(null, '', location.search + id);
    });
  }

  /* ---------- topo fixo e menu ---------- */
  const topo = $('#topo'), menuBtn = $('.topo-menu'), menuCheio = $('#menuCheio');
  function fecharMenu() {
    if (!menuCheio || menuCheio.hidden) return;
    menuCheio.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = EN ? 'Menu' : 'Menu';
    if (lenis) lenis.start();
  }
  function topoEMenu() {
    const hero = $('.gallery-hero');
    const mostrar = v => { topo.classList.toggle('ver', v); topo.inert = !v; };
    mostrar(false);
    if (observador) {
      new IntersectionObserver(([e]) => mostrar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0, rootMargin: '-80px 0px 0px 0px' }).observe(hero);
    } else mostrar(true);
    menuBtn.addEventListener('click', () => {
      const abrir = menuCheio.hidden;
      if (!abrir) { fecharMenu(); return; }
      menuCheio.hidden = false;
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.textContent = EN ? 'Close' : 'Fechar';
      if (lenis) lenis.stop();
      const primeiro = $('a', menuCheio); if (primeiro) primeiro.focus();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menuCheio.hidden) { fecharMenu(); menuBtn.focus(); } });
    // link da seção atual
    const links = $$('.topo-links a');
    const secoes = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
    if (observador) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => (a.getAttribute('href') === `#${e.target.id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
      }), { rootMargin: '-45% 0px -50% 0px' });
      secoes.forEach(s => io.observe(s));
    }
  }

  /* ---------- ficha da obra ---------- */
  const ficha = $('#ficha');
  let lista = OBRAS, atual = 0, fotoAtual = 0;
  function mostrarFoto(i) {
    const o = lista[atual];
    fotoAtual = i;
    const f = o.fotos[i];
    const palco = $('#fPalco');
    palco.textContent = '';
    const img = el('img');
    img.src = f.g; img.width = f.w; img.height = f.h; img.decoding = 'async';
    img.alt = `${o.titulo}, ${txt('de Hermes Santos', 'by Hermes Santos')}${o.fotos.length > 1 ? ` — ${txt('foto', 'photo')} ${i + 1}/${o.fotos.length}` : ''}`;
    palco.append(img);
    $$('#fMinis button').forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
  }
  function abrirFicha(obras, i) {
    lista = obras; atual = (i + obras.length) % obras.length;
    const o = lista[atual];
    $('#fTecnica').textContent = tecnica(o.tecnica);
    $('#fTitulo').textContent = o.titulo;
    $('#fAno').textContent = o.ano || '—';
    $('#fDim').textContent = o.dimensoes || '—';
    $('#fMat').textContent = material(o.material) || '—';
    $('#fInteresse').href = zap(txt(
      `Olá! Tenho interesse na obra "${o.titulo}" (${o.ano}), de Hermes Santos. Pode me passar mais informações?`,
      `Hello! I'm interested in the work "${o.titulo}" (${o.ano}) by Hermes Santos. Could you send me more information?`));
    const minis = $('#fMinis');
    minis.textContent = '';
    if (o.fotos.length > 1) {
      o.fotos.forEach((f, j) => {
        const b = el('button'); b.type = 'button';
        b.setAttribute('aria-label', `${txt('Foto', 'Photo')} ${j + 1}`);
        const im = el('img'); im.src = f.p; im.alt = ''; im.loading = 'lazy';
        b.append(im); b.addEventListener('click', () => mostrarFoto(j));
        minis.append(b);
      });
    }
    mostrarFoto(0);
    if (!ficha.open) {
      ficha.showModal();
      if (lenis) lenis.stop();
      raiz.style.overflow = 'hidden';
    }
  }
  function prepararFicha() {
    if (!ficha || !ficha.showModal) return;
    $('[data-fechar]', ficha).addEventListener('click', () => ficha.close());
    $('#fAnt').addEventListener('click', () => abrirFicha(lista, atual - 1));
    $('#fProx').addEventListener('click', () => abrirFicha(lista, atual + 1));
    ficha.addEventListener('close', () => { if (lenis) lenis.start(); raiz.style.overflow = ''; });
    ficha.addEventListener('keydown', e => {
      if (e.target.closest('a, button') && (e.key === 'Enter' || e.key === ' ')) return;
      const o = lista[atual];
      if (e.key === 'ArrowRight') { e.preventDefault(); o.fotos.length > 1 && fotoAtual < o.fotos.length - 1 ? mostrarFoto(fotoAtual + 1) : abrirFicha(lista, atual + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); o.fotos.length > 1 && fotoAtual > 0 ? mostrarFoto(fotoAtual - 1) : abrirFicha(lista, atual - 1); }
    });
  }

  /* ---------- destaques (rolagem horizontal) ---------- */
  const DESTAQUES = ['obra-solar', 'ganesh', 'horse-power', 'resiliencia', 'amonite', 'gravidade', 'sea-dragon', 'jelly-fish'];
  function destaques() {
    const secao = $('#destaques'), trilho = $('#dTrilho');
    const obras = DESTAQUES.map(id => OBRAS.find(o => o.id === id)).filter(Boolean);
    if (!obras.length) { secao.hidden = true; return; }
    obras.forEach((o, i) => {
      const f = o.fotos[0];
      const b = el('button', 'd-item'); b.type = 'button'; b.dataset.cursor = txt('Ver', 'View');
      b.setAttribute('aria-label', `${o.titulo}, ${o.ano} — ${txt('ver ficha', 'view details')}`);
      const mold = el('span', 'd-moldura'); mold.style.setProperty('--ar', (f.w / f.h).toFixed(3));
      const img = el('img'); img.src = f.p; img.srcset = srcset(f); img.sizes = '(max-width: 767px) 76vw, 50vw';
      img.alt = ''; img.loading = 'lazy'; img.width = f.w; img.height = f.h;
      mold.append(img);
      const leg = el('span', 'd-legenda');
      leg.append(el('strong', null, o.titulo), el('span', null, `${o.ano} · ${tecnica(o.tecnica)}`));
      b.append(mold, leg);
      b.addEventListener('click', () => abrirFicha(obras, i));
      trilho.append(b);
    });
    $('#dTotal').textContent = String(obras.length).padStart(2, '0');
    const atualEl = $('#dAtual'), barra = $('#dBarra');
    const largo = matchMedia('(min-width: 768px) and (min-height: 521px)');
    let distancia = 0;
    const medir = () => {
      if (!largo.matches) { secao.style.height = ''; trilho.style.transform = ''; return; }
      distancia = Math.max(0, trilho.scrollWidth - innerWidth);
      secao.style.height = `${innerHeight + distancia}px`;
      atualizar();
    };
    let pedido = 0;
    const atualizar = () => {
      pedido = 0;
      if (!largo.matches) return;
      const topoSec = secao.getBoundingClientRect().top;
      const p = distancia ? Math.min(1, Math.max(0, -topoSec / distancia)) : 0;
      trilho.style.transform = `translate3d(${-p * distancia}px,0,0)`;
      barra.style.transform = `scaleX(${p})`;
      atualEl.textContent = String(Math.min(obras.length, Math.round(p * (obras.length - 1)) + 1)).padStart(2, '0');
    };
    addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(atualizar); }, { passive: true });
    addEventListener('resize', medir);
    largo.addEventListener('change', medir);
    $$('img', trilho).forEach(im => im.addEventListener('load', medir, { once: true }));
    medir();
  }

  /* ---------- acervo ---------- */
  function acervo() {
    const filtros = $('#filtros'), grade = $('#grade');
    const tecnicas = ['Escultura', 'Pintura', 'Instalação', 'Colagem'].filter(t => OBRAS.some(o => o.tecnica === t));
    let ativa = '';
    const botao = (rotulo, valor, total) => {
      const b = el('button', 'filtro', rotulo); b.type = 'button';
      b.setAttribute('aria-pressed', String(valor === ativa));
      b.append(el('small', null, total));
      b.addEventListener('click', () => { ativa = valor; $$('.filtro', filtros).forEach(x => x.setAttribute('aria-pressed', String(x === b))); render(true); });
      return b;
    };
    filtros.append(botao(txt('Todas', 'All'), '', OBRAS.length));
    tecnicas.forEach(t => filtros.append(botao(tecnica(t), t, OBRAS.filter(o => o.tecnica === t).length)));
    const render = trocou => {
      const obras = ativa ? OBRAS.filter(o => o.tecnica === ativa) : OBRAS;
      grade.textContent = '';
      obras.forEach((o, i) => {
        const f = o.fotos[0];
        const li = el('li');
        const b = el('button', 'obra'); b.type = 'button'; b.dataset.cursor = txt('Ver', 'View');
        const fig = el('span', 'obra-foto');
        const img = el('img'); img.src = f.p; img.srcset = srcset(f); img.sizes = '(max-width: 600px) 92vw, (max-width: 1100px) 46vw, 25vw';
        img.alt = `${o.titulo}, ${tecnica(o.tecnica).toLowerCase()} ${txt('de', 'from')} ${o.ano}`; img.loading = 'lazy'; img.width = f.w; img.height = f.h;
        fig.append(img);
        const leg = el('span', 'obra-leg');
        leg.append(el('strong', null, o.titulo), el('span', null, `${o.ano} · ${tecnica(o.tecnica)}`));
        b.append(fig, leg);
        b.addEventListener('click', () => abrirFicha(obras, i));
        li.append(b);
        li.style.setProperty('--atraso', `${(trocou ? i % 8 : i % 4) * 0.08}s`);
        grade.append(li);
        observar(li);
      });
    };
    render(false);
  }

  /* ---------- exposições ---------- */
  function exposicoes() {
    const anos = $('#ltAnos');
    const grupos = new Map();
    (H.exposicoes || []).forEach(x => { if (!grupos.has(x.ano)) grupos.set(x.ano, []); grupos.get(x.ano).push(x); });
    [...grupos.keys()].sort((a, b) => b - a).forEach(ano => {
      const bloco = el('div', 'lt-ano');
      bloco.append(el('h3', null, ano));
      const ul = el('ul');
      grupos.get(ano).forEach((x, i) => {
        const li = el('li');
        li.style.setProperty('--atraso', `${Math.min(i, 8) * 0.06}s`);
        const titulo = el('span', 'lt-titulo', EN ? x.en || x.titulo : x.titulo);
        if (x.intl) titulo.append(el('span', 'lt-intl', txt('Internacional', 'International')));
        li.append(el('span', 'lt-data', dataCurta(x.data)), titulo, el('span', 'lt-lugar', EN ? x.lugarEn || x.lugar : x.lugar));
        ul.append(li);
      });
      bloco.append(ul);
      anos.append(bloco);
      observar(bloco);
    });
    const hon = $('#honrarias');
    (H.honrarias || []).forEach(h => hon.append(el('li', null, `${EN ? h.en : h.pt} (${h.ano})`)));
    // eixo que se preenche com a rolagem
    const linha = $('#linhaTempo'), barra = $('#ltBarra');
    let pedido = 0;
    const atualizar = () => {
      pedido = 0;
      const r = linha.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
      barra.style.transform = `scaleY(${p})`;
    };
    addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(atualizar); }, { passive: true });
    atualizar();
  }

  /* ---------- imprensa ---------- */
  function imprensa() {
    const lista = H.imprensa || [];
    const faixa = $('#faixa');
    const nomes = [...new Set(lista.map(m => m.veiculo.split(' · ')[0]))];
    for (let k = 0; k < 2; k++) nomes.forEach(n => faixa.append(el('span', null, n)));
    const ul = $('#materias');
    lista.forEach(m => {
      const li = el('li'); li.dataset.rv = 'up';
      const a = el('a'); a.href = m.url; a.target = '_blank'; a.rel = 'noopener';
      a.append(el('span', 'mt-veiculo', m.veiculo), el('span', 'mt-titulo', m.titulo), el('span', 'mt-data', EN ? m.dataEn : m.data));
      li.append(a); ul.append(li);
      observar(li);
    });
  }

  /* ---------- visita ---------- */
  function visita() {
    const c = H.contato || {};
    const end = $('#vEndereco');
    (c.endereco || []).forEach((linha, i) => { if (i) end.append(el('br')); end.append(document.createTextNode(linha)); });
    $('#vMapa').href = c.mapa;
    const email = $('#vEmail'); email.href = `mailto:${c.email}`; email.textContent = c.email;
    const tel = $('#vTel'); tel.href = `https://wa.me/${c.whatsapp}`; tel.textContent = `WhatsApp ${c.telefone}`;
    const i1 = $('#vInsta1'); i1.href = `https://www.instagram.com/${c.instagramArtista}/`; i1.textContent = `@${c.instagramArtista}`;
    const i2 = $('#vInsta2'); i2.href = `https://www.instagram.com/${c.instagramGaleria}/`; i2.textContent = `@${c.instagramGaleria}`;
    $('#vAgendar').href = zap(txt('Olá! Gostaria de agendar uma visita à Galeria Hermes Santos.', 'Hello! I would like to book a visit to Galeria Hermes Santos.'));
    const rede = $('#vRede');
    desenharRede(rede, REDE.visita, 2.4);
    observar($('#contato'), () => rede.classList.add('desenha'));
    $('#ano').textContent = new Date().getFullYear();
  }

  /* ---------- cursor ---------- */
  function cursor() {
    const c = $('#cursor'), rotulo = $('#cursorTexto');
    if (!c || !matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    let x = -100, y = -100, cx = -100, cy = -100, ativo = false;
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!ativo) { ativo = true; cx = x; cy = y; c.classList.remove('some'); }
      const alvo = e.target.closest('[data-cursor]');
      c.classList.toggle('grande', !!alvo);
      if (alvo) rotulo.textContent = alvo.dataset.cursor;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { ativo = false; c.classList.add('some'); });
    const passo = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      c.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  /* ---------- ordem de montagem ---------- */
  const tentar = (nome, fn) => { try { fn(); } catch (erro) { console.error(`[hermes] ${nome}`, erro); } };
  tentar('idioma', traduzir);
  tentar('idiomas', idiomas);
  tentar('rolagem', rolagem);
  tentar('preloader', preloader);
  tentar('palavras', prepararPalavras);
  tentar('topo', topoEMenu);
  tentar('ficha', prepararFicha);
  tentar('destaques', destaques);
  tentar('acervo', acervo);
  tentar('exposicoes', exposicoes);
  tentar('imprensa', imprensa);
  tentar('visita', visita);
  tentar('revelacoes', prepararRevelacoes);
  tentar('cursor', cursor);
  // se o endereço já vier com #secao, vai até ela depois de montar tudo
  if (location.hash.length > 1) {
    const alvo = $(location.hash);
    if (alvo) HermesIntro.then(() => setTimeout(() => (lenis ? lenis.scrollTo(alvo, { immediate: true }) : alvo.scrollIntoView()), 50));
  }
})();
