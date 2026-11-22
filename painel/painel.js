/* Painel da galeria — tela de edição. Fala com /api/painel; cada "Salvar no site" vira uma publicação. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const API = '/api/painel';
  const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const LIMITE_ENVIO = 3.6e6; // caracteres das fotos novas por envio (a Vercel aceita até 4,5 MB)

  let token = '';
  try { token = sessionStorage.getItem('hs-painel') || ''; } catch (e) { /* sem armazenamento */ }
  let estado = null; // { versao, obras, agenda }
  const previas = new Map(); // foto recém-enviada → imagem local, até o site publicar o arquivo

  const el = (tag, cls, texto) => { const e = document.createElement(tag); if (cls) e.className = cls; if (texto != null) e.textContent = texto; return e; };
  const copia = v => JSON.parse(JSON.stringify(v));
  const botao = (rotulo, aria, fn) => { const b = el('button', null, rotulo); b.type = 'button'; if (aria) b.setAttribute('aria-label', aria); b.addEventListener('click', fn); return b; };
  function aviso(msg, tipo) { const a = $('#aviso'); a.textContent = msg || ''; a.className = `aviso${tipo ? ` ${tipo}` : ''}`; }

  async function api(corpo) {
    let r;
    try {
      r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-painel': token }, body: JSON.stringify(corpo) });
    } catch (e) { throw new Error('Sem conexão com o servidor. Verifique a internet e tente de novo.'); }
    let dados = {};
    try { dados = await r.json(); } catch (e) { /* resposta sem JSON */ }
    if (r.status === 401 && corpo.acao !== 'entrar') { sair(); throw new Error(dados.erro || 'Sessão expirada. Entre de novo.'); }
    if (r.status === 413) throw new Error('Envio grande demais. Salve com menos fotos novas de cada vez.');
    if (!r.ok) throw new Error(dados.erro || `Erro ${r.status}. Tente de novo.`);
    return dados;
  }

  /* ---------- entrar, sair, carregar ---------- */
  $('#formEntrar').addEventListener('submit', async e => {
    e.preventDefault();
    const b = $('button', e.target), erro = $('#erroEntrar');
    erro.textContent = ''; b.disabled = true;
    try {
      token = (await api({ acao: 'entrar', senha: $('#senha').value })).token;
      try { sessionStorage.setItem('hs-painel', token); } catch (err) { /* sem armazenamento */ }
      $('#senha').value = '';
      await carregar();
    } catch (err) { erro.textContent = err.message; } finally { b.disabled = false; }
  });
  function sair() {
    token = ''; estado = null;
    try { sessionStorage.removeItem('hs-painel'); } catch (e) { /* sem armazenamento */ }
    $$('dialog[open]').forEach(d => d.close());
    $('#telaPainel').hidden = true; $('#telaEntrar').hidden = false; aviso('');
  }
  $('#sair').addEventListener('click', sair);
  async function carregar() {
    estado = await api({ acao: 'dados' });
    $('#telaEntrar').hidden = true; $('#telaPainel').hidden = false;
    desenharTudo();
  }
  const desenharTudo = () => { desenharObras(); desenharExpos(); desenharImprensa(); };

  /* abas */
  const ABAS = [['tabObras', 'abaObras'], ['tabExpos', 'abaExpos'], ['tabImprensa', 'abaImprensa']];
  ABAS.forEach(([aba]) => $(`#${aba}`).addEventListener('click', () => ABAS.forEach(([t, painel]) => {
    $(`#${t}`).setAttribute('aria-selected', String(t === aba)); $(`#${painel}`).hidden = t !== aba;
  })));
  $$('[data-fechar]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

  /* ---------- publicar ---------- */
  async function publicar(obras, agenda, fotos, mensagem) {
    aviso('Publicando…');
    const r = await api({ acao: 'salvar', versao: estado.versao, obras, agenda, fotos, mensagem });
    estado = { versao: r.versao, obras, agenda };
    desenharTudo();
    aviso('Salvo. O site se atualiza em cerca de 1 minuto.', 'ok');
  }
  async function enviar(form, erro, fn) {
    const botoes = $$('button', form);
    botoes.forEach(b => { b.disabled = true; });
    erro.textContent = '';
    try { await fn(); form.closest('dialog').close(); } catch (err) { erro.textContent = err.message; aviso(''); } finally { botoes.forEach(b => { b.disabled = false; }); }
  }

  /* ---------- obras ---------- */
  const srcFoto = caminho => previas.get(caminho) || `/${caminho}`;
  function desenharObras() {
    const ul = $('#listaObras'); ul.textContent = '';
    const destaques = estado.obras.filter(o => o.destaque).length;
    $('#resumoObras').textContent = `${estado.obras.length} obras, ${destaques} em destaque na página inicial. Obras novas aparecem primeiro no acervo.`;
    estado.obras.forEach((o, i) => {
      const li = el('li');
      const img = el('img'); img.src = srcFoto(o.fotos[0].p); img.alt = ''; img.loading = 'lazy'; img.width = 64; img.height = 64;
      const texto = el('div'), nome = el('strong', null, o.titulo);
      if (o.destaque) nome.append(el('span', 'selo', `Destaque ${o.destaque}º`));
      texto.append(nome, el('span', 'linha2', [o.ano, o.tecnica, o.material].filter(Boolean).join(' · ')));
      li.append(img, texto, botao('Editar', `Editar ${o.titulo}`, () => abrirObra(i)));
      ul.append(li);
    });
  }

  const dlgObra = $('#dlgObra'), formObra = $('#formObra');
  let editando = -1, fotosEdicao = [];
  function abrirObra(i) {
    editando = i;
    const o = i >= 0 ? estado.obras[i] : null;
    $('#tituloDlgObra').textContent = o ? 'Editar obra' : 'Nova obra';
    formObra.reset(); $('#erroObra').textContent = ''; $('#processando').textContent = '';
    if (o) {
      ['titulo', 'ano', 'tecnica', 'dimensoes', 'material'].forEach(k => { formObra.elements[k].value = o[k] || ''; });
      formObra.elements.destaque.value = o.destaque ? String(o.destaque) : '';
    }
    fotosEdicao = o ? o.fotos.map(f => ({ ...f })) : [];
    $('#excluirObra').hidden = !o;
    desenharFotos();
    dlgObra.showModal();
    formObra.elements.titulo.focus();
  }
  $('#novaObra').addEventListener('click', () => abrirObra(-1));

  function desenharFotos() {
    const ul = $('#fotosObra'); ul.textContent = '';
    fotosEdicao.forEach((f, i) => {
      const li = el('li');
      const img = el('img'); img.src = f.novo ? f.previa : srcFoto(f.p); img.alt = `Foto ${i + 1}`;
      li.append(img);
      if (i === 0) li.append(el('span', 'principal', 'Principal'));
      const troca = j => { [fotosEdicao[i], fotosEdicao[j]] = [fotosEdicao[j], fotosEdicao[i]]; desenharFotos(); };
      const esq = botao('←', `Mover foto ${i + 1} para a esquerda`, () => troca(i - 1)); esq.disabled = i === 0;
      const dir = botao('→', `Mover foto ${i + 1} para a direita`, () => troca(i + 1)); dir.disabled = i === fotosEdicao.length - 1;
      const tirar = botao('Tirar', `Tirar foto ${i + 1}`, () => { fotosEdicao.splice(i, 1); desenharFotos(); });
      const mover = el('div', 'mover'); mover.append(esq, tirar, dir);
      li.append(mover); ul.append(li);
    });
  }

  // fotos são reduzidas no navegador: versão grande (até 1600 px) e pequena (até 760 px)
  async function reduzir(fonte, w0, h0, max, q) {
    const k = Math.min(1, max / Math.max(w0, h0));
    const w = Math.round(w0 * k), h = Math.round(h0 * k);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(fonte, 0, 0, w, h);
    let blob = await new Promise(ok => c.toBlob(ok, 'image/webp', q)), ext = 'webp';
    if (!blob || blob.type !== 'image/webp') { blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', q)); ext = 'jpg'; } // Safari antigo não gera WebP
    if (!blob) throw new Error('imagem vazia');
    return { blob, ext, w, h };
  }
  async function prepararFoto(arquivo) {
    let fonte;
    try { fonte = await createImageBitmap(arquivo, { imageOrientation: 'from-image' }); } catch (e) {
      fonte = await new Promise((ok, falha) => { const im = new Image(); im.onload = () => ok(im); im.onerror = falha; im.src = URL.createObjectURL(arquivo); });
    }
    const w0 = fonte.naturalWidth || fonte.width, h0 = fonte.naturalHeight || fonte.height;
    const g = await reduzir(fonte, w0, h0, 1600, 0.82), p = await reduzir(fonte, w0, h0, 760, 0.8);
    return { novo: true, gBlob: g.blob, gExt: g.ext, pBlob: p.blob, pExt: p.ext, w: g.w, h: g.h, previa: URL.createObjectURL(p.blob) };
  }
  $('#arquivosObra').addEventListener('change', async e => {
    const arquivos = [...e.target.files]; e.target.value = '';
    const status = $('#processando'), erro = $('#erroObra');
    for (const [k, arquivo] of arquivos.entries()) {
      if (fotosEdicao.length >= 12) { erro.textContent = 'Cada obra pode ter até 12 fotos.'; break; }
      status.textContent = `Preparando foto ${k + 1} de ${arquivos.length}…`;
      try { fotosEdicao.push(await prepararFoto(arquivo)); desenharFotos(); } catch (err) { erro.textContent = `Não consegui abrir "${arquivo.name}". Use uma foto JPG, PNG ou WebP.`; }
    }
    status.textContent = '';
  });

  const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'obra';
  const base64 = blob => new Promise((ok, falha) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = falha; r.readAsDataURL(blob); });
  const numeroDaFoto = caminho => { const m = /-(\d+)-[gp]\.\w+$/.exec(caminho); return m ? +m[1] : 0; };

  formObra.addEventListener('submit', async e => {
    e.preventDefault();
    const erro = $('#erroObra');
    const v = k => formObra.elements[k].value.trim();
    if (!v('titulo') || !v('ano')) { erro.textContent = 'Preencha o título e o ano.'; return; }
    if (!fotosEdicao.length) { erro.textContent = 'Adicione pelo menos uma foto.'; return; }
    const obras = copia(estado.obras);
    const antiga = editando >= 0 ? obras[editando] : null;
    let id = antiga ? antiga.id : slug(v('titulo'));
    if (!antiga) { const base = id; let n = 2; while (obras.some(o => o.id === id)) id = `${base}-${n++}`; }
    // fotos novas recebem números depois dos que a obra já usou
    let maior = Math.max(0, ...(antiga ? antiga.fotos : []).map(f => numeroDaFoto(f.g)));
    const fotos = {}, lista = [];
    let tamanho = 0;
    for (const f of fotosEdicao) {
      if (!f.novo) { lista.push({ g: f.g, p: f.p, w: f.w, h: f.h }); continue; }
      maior += 1;
      const g = `assets/obras/${id}-${maior}-g.${f.gExt}`, p = `assets/obras/${id}-${maior}-p.${f.pExt}`;
      fotos[g] = await base64(f.gBlob); fotos[p] = await base64(f.pBlob);
      tamanho += fotos[g].length + fotos[p].length;
      lista.push({ g, p, w: f.w, h: f.h, previa: f.previa });
    }
    if (tamanho > LIMITE_ENVIO) { erro.textContent = 'Muitas fotos novas de uma vez. Salve com até 3 fotos novas e depois adicione as outras.'; return; }
    const obra = { titulo: v('titulo'), ano: v('ano'), tecnica: v('tecnica'), dimensoes: v('dimensoes'), material: v('material'), id,
      fotos: lista.map(({ g, p, w, h }) => ({ g, p, w, h })) };
    const destaque = +v('destaque');
    if (destaque) { obras.forEach(o => { if (o.destaque === destaque && o.id !== id) delete o.destaque; }); obra.destaque = destaque; }
    if (antiga) obras[editando] = obra; else obras.unshift(obra);
    await enviar(formObra, erro, async () => {
      await publicar(obras, estado.agenda, fotos, `${antiga ? 'obra atualizada' : 'obra nova'}: ${obra.titulo}`);
      lista.forEach(f => { if (f.previa) { previas.set(f.g, f.previa); previas.set(f.p, f.previa); } });
      desenharObras();
    });
  });
  $('#excluirObra').addEventListener('click', async () => {
    const o = estado.obras[editando];
    if (!o || !confirm(`Excluir a obra "${o.titulo}" do site? As fotos dela também saem.`)) return;
    const obras = copia(estado.obras); obras.splice(editando, 1);
    await enviar(formObra, $('#erroObra'), () => publicar(obras, estado.agenda, {}, `obra excluída: ${o.titulo}`));
  });

  /* ---------- exposições ---------- */
  const chaveExpo = x => x.ano * 10000 + (x.data ? +x.data.slice(3, 5) * 100 + +x.data.slice(0, 2) : 1300); // sem data: topo do ano
  function desenharExpos() {
    const ul = $('#listaExpos'); ul.textContent = '';
    estado.agenda.exposicoes.forEach((x, i) => {
      const li = el('li', 'sem-foto'), texto = el('div');
      texto.append(el('strong', null, x.titulo), el('span', 'linha2', [x.data ? `${x.data}/${x.ano}` : String(x.ano), x.lugar].join(' · ')));
      li.append(texto, botao('Editar', `Editar ${x.titulo}`, () => abrirExpo(i)));
      ul.append(li);
    });
  }
  const dlgExpo = $('#dlgExpo'), formExpo = $('#formExpo');
  let editandoExpo = -1;
  function abrirExpo(i) {
    editandoExpo = i;
    const x = i >= 0 ? estado.agenda.exposicoes[i] : null, f = formExpo.elements;
    $('#tituloDlgExpo').textContent = x ? 'Editar exposição ou evento' : 'Nova exposição ou evento';
    formExpo.reset(); $('#erroExpo').textContent = '';
    if (x) {
      f.titulo.value = x.titulo; f.en.value = x.en || ''; f.lugar.value = x.lugar; f.lugarEn.value = x.lugarEn || '';
      f.ano.value = x.ano; f.data.value = x.data ? `${x.ano}-${x.data.slice(3, 5)}-${x.data.slice(0, 2)}` : ''; f.intl.checked = !!x.intl;
    } else f.ano.value = new Date().getFullYear();
    $('#excluirExpo').hidden = !x;
    dlgExpo.showModal(); f.titulo.focus();
  }
  $('#novaExpo').addEventListener('click', () => abrirExpo(-1));
  formExpo.elements.data.addEventListener('change', e => { if (e.target.value) formExpo.elements.ano.value = e.target.value.slice(0, 4); });
  formExpo.addEventListener('submit', async e => {
    e.preventDefault();
    const f = formExpo.elements, erro = $('#erroExpo');
    const ano = +f.ano.value;
    if (!f.titulo.value.trim() || !f.lugar.value.trim() || !(ano >= 1900 && ano <= 2100)) { erro.textContent = 'Preencha título, local e ano.'; return; }
    const x = { ano, data: '', lugar: f.lugar.value.trim(), titulo: f.titulo.value.trim() };
    if (f.data.value) { const [a, m, d] = f.data.value.split('-'); x.ano = +a; x.data = `${d}/${m}`; }
    if (f.en.value.trim()) x.en = f.en.value.trim();
    if (f.lugarEn.value.trim()) x.lugarEn = f.lugarEn.value.trim();
    if (f.intl.checked) x.intl = true;
    const agenda = copia(estado.agenda);
    if (editandoExpo >= 0) agenda.exposicoes[editandoExpo] = x; else agenda.exposicoes.push(x);
    agenda.exposicoes.sort((a, b) => chaveExpo(b) - chaveExpo(a));
    await enviar(formExpo, erro, () => publicar(estado.obras, agenda, {}, `${editandoExpo >= 0 ? 'exposição atualizada' : 'exposição nova'}: ${x.titulo}`));
  });
  $('#excluirExpo').addEventListener('click', async () => {
    const x = estado.agenda.exposicoes[editandoExpo];
    if (!x || !confirm(`Excluir "${x.titulo}" do site?`)) return;
    const agenda = copia(estado.agenda); agenda.exposicoes.splice(editandoExpo, 1);
    await enviar(formExpo, $('#erroExpo'), () => publicar(estado.obras, agenda, {}, `exposição excluída: ${x.titulo}`));
  });

  /* ---------- imprensa ---------- */
  function desenharImprensa() {
    const ul = $('#listaImprensa'); ul.textContent = '';
    estado.agenda.imprensa.forEach((m, i) => {
      const li = el('li', 'sem-foto'), texto = el('div');
      texto.append(el('strong', null, m.titulo), el('span', 'linha2', [m.veiculo, m.data].filter(Boolean).join(' · ')));
      li.append(texto, botao('Editar', `Editar ${m.titulo}`, () => abrirMateria(i)));
      ul.append(li);
    });
  }
  const dlgMateria = $('#dlgMateria'), formMateria = $('#formMateria');
  let editandoMateria = -1;
  function abrirMateria(i) {
    editandoMateria = i;
    const m = i >= 0 ? estado.agenda.imprensa[i] : null, f = formMateria.elements;
    $('#tituloDlgMateria').textContent = m ? 'Editar matéria' : 'Nova matéria';
    formMateria.reset(); $('#erroMateria').textContent = '';
    if (m) {
      f.veiculo.value = m.veiculo; f.titulo.value = m.titulo; f.url.value = m.url;
      const partes = /^([a-zç]{3}) (\d{4})$/.exec(m.data || ''), soAno = /^(\d{4})$/.exec(m.data || '');
      if (partes) { f.mes.value = String(MESES_PT.indexOf(partes[1]) + 1); f.ano.value = partes[2]; } else if (soAno) f.ano.value = soAno[1];
    } else f.ano.value = new Date().getFullYear();
    $('#excluirMateria').hidden = !m;
    dlgMateria.showModal(); f.veiculo.focus();
  }
  $('#novaMateria').addEventListener('click', () => abrirMateria(-1));
  formMateria.addEventListener('submit', async e => {
    e.preventDefault();
    const f = formMateria.elements, erro = $('#erroMateria');
    const ano = +f.ano.value, mes = +f.mes.value, url = f.url.value.trim();
    if (!f.veiculo.value.trim() || !f.titulo.value.trim() || !(ano >= 1900 && ano <= 2100)) { erro.textContent = 'Preencha veículo, título e ano.'; return; }
    if (!/^https?:\/\/\S+$/i.test(url)) { erro.textContent = 'Cole o link completo da matéria, começando com https://'; return; }
    const m = { veiculo: f.veiculo.value.trim(), data: mes ? `${MESES_PT[mes - 1]} ${ano}` : String(ano), dataEn: mes ? `${MESES_EN[mes - 1]} ${ano}` : String(ano),
      titulo: f.titulo.value.trim(), url };
    const agenda = copia(estado.agenda);
    if (editandoMateria >= 0) agenda.imprensa[editandoMateria] = m; else agenda.imprensa.unshift(m);
    await enviar(formMateria, erro, () => publicar(estado.obras, agenda, {}, `${editandoMateria >= 0 ? 'matéria atualizada' : 'matéria nova'}: ${m.veiculo}`));
  });
  $('#excluirMateria').addEventListener('click', async () => {
    const m = estado.agenda.imprensa[editandoMateria];
    if (!m || !confirm(`Excluir a matéria "${m.titulo}" do site?`)) return;
    const agenda = copia(estado.agenda); agenda.imprensa.splice(editandoMateria, 1);
    await enviar(formMateria, $('#erroMateria'), () => publicar(estado.obras, agenda, {}, `matéria excluída: ${m.veiculo}`));
  });

  // já tinha entrado nesta aba: carrega direto
  if (token) carregar().catch(() => sair());
})();
