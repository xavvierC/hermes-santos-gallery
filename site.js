/* Hermes Santos — comportamento do site.
   Preloader (a rede das esculturas se desenha e acende), rolagem suave (Lenis), PT/EN, luz da galeria
   (as obras com par de fotos trocam entre a foto com luz e a foto brilhando no escuro), revelações na rolagem,
   obras em destaque, acervo em imagens ou lista, ficha da obra, exposições, imprensa e visita.
   Os dados vêm de data/conteudo.js, data/obras.js e data/rede.js. */
(() => {
  const raiz = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const H = window.HERMES || {};
  const OBRAS = window.HERMES_OBRAS || [];
  const AGENDA = window.HERMES_AGENDA || {}; // exposições e matérias (editadas pelo painel)
  const REDE = window.HERMES_REDE || {};
  const movimento = raiz.classList.contains('motion');
  const EN =new URLSearchParams(location.search).get('lang') === 'en';
  const intro = window.HermesIntro || Promise.resolve();
  const fimIntro = () => window.__fimIntro && window.__fimIntro();
  window.__hsAssumiu = true;

  /* ---------- textos em inglês (o português está no HTML) ---------- */
  const T = {
    pular: 'Skip to content', inicio: 'Hermes Santos — home', secoes: 'Sections', menu: 'Menu', fechar: 'Close',
    'nav.obras': 'Works', 'nav.acervo': 'Collection', 'nav.sobre': 'About', 'nav.exposicoes': 'Exhibitions', 'nav.imprensa': 'Press', 'nav.visita': 'Visit',
    'sala.sub': 'Art gallery', 'sala.alt': 'Zona Neutra, by Hermes Santos: a disc of light fibres around a dark centre', 'ab.descer': 'See the works',
    'lede.aria': 'Introduction',
    'lede.c': 'Hermes Santos brings robotics, laser cutting and additive manufacturing from industry into sculpture.',
    'lede.link': 'About the artist',
    'd.titulo': 'Featured',
    'a.titulo': 'Collection', 'a.filtrar': 'Filter by technique', 'a.vista': 'Display', 'a.imagens': 'Images', 'a.lista': 'List',
    's.titulo': 'About the artist', 's.alt': 'Portrait of Hermes Santos',
    'e.titulo': 'Exhibitions', 'e.honrarias': 'Honours',
    'i.titulo': 'Press',
    'v.titulo': 'Visit the gallery', 'v.endereco': 'Address', 'v.mapa': 'Get directions', 'v.horario': 'Opening hours',
    'v.horas': 'Monday to Friday, 9 am to 6 pm<br>Saturday, 9 am to 1 pm', 'v.contato': 'Contact', 'v.agendar': 'Book a visit',
    'r.endereco': 'Calçada dos Cravos, 63 — Alphaville Comercial, Barueri, SP, Brazil', 'r.topo': 'Back to top',
    'f.ano': 'Year', 'f.dimensoes': 'Dimensions', 'f.material': 'Material', 'f.interesse': 'I’m interested',
    'f.anterior': '← Previous', 'f.proxima': 'Next →',
    // biografia
    's.e1': 'Hermes Santos is a visual artist and designer. Trained in mechanics and with more than three decades in automotive manufacturing, he developed his artistic practice on his own, through direct observation of materials and experimentation with the processes that transform matter.',
    's.e2': 'Founder of Modefer, a reference in the auto parts industry, he brings the technologies of his industrial park — robotics, laser cutting and additive manufacturing — to aesthetic ends.',
    's.e3': 'He describes his method as that of a seeker: the discipline and precision of heavy industry meet an interest in organic forms, in works that explore the duality between technical rigidity and visual lightness.',
    's.e4': 'He lives and works in São Paulo. His production includes steel and brass sculptures, paintings, glass works and multimedia installations, and is part of private collections and international exhibitions.',
  };
  const txt = (pt, en) => (EN ? en : pt);
  const MESES = EN ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function traduzir() {
    if (!EN) return;
    raiz.lang = 'en';
    document.title = 'Hermes Santos — sculptor and visual artist';
    const desc = $('meta[name="description"]');
    if (desc) desc.content = 'Hermes Santos, sculptor and visual artist. Sculptures in steel, brass, resin and Murano crystal, paintings and installations. Gallery in Alphaville, Barueri (São Paulo).';
    $$('[data-i18n]').forEach(e => { const v = T[e.dataset.i18n]; if (v) e.innerHTML = v; });
    $$('[data-i18n-alt]').forEach(e => { const v = T[e.dataset.i18nAlt]; if (v) e.alt = v; });
    $$('[data-i18n-aria]').forEach(e => { const v = T[e.dataset.i18nAria]; if (v) e.setAttribute('aria-label', v); });
  }
  function idiomas() {
    const troca = $('[data-idioma-troca]');
    if (!troca) return;
    troca.textContent = EN ? 'PT' : 'EN';
    troca.href = EN ? location.pathname : `${location.pathname}?lang=en`; // fica na mesma página (início ou teste)
    troca.lang = EN ? 'pt-BR' : 'en';
    troca.setAttribute('aria-label', EN ? 'Ver em português' : 'View in English');
  }

  /* ---------- utilidades ---------- */
  const el = (tag, cls, texto) => { const e = document.createElement(tag); if (cls) e.className = cls; if (texto != null) e.textContent = texto; return e; };
  const tecnica = t => (EN ? (H.tecnicaEn || {})[t] || t : t);
  const material = m => {
    if (!m) return '—';
    if (!EN) return m;
    return (H.materialEn || []).reduce((s, [a, b]) => s.split(a).join(b), m);
  };
  const dimensoes = d => {
    if (!d) return '—';
    let s = d.replace(/\s*x\s*/g, ' × ');
    if (EN) s = s.replace('(altura)', '(height)').replace(' e ', ' and ').replace(' a ', ' to ');
    else s = s.replace(/(\d)\.(\d)/g, '$1,$2');
    return s;
  };
  const zap = msg => `https://wa.me/${(H.contato || {}).whatsapp}?text=${encodeURIComponent(msg)}`;
  const dataCurta = d => {
    if (!d) return '—';
    const [dia, mes] = d.split('/');
    const m = MESES[+mes - 1];
    return EN ? `${m} ${+dia}` : `${dia} ${m}`;
  };
  const srcset = f => `${f.p} 760w, ${f.g} ${Math.min(f.w, 1800)}w`;

  /* uma única fila de tarefas por quadro para tudo que depende da rolagem */
  const tarefas = [];
  let pedidoRol = 0;
  const rodarTarefas = () => { pedidoRol = 0; tarefas.forEach(f => f()); };
  const pedirQuadro = () => { if (!pedidoRol) pedidoRol = requestAnimationFrame(rodarTarefas); };
  addEventListener('scroll', pedirQuadro, { passive: true });
  addEventListener('resize', pedirQuadro);
  const aoRolar = f => { tarefas.push(f); f(); };

  /* ---------- luz da galeria ---------- */
  // obras fotografadas com luz e no escuro: [foto com luz, foto no escuro] (índices em data/obras.js)
  // (só pares com o mesmo enquadramento; Amonite e Owl foram fotografadas de ângulos diferentes)
  const PARES = { whale: [1, 0], 'obra-solar': [1, 0] };
  const apagada = () => raiz.classList.contains('luz-apagada');
  const fotoInicial = o => { const p = PARES[o.id]; return p ? p[apagada() ? 1 : 0] : 0; };
  let mexeuNaLuz = false, tempoLuz = 0;
  function rotuloLuz() {
    const t = $('#luzTexto');
    if (t) t.textContent = apagada() ? txt('Acender a luz', 'Lights on') : txt('Apagar a luz', 'Lights off');
  }
  function definirLuz(apagar) {
    if (apagada() === apagar) return;
    raiz.classList.remove('apagando', 'acendendo');
    if (movimento) {
      void raiz.offsetWidth;
      raiz.classList.add(apagar ? 'apagando' : 'acendendo');
      clearTimeout(tempoLuz);
      tempoLuz = setTimeout(() => raiz.classList.remove('apagando', 'acendendo'), 2000);
    }
    raiz.classList.toggle('luz-apagada', apagar);
    rotuloLuz();
  }
  function luz() {
    rotuloLuz();
    const b = $('#luz');
    if (b) b.addEventListener('click', () => { mexeuNaLuz = true; definirLuz(!apagada()); });
    // a sala começa acesa (a abertura é a luz revelando a obra); quando a entrada termina,
    // um pulso discreto mostra que dá para apagar a luz e ver as obras brilhando no escuro
    intro.then(() => setTimeout(() => {
      if (mexeuNaLuz || !movimento || !b) return;
      b.classList.add('chama'); setTimeout(() => b.classList.remove('chama'), 2700);
    }, 3800));
  }

  /* foto de uma obra; se ela tiver par, leva as duas versões sobrepostas */
  function foto(o, sizes) {
    const par = PARES[o.id];
    const caixa = el('span', par ? 'foto par' : 'foto');
    const base = o.fotos[par ? par[1] : 0];
    caixa.style.setProperty('--ar', (base.w / base.h).toFixed(4));
    const img = (f, cls) => {
      const i = el('img', cls);
      i.src = f.p; i.srcset = srcset(f); i.sizes = sizes; i.alt = '';
      i.width = f.w; i.height = f.h; i.loading = 'lazy'; i.decoding = 'async';
      return i;
    };
    if (par) caixa.append(img(o.fotos[par[0]], 'v-acesa'), img(o.fotos[par[1]], 'v-apagada'));
    else caixa.append(img(o.fotos[0]));
    return caixa;
  }

  /* ---------- palavras sob máscara ---------- */
  let contaPalavra = 0;
  function dividir(no) {
    [...no.childNodes].forEach(filho => {
      if (filho.nodeType === 3) {
        const frag = document.createDocumentFragment();
        filho.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.append(document.createTextNode(' ')); return; }
          const caixa = el('span', 'palavra');
          const dentro = el('span', null, p);
          dentro.style.setProperty('--i', contaPalavra++);
          caixa.append(dentro);
          frag.append(caixa);
        });
        filho.replaceWith(frag);
      } else if (filho.nodeType === 1 && filho.tagName !== 'BR') dividir(filho);
    });
  }
  function prepararPalavras() {
    if (!movimento) return;
    $$('[data-rv="words"]').forEach(t => {
      contaPalavra = 0;
      const texto = t.textContent.replace(/\s+/g, ' ').trim();
      dividir(t);
      // leitores de tela leem a frase inteira; as palavras soltas ficam só para a animação
      const visivel = el('span'); visivel.setAttribute('aria-hidden', 'true');
      visivel.append(...t.childNodes);
      t.append(el('span', 'sr', texto), visivel);
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
  }, { rootMargin: '0px 0px -8% 0px', threshold: .1 }) : null;
  const observar = (alvo, aoVer) => {
    if (!alvo) return;
    if (aoVer) alvo.__aoVer = aoVer;
    if (observador && movimento) observador.observe(alvo);
    else { alvo.classList.add('visto'); if (aoVer) aoVer(); }
  };
  function prepararRevelacoes() {
    $$('[data-rv]').forEach(alvo => {
      if (alvo.dataset.rv === 'up') {
        const irmaos = [...alvo.parentElement.children].filter(x => x.dataset.rv === 'up');
        alvo.style.setProperty('--atraso', `${Math.min(irmaos.indexOf(alvo), 5) * 0.08}s`);
      }
      observar(alvo);
    });
  }

  /* ---------- rede de linhas (Voronoi das esculturas vazadas) ---------- */
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
  let lenis = null;
  function preloader() {
    const tela = $('#preloader');
    if (!raiz.classList.contains('com-preloader') || !tela) { fimIntro(); return; }
    let jaViu = false;
    try { jaViu = sessionStorage.getItem('hs-intro') === '1'; sessionStorage.setItem('hs-intro', '1'); } catch (e) { /* sem armazenamento */ }
    const arco = $('#plArco'), trilho = $('#plTrilho'), anel = $('#plAnel'), fundo = $('.pl-fundo', tela);
    const R = 96;
    const t0 = performance.now();
    const minimo = jaViu ? 700 : 1500, maximo = 3600;
    let carregado = document.readyState === 'complete', valor = 0, saiu = false, limpo = false;
    window.addEventListener('load', () => { carregado = true; }, { once: true });
    // fim garantido: mesmo se a aba ficar em segundo plano, a página nunca fica presa sem rolagem
    const limpar = () => {
      if (limpo) return; limpo = true;
      raiz.classList.remove('com-preloader', 'preloader-sai'); tela.remove(); fimIntro(); if (lenis) lenis.start();
    };
    // o anel aceso cresce até passar das bordas; o furo no fundo preto acompanha e mostra o site
    const abrir = () => {
      if (saiu) return; saiu = true;
      raiz.classList.add('preloader-sai');
      setTimeout(fimIntro, 200);
      const fim = Math.hypot(innerWidth, innerHeight) / 2 + 120; // a borda do furo é suave (80px)
      const dur = jaViu ? 900 : 1150, t1 = performance.now();
      const passo = t => {
        const p = Math.min(1, (t - t1) / dur);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const r = R + (fim - R) * e;
        arco.setAttribute('r', r.toFixed(1)); trilho.setAttribute('r', r.toFixed(1));
        fundo.style.setProperty('--furo', `${(r - R * Math.pow(1 - e, 2) - 80).toFixed(1)}px`);
        anel.style.opacity = String(1 - Math.max(0, (p - 0.55) / 0.45));
        if (p < 1) requestAnimationFrame(passo); else limpar();
      };
      requestAnimationFrame(passo);
    };
    setTimeout(limpar, 7500);
    let chegou = false;
    const quadro = t => {
      if (chegou) return;
      const decorrido = t - t0;
      const pronto = (carregado && decorrido > minimo) || decorrido > maximo;
      const alvo = pronto ? 100 : Math.min(90, (decorrido / minimo) * 90);
      valor += (alvo - valor) * (pronto ? 0.12 : 0.06);
      if (pronto && valor > 99.6) valor = 100;
      arco.style.strokeDashoffset = (1 - valor / 100).toFixed(4); // o arco cresce no sentido horário, a partir do topo
      if (valor >= 100) { chegou = true; tela.classList.add('carregado'); setTimeout(abrir, jaViu ? 300 : 500); return; }
      requestAnimationFrame(quadro);
    };
    requestAnimationFrame(quadro);
  }

  /* ---------- rolagem suave ---------- */
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
      const y = Math.max(0, topoReal(alvo) + (alvo.id === 'conteudo' ? 0 : -84));
      if (lenis) lenis.scrollTo(y, { duration: 1.6 });
      else scrollTo({ top: y, behavior: movimento ? 'smooth' : 'auto' });
      if (id === '#conteudo') alvo.focus({ preventScroll: true });
      else history.replaceState(null, '', location.search + id);
    });
  }

  /* ---------- folhas: a seção de cima fica parada, desfoca e some enquanto a próxima sobe por cima ---------- */
  const folhas = [];
  let alturaTela = innerHeight;
  const estreita = matchMedia('(max-width: 767px)');
  // quanto a folha já foi coberta pela seguinte (0 a 1)
  const progresso = f => Math.min(1, Math.max(0, (f.topo - f.el.getBoundingClientRect().top) / f.T));
  // posição de um elemento no fluxo da página, sem o deslocamento das folhas presas (âncoras e menu)
  function topoReal(alvo) {
    let f = null;
    for (const g of folhas) if (g.pg.contains(alvo) && (!f || f.pg.contains(g.pg))) f = g;
    if (!f) return alvo.getBoundingClientRect().top + scrollY;
    return topoReal(f.el) + (alvo.getBoundingClientRect().top - f.pg.getBoundingClientRect().top) / f.escala;
  }
  function prepararFolhas() {
    const main = $('#conteudo'), papel = $('#papel');
    if (!movimento || !main || !('ResizeObserver' in window)) return;
    // a prévia da lista segue o cursor com position: fixed; fora das folhas ela não sofre com o desfoque
    const previa = $('#previa'); if (previa) document.body.append(previa);
    [[...main.children], papel ? [...papel.children] : []].forEach(filhos => {
      const pgs = filhos.filter(n => n.matches('section, .papel'));
      pgs.forEach((pg, i) => {
        pg.classList.add('pagina');
        if (i === pgs.length - 1) return; // a última de cada grupo só cobre a anterior
        const el = document.createElement('div');
        el.className = 'folha';
        pg.before(el); el.append(pg);
        folhas.push({ el, pg, T: 1, topo: 0, p: -1, escala: 1 });
      });
    });
    if (!folhas.length) return;
    raiz.classList.add('folhas');
    const sonda = document.createElement('div');
    sonda.setAttribute('aria-hidden', 'true');
    sonda.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
    document.body.append(sonda);
    let pedido = 0;
    const medir = () => {
      pedido = 0;
      alturaTela = sonda.offsetHeight || innerHeight;
      folhas.forEach(f => {
        const H = f.pg.offsetHeight;
        f.T = Math.max(1, Math.min(H, alturaTela)); // a próxima leva uma tela (ou a altura da folha) para cobrir
        f.topo = Math.min(0, alturaTela - H); // folha alta prende quando o fim dela chega ao pé da tela
        f.el.style.setProperty('--t', `${f.T}px`);
        f.pg.style.top = `${f.topo}px`;
        f.p = -1;
      });
      pedirQuadro();
    };
    const remedir = () => { if (!pedido) pedido = requestAnimationFrame(medir); };
    const ro = new ResizeObserver(remedir);
    folhas.forEach(f => ro.observe(f.pg));
    addEventListener('resize', remedir);
    medir();
    aoRolar(() => {
      const borrao = estreita.matches ? 8 : 14;
      folhas.forEach(f => {
        const p = Math.round(progresso(f) * 1000) / 1000;
        if (p === f.p) return;
        f.p = p;
        const s = f.pg.style;
        if (p === 0) { s.filter = s.opacity = s.transform = s.transformOrigin = s.willChange = ''; f.escala = 1; return; }
        f.escala = 1 - 0.05 * p;
        s.transformOrigin = `50% ${Math.round(alturaTela / 2 - f.topo)}px`; // encolhe a partir do meio do que está visível
        s.transform = `scale(${f.escala.toFixed(4)})`;
        if (p === 1) { s.filter = s.willChange = ''; s.opacity = '0'; return; } // coberta: não precisa mais desenhar
        s.willChange = 'filter, opacity, transform';
        s.filter = `blur(${(p * borrao).toFixed(2)}px)`;
        s.opacity = (1 - Math.pow(p, 1.4)).toFixed(3);
      });
    });
    // quem navega pelo teclado não pode cair numa folha coberta
    document.addEventListener('focusin', e => requestAnimationFrame(() => {
      const n = e.target;
      if (!n.matches || !n.matches(':focus-visible') || !folhas.some(f => f.pg.contains(n))) return;
      const r = n.getBoundingClientRect();
      if (r.top >= 0 && r.bottom <= innerHeight && !folhas.some(f => f.pg.contains(n) && progresso(f) > 0.02)) return;
      const y = Math.max(0, topoReal(n) - alturaTela * 0.35);
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
    }));
  }

  /* ---------- topo, menu e papel ---------- */
  const topo = $('#topo'), menuBtn = $('.topo-menu'), menuCheio = $('#menuCheio');
  function fecharMenu() {
    if (!menuCheio || menuCheio.hidden) return;
    menuCheio.hidden = true;
    raiz.classList.remove('menu-aberto');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menu';
    if (lenis) lenis.start();
  }
  function topoEMenu() {
    const papel = $('#papel'), visitaSec = $('#contato');
    const folhaPapel = folhas.find(f => f.pg === papel);
    // sobre o papel claro, o topo fica escuro (no fim, o papel escurece e a visita sobe por cima)
    aoRolar(() => {
      if (!papel) return;
      const r = papel.getBoundingClientRect();
      const coberto = (visitaSec && visitaSec.getBoundingClientRect().top <= 34) || (folhaPapel && progresso(folhaPapel) > 0.3);
      topo.classList.toggle('claro', r.top <= 34 && r.bottom > 34 && !coberto);
    });
    menuBtn.addEventListener('click', () => {
      if (!menuCheio.hidden) { fecharMenu(); return; }
      menuCheio.hidden = false;
      raiz.classList.add('menu-aberto');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.textContent = txt('Fechar', 'Close');
      if (lenis) lenis.stop();
      const primeiro = $('a', menuCheio); if (primeiro) primeiro.focus();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menuCheio.hidden) { fecharMenu(); menuBtn.focus(); } });
    // link da seção atual (o acervo conta como "Obras")
    const links = $$('.topo-links a');
    const mapa = { obras: 'destaques' };
    // pela posição no fluxo: as folhas presas continuam "na tela" mesmo cobertas
    const secoes = ['inicio', 'destaques', 'obras', 'sobre', 'exposicoes', 'imprensa', 'contato'].map(id => $(`#${id}`)).filter(Boolean);
    let atual = '';
    aoRolar(() => {
      const linha = scrollY + innerHeight * 0.46;
      let id = '';
      secoes.forEach(s => { if (topoReal(s) <= linha) id = mapa[s.id] || s.id; });
      if (id === atual) return;
      atual = id;
      links.forEach(a => (a.getAttribute('href') === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    });
    // o papel abre de um cartão para a largura toda quando entra na tela
    if (movimento && papel) {
      let ultimo = -1;
      aoRolar(() => {
        const topoPapel = papel.getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, (innerHeight - topoPapel) / (innerHeight * 0.85)));
        const fecha = +(1 - p).toFixed(3);
        if (fecha !== ultimo) { ultimo = fecha; papel.style.setProperty('--fecha', fecha); }
      });
    }
  }

  /* ---------- abertura ---------- */
  function abertura() {
    intro.then(() => raiz.classList.remove('intro-espera'));
    const ab = $('#inicio');
    if (!ab || !movimento) return;
    let ultimo = -1;
    aoRolar(() => {
      const y = Math.round(Math.min(scrollY, innerHeight * 1.2));
      if (y !== ultimo) { ultimo = y; ab.style.setProperty('--rol', y); }
    });
  }

  /* ---------- legendas que andam um pouco mais rápido que as fotos ---------- */
  function paralaxe() {
    if (!movimento) return;
    const largo = matchMedia('(min-width: 768px)');
    const alvos = $$('[data-py]');
    aoRolar(() => {
      if (!largo.matches) return;
      const h = innerHeight;
      alvos.forEach(a => {
        const r = a.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > h + 200) return;
        const c = (r.top + r.height / 2 - h / 2) / h;
        a.style.setProperty('--py', `${(c * +a.dataset.py).toFixed(1)}px`);
      });
    });
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
    $('#fDim').textContent = dimensoes(o.dimensoes);
    $('#fMat').textContent = material(o.material);
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
    mostrarFoto(fotoInicial(o));
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

  /* ---------- obras em destaque ---------- */
  // obras marcadas no painel como destaque (1º a 6º); a Whale abre a lista porque alterna com o botão de luz
  const DESTAQUES = OBRAS.filter(o => o.destaque).sort((a, b) => a.destaque - b.destaque).map(o => o.id);
  const PY = [80, -60, 100, -50];
  function destaques() {
    const cont = $('#placas');
    const obras = DESTAQUES.map(id => OBRAS.find(o => o.id === id)).filter(Boolean);
    if (!obras.length) { $('#destaques').hidden = true; return; }
    cont.classList.add('com-foco');
    const total = String(obras.length).padStart(2, '0');
    obras.forEach((o, i) => {
      const placa = el('article', 'placa');
      placa.setAttribute('aria-labelledby', `placa-${o.id}`);
      // a foto abre a ficha com o mouse; no teclado, o botão "Ver ficha" faz o mesmo
      const imagem = el('div', 'placa-obra'); imagem.dataset.cursor = txt('Ver', 'View');
      imagem.append(foto(o, '(max-width: 767px) 92vw, 58vw'));
      imagem.addEventListener('click', () => abrirFicha(obras, i));
      const leg = el('div', 'placa-leg'); leg.dataset.py = PY[i % PY.length];
      const titulo = el('h3', null, o.titulo); titulo.id = `placa-${o.id}`;
      const dados = el('p', 'placa-dados');
      dados.append(`${o.ano} · ${tecnica(o.tecnica)}`); // material e medidas ficam na ficha
      const ver = el('button', 'link-seta', txt('Ver ficha', 'View details')); ver.type = 'button';
      ver.setAttribute('aria-label', `${txt('Ver ficha de', 'View details of')} ${o.titulo}`);
      ver.addEventListener('click', () => abrirFicha(obras, i));
      leg.append(el('p', 'placa-n', `${String(i + 1).padStart(2, '0')} / ${total}`), titulo, dados, ver);
      placa.append(imagem, leg);
      cont.append(placa);
      observar(placa);
    });
  }

  /* ---------- acervo ---------- */
  function acervo() {
    const filtros = $('#filtros'), grade = $('#grade'), indice = $('#indice'), previa = $('#previa');
    $('#aNota').textContent = txt(`${OBRAS.length} obras.`, `${OBRAS.length} works.`);
    const tecnicas = ['Escultura', 'Pintura', 'Instalação', 'Colagem'].filter(t => OBRAS.some(o => o.tecnica === t));
    let ativa = '', vista = 'grade';
    const botao = (rotulo, valor, total) => {
      const b = el('button', 'filtro', rotulo); b.type = 'button';
      b.setAttribute('aria-pressed', String(valor === ativa));
      b.append(el('sup', null, total));
      b.addEventListener('click', () => {
        ativa = valor;
        $$('.filtro', filtros).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        render(true);
      });
      return b;
    };
    filtros.append(botao(txt('Todas', 'All'), '', OBRAS.length));
    tecnicas.forEach(t => filtros.append(botao(tecnica(t), t, OBRAS.filter(o => o.tecnica === t).length)));
    $$('.vistas button').forEach(b => b.addEventListener('click', () => {
      vista = b.dataset.vista;
      $$('.vistas button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      render(true);
    }));

    const desenharGrade = (obras, trocou) => {
      grade.textContent = '';
      obras.forEach((o, i) => {
        const li = el('li');
        const b = el('button', 'obra'); b.type = 'button'; b.dataset.cursor = txt('Ver', 'View');
        const leg = el('span', 'obra-leg');
        leg.append(el('em', null, o.titulo), el('span', null, `${o.ano} · ${tecnica(o.tecnica)}`));
        b.append(foto(o, '(max-width: 600px) 92vw, (max-width: 1100px) 46vw, 25vw'), leg);
        b.addEventListener('click', () => abrirFicha(obras, i));
        li.append(b);
        li.style.setProperty('--atraso', `${(trocou ? i % 8 : i % 4) * 0.07}s`);
        grade.append(li);
        observar(li);
      });
    };
    const desenharLista = obras => {
      indice.textContent = '';
      obras.forEach((o, i) => {
        const li = el('li');
        const b = el('button', 'ix'); b.type = 'button';
        const f = o.fotos[fotoInicial(o)];
        const mini = el('img', 'ix-mini'); mini.src = f.p; mini.alt = ''; mini.loading = 'lazy'; mini.width = 64; mini.height = 64;
        b.append(mini, el('span', 'ix-n', String(i + 1).padStart(2, '0')), el('span', 'ix-t', o.titulo),
          el('span', 'ix-tec', tecnica(o.tecnica)), el('span', 'ix-mat', material(o.material)), el('span', 'ix-ano', o.ano));
        b.addEventListener('click', () => abrirFicha(obras, i));
        b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') mostrarPrevia(o); });
        b.addEventListener('pointerleave', esconderPrevia);
        li.append(b);
        indice.append(li);
      });
    };
    const render = trocou => {
      const obras = ativa ? OBRAS.filter(o => o.tecnica === ativa) : OBRAS;
      esconderPrevia();
      grade.hidden = vista !== 'grade';
      indice.hidden = vista !== 'lista';
      if (vista === 'grade') desenharGrade(obras, trocou); else desenharLista(obras);
    };

    // prévia da foto que acompanha o mouse na lista
    let px = 0, py = 0, cx = 0, cy = 0, girando = false, visivel = false;
    const fino = matchMedia('(pointer: fine)');
    function mostrarPrevia(o) {
      if (!previa || !fino.matches) return;
      const f = o.fotos[fotoInicial(o)];
      previa.textContent = '';
      const im = el('img'); im.src = f.p; im.alt = ''; im.width = f.w; im.height = f.h;
      previa.append(im);
      if (!visivel) { cx = px; cy = py; }
      visivel = true;
      previa.classList.add('ver');
      if (!girando) { girando = true; requestAnimationFrame(mover); }
    }
    function esconderPrevia() { visivel = false; if (previa) previa.classList.remove('ver'); }
    function mover() {
      cx += (px - cx) * 0.16; cy += (py - cy) * 0.16;
      const largura = previa.offsetWidth, altura = previa.offsetHeight;
      const x = Math.min(innerWidth - largura - 16, cx + 28), y = Math.min(innerHeight - altura - 16, Math.max(16, cy - altura / 2));
      previa.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (visivel || Math.abs(px - cx) > .5) requestAnimationFrame(mover); else girando = false;
    }
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });

    render(false);
  }

  /* ---------- exposições ---------- */
  function exposicoes() {
    const lista = AGENDA.exposicoes || [];
    if (lista.length) {
      const de = Math.min(...lista.map(x => x.ano));
      $('#eNota').textContent = txt(`${lista.length} exposições e eventos desde ${de}.`, `${lista.length} exhibitions and events since ${de}.`);
    }
    const cv = $('#cv');
    const grupos = new Map();
    lista.forEach(x => { if (!grupos.has(x.ano)) grupos.set(x.ano, []); grupos.get(x.ano).push(x); });
    [...grupos.keys()].sort((a, b) => b - a).forEach(ano => {
      const bloco = el('div', 'cv-ano');
      bloco.append(el('h3', null, ano));
      const ul = el('ul');
      grupos.get(ano).forEach((x, i) => {
        const li = el('li');
        li.style.setProperty('--atraso', `${Math.min(i, 8) * 0.06}s`);
        li.append(el('span', 'cv-data', dataCurta(x.data)), el('span', 'cv-titulo', EN ? x.en || x.titulo : x.titulo), el('span', 'cv-lugar', EN ? x.lugarEn || x.lugar : x.lugar));
        ul.append(li);
      });
      bloco.append(ul);
      cv.append(bloco);
      observar(bloco);
    });
    recolher($$('.cv-ano', cv), 2, cv, txt(`Ver todas as ${lista.length}`, `See all ${lista.length}`));
    const hon = $('#honrarias');
    (H.honrarias || []).forEach(h => {
      const [titulo] = (EN ? h.en : h.pt).split(' — ');
      const li = el('li', null, titulo);
      li.append(el('span', null, String(h.ano)));
      li.dataset.rv = 'up';
      hon.append(li);
    });
  }

  /* listas longas: mostra só os primeiros itens e um botão para abrir o resto */
  function recolher(itens, limite, depoisDe, rotulo) {
    if (itens.length <= limite) return;
    const extras = itens.slice(limite);
    extras.forEach(x => { x.hidden = true; });
    const b = el('button', 'link-seta mais', rotulo); b.type = 'button';
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', () => {
      const abrir = b.getAttribute('aria-expanded') !== 'true';
      extras.forEach(x => { x.hidden = !abrir; if (abrir) x.classList.add('visto'); });
      b.setAttribute('aria-expanded', String(abrir));
      b.textContent = abrir ? txt('Mostrar menos', 'Show less') : rotulo;
      if (lenis) lenis.resize();
      // ao recolher, volta para o começo da lista (a página encolhe de uma vez)
      if (!abrir) {
        if (lenis) lenis.scrollTo(topoReal(depoisDe) - 140, { immediate: true });
        else depoisDe.scrollIntoView();
      }
    });
    depoisDe.after(b);
  }

  /* ---------- imprensa ---------- */
  function imprensa() {
    const ul = $('#materias');
    (AGENDA.imprensa || []).forEach(m => {
      const li = el('li'); li.dataset.rv = 'up';
      const a = el('a'); a.href = m.url; a.target = '_blank'; a.rel = 'noopener';
      a.append(el('span', 'mt-veiculo', m.veiculo), el('span', 'mt-titulo', m.titulo), el('span', 'mt-data', EN ? m.dataEn : m.data));
      li.append(a); ul.append(li);
    });
    const n = (AGENDA.imprensa || []).length;
    recolher($$('li', ul), 5, ul, txt(`Ver as ${n} matérias`, `See all ${n} articles`));
  }

  /* ---------- visita ---------- */
  function visita() {
    const c = H.contato || {};
    const end = $('#vEndereco');
    (c.endereco || []).forEach((linha, i) => { if (i) end.append(el('br')); end.append(linha); });
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

  /* ---------- cursor "Ver" sobre as obras (só mouse) ---------- */
  function cursor() {
    const c = $('#cursor'), rotulo = $('#cursorTexto');
    if (!c || !matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    let x = 0, y = 0, cx = 0, cy = 0, girando = false;
    const passo = () => {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (c.classList.contains('grande') || Math.abs(x - cx) + Math.abs(y - cy) > .5) requestAnimationFrame(passo); else girando = false;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      const alvo = e.target.closest('[data-cursor]');
      if (alvo && !c.classList.contains('grande')) { cx = x; cy = y; rotulo.textContent = alvo.dataset.cursor; }
      c.classList.toggle('grande', !!alvo);
      if (!girando) { girando = true; requestAnimationFrame(passo); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('grande'));
  }

  /* ---------- ordem de montagem ---------- */
  const tentar = (nome, fn) => { try { fn(); } catch (erro) { console.error(`[hermes] ${nome}`, erro); } };
  tentar('idioma', traduzir);
  tentar('idiomas', idiomas);
  tentar('rolagem', rolagem);
  tentar('folhas', prepararFolhas);
  tentar('preloader', preloader);
  tentar('luz', luz);
  tentar('abertura', abertura);
  tentar('palavras', prepararPalavras);
  tentar('topo', topoEMenu);
  tentar('ficha', prepararFicha);
  tentar('destaques', destaques);
  tentar('acervo', acervo);
  tentar('exposicoes', exposicoes);
  tentar('imprensa', imprensa);
  tentar('visita', visita);
  tentar('revelacoes', prepararRevelacoes);
  tentar('paralaxe', paralaxe);
  tentar('cursor', cursor);
  // se o endereço já vier com #secao, vai até ela depois de montar tudo
  if (location.hash.length > 1) {
    const alvo = $(location.hash);
    if (alvo) intro.then(() => setTimeout(() => (lenis ? lenis.scrollTo(topoReal(alvo), { immediate: true }) : alvo.scrollIntoView()), 50));
  }
})();
