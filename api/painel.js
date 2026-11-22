/* Painel da galeria — função do servidor (Vercel).
   Ações (POST /api/painel, JSON): entrar → token; dados → obras e agenda atuais; salvar → grava tudo num
   único commit no GitHub (a Vercel publica sozinha em ~1 minuto).
   Variáveis de ambiente (configuradas na Vercel, nunca no código):
     PAINEL_SENHA   senha do painel (mínimo 8 caracteres)
     GITHUB_TOKEN   token do GitHub só deste repositório, com permissão de escrita em "Contents"
     PAINEL_REPO    opcional (padrão xavvierC/hermes-santos-gallery); PAINEL_RAMO opcional (padrão main)
     PAINEL_LOCAL_DIR  só para testes no computador: grava os arquivos nessa pasta em vez do GitHub */
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const REPO = process.env.PAINEL_REPO || 'xavvierC/hermes-santos-gallery';
const RAMO = process.env.PAINEL_RAMO || 'main';
const LOCAL = process.env.PAINEL_LOCAL_DIR || '';
const SENHA = process.env.PAINEL_SENHA || '';
const TOKEN = process.env.GITHUB_TOKEN || '';
const HORAS_DE_SESSAO = 12;
const TECNICAS = ['Escultura', 'Pintura', 'Instalação', 'Colagem'];
const FOTO = /^assets\/obras\/[a-z0-9-]{1,60}-\d{1,2}-(g|p)\.(webp|jpg)$/;
const MAX_FOTO = 1.6 * 1024 * 1024;

class Erro extends Error { constructor(codigo, msg) { super(msg); this.codigo = codigo; } }

/* ---------- sessão ---------- */
const chave = () => crypto.createHash('sha256').update(`hs-painel:${TOKEN}:${SENHA}:${LOCAL}`).digest();
const assinar = exp => crypto.createHmac('sha256', chave()).update(String(exp)).digest('base64url');
const emitirToken = () => { const exp = Date.now() + HORAS_DE_SESSAO * 3600e3; return `${exp}.${assinar(exp)}`; };
function tokenValido(t) {
  if (typeof t !== 'string') return false;
  const [exp, sig] = t.split('.');
  if (!exp || !sig || !(+exp > Date.now())) return false;
  const a = Buffer.from(sig), b = Buffer.from(assinar(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function senhaConfere(s) {
  if (SENHA.length < 8) return false;
  const a = crypto.createHash('sha256').update(String(s || '')).digest();
  const b = crypto.createHash('sha256').update(SENHA).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ---------- onde os arquivos ficam: GitHub (site no ar) ou uma pasta (testes) ---------- */
async function gh(metodo, url, corpo) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${url}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'hermes-painel', ...(corpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (r.status === 409 || r.status === 422) throw new Erro(409, 'conflito');
  if (!r.ok) throw new Erro(502, `GitHub respondeu ${r.status}`);
  return r.json();
}
const armazem = LOCAL ? {
  async versao() { try { return (await fs.readFile(path.join(LOCAL, '.painel-versao'), 'utf8')).trim(); } catch { return 'local-0'; } },
  async ler(arq) { return fs.readFile(path.join(LOCAL, arq), 'utf8'); },
  async gravar(base, novos, apagar) {
    if (await this.versao() !== base) throw new Erro(409, 'conflito');
    for (const [arq, conteudo] of novos) {
      const p = path.join(LOCAL, arq);
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, Buffer.from(conteudo, 'base64'));
    }
    for (const arq of apagar) await fs.rm(path.join(LOCAL, arq), { force: true });
    const nova = `local-${Date.now()}`;
    await fs.writeFile(path.join(LOCAL, '.painel-versao'), nova);
    return nova;
  },
} : {
  async versao() { return (await gh('GET', `/git/ref/heads/${RAMO}`)).object.sha; },
  async ler(arq, ref) {
    const r = await gh('GET', `/contents/${arq}?ref=${encodeURIComponent(ref || RAMO)}`);
    return Buffer.from(r.content, 'base64').toString('utf8');
  },
  async gravar(base, novos, apagar, mensagem) {
    if (await this.versao() !== base) throw new Erro(409, 'conflito');
    const commitBase = await gh('GET', `/git/commits/${base}`);
    const arvore = [];
    for (const [arq, conteudo] of novos) {
      const blob = await gh('POST', '/git/blobs', { content: conteudo, encoding: 'base64' });
      arvore.push({ path: arq, mode: '100644', type: 'blob', sha: blob.sha });
    }
    for (const arq of apagar) arvore.push({ path: arq, mode: '100644', type: 'blob', sha: null });
    const tree = await gh('POST', '/git/trees', { base_tree: commitBase.tree.sha, tree: arvore });
    const commit = await gh('POST', '/git/commits', { message: mensagem, tree: tree.sha, parents: [base] });
    await gh('PATCH', `/git/refs/heads/${RAMO}`, { sha: commit.sha }); // sem "force": falha se alguém gravou antes
    return commit.sha;
  },
};

/* ---------- validação: só passam os campos conhecidos, com tamanho limitado ---------- */
const texto = (v, max, obrigatorio, nome) => {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
  if (obrigatorio && !s) throw new Erro(400, `Preencha: ${nome}`);
  if (s.length > max) throw new Erro(400, `Texto longo demais: ${nome}`);
  return s;
};
function limparObras(lista) {
  if (!Array.isArray(lista) || lista.length > 400) throw new Erro(400, 'Lista de obras inválida');
  const ids = new Set(), destaques = new Set();
  return lista.map(o => {
    const id = texto(o.id, 60, true, 'id');
    if (!/^[a-z0-9-]+$/.test(id) || ids.has(id)) throw new Erro(400, `Identificador inválido: ${id}`);
    ids.add(id);
    const tecnica = texto(o.tecnica, 20, true, 'técnica');
    if (!TECNICAS.includes(tecnica)) throw new Erro(400, `Técnica inválida: ${tecnica}`);
    if (!Array.isArray(o.fotos) || !o.fotos.length || o.fotos.length > 12) throw new Erro(400, `A obra "${o.titulo}" precisa de 1 a 12 fotos`);
    const fotos = o.fotos.map(f => {
      if (!FOTO.test(f.g) || !FOTO.test(f.p)) throw new Erro(400, 'Caminho de foto inválido');
      const w = Math.round(+f.w), h = Math.round(+f.h);
      if (!(w > 0 && w <= 10000 && h > 0 && h <= 10000)) throw new Erro(400, 'Medidas de foto inválidas');
      return { g: f.g, p: f.p, w, h };
    });
    const limpa = {
      titulo: texto(o.titulo, 120, true, 'título'), ano: texto(o.ano, 20, true, 'ano'), tecnica,
      dimensoes: texto(o.dimensoes, 120, false, 'dimensões'), material: texto(o.material, 200, false, 'material'), id, fotos,
    };
    if (o.destaque != null && o.destaque !== '') {
      const d = Math.round(+o.destaque);
      if (!(d >= 1 && d <= 6) || destaques.has(d)) throw new Erro(400, 'Posição de destaque repetida ou inválida');
      destaques.add(d); limpa.destaque = d;
    }
    return limpa;
  });
}
function limparAgenda(a) {
  if (!a || !Array.isArray(a.exposicoes) || !Array.isArray(a.imprensa) || a.exposicoes.length > 500 || a.imprensa.length > 500) throw new Erro(400, 'Agenda inválida');
  const exposicoes = a.exposicoes.map(x => {
    const ano = Math.round(+x.ano);
    if (!(ano >= 1900 && ano <= 2100)) throw new Erro(400, 'Ano inválido');
    const data = texto(x.data, 5, false, 'data');
    if (data && !/^\d{2}\/\d{2}$/.test(data)) throw new Erro(400, 'Data inválida');
    const e = { ano, data, lugar: texto(x.lugar, 200, true, 'local'), titulo: texto(x.titulo, 200, true, 'título') };
    const en = texto(x.en, 200, false, 'título em inglês'), lugarEn = texto(x.lugarEn, 200, false, 'local em inglês');
    if (en) e.en = en;
    if (lugarEn) e.lugarEn = lugarEn;
    if (x.intl === true) e.intl = true;
    return e;
  });
  const imprensa = a.imprensa.map(m => {
    const url = texto(m.url, 500, true, 'link');
    if (!/^https?:\/\/\S+$/i.test(url)) throw new Erro(400, 'Link inválido');
    return { veiculo: texto(m.veiculo, 80, true, 'veículo'), data: texto(m.data, 20, false, 'data'), dataEn: texto(m.dataEn, 20, false, 'data'),
      titulo: texto(m.titulo, 300, true, 'título'), url };
  });
  return { exposicoes, imprensa };
}

const b64 = s => Buffer.from(s, 'utf8').toString('base64');
const arquivoJs = (nome, valor, cab) => `/* Gerado pelo painel (/painel). ${cab} */\nwindow.${nome} = ${JSON.stringify(valor, null, 1)};\n`;

/* ---------- ações ---------- */
async function lerDados(versao) {
  const ref = LOCAL ? undefined : versao;
  const [obras, agenda] = await Promise.all([armazem.ler('data/obras.json', ref), armazem.ler('data/agenda.json', ref)]);
  return { versao, obras: JSON.parse(obras), agenda: JSON.parse(agenda) };
}
async function salvar(p) {
  const base = texto(p.versao, 80, true, 'versão');
  const obras = limparObras(p.obras);
  const agenda = limparAgenda(p.agenda);
  const antes = await lerDados(base);
  // trava contra perda acidental: o painel exclui um item por vez
  const sumiram = (velhos, novos) => velhos.length - novos.length;
  if (sumiram(antes.obras, obras) > 3 || sumiram(antes.agenda.exposicoes, agenda.exposicoes) > 3 || sumiram(antes.agenda.imprensa, agenda.imprensa) > 3) {
    throw new Erro(400, 'Muitos itens seriam apagados de uma vez. Nada foi alterado.');
  }
  const existentes = new Set(antes.obras.flatMap(o => o.fotos.flatMap(f => [f.g, f.p])));
  const enviadas = p.fotos && typeof p.fotos === 'object' ? p.fotos : {};
  const novos = [];
  for (const [arq, conteudo] of Object.entries(enviadas)) {
    if (!FOTO.test(arq) || typeof conteudo !== 'string') throw new Erro(400, 'Foto inválida');
    if (Buffer.byteLength(conteudo, 'base64') > MAX_FOTO) throw new Erro(413, 'Foto grande demais');
    novos.push([arq, conteudo]);
  }
  const usadas = new Set(obras.flatMap(o => o.fotos.flatMap(f => [f.g, f.p])));
  for (const arq of usadas) if (!existentes.has(arq) && !(arq in enviadas)) throw new Erro(400, 'Falta enviar uma das fotos');
  // fotos que nenhuma obra usa mais saem do site
  const apagar = [...existentes].filter(arq => !usadas.has(arq) && !(arq in enviadas));
  novos.push(
    ['data/obras.json', b64(JSON.stringify(obras, null, 1) + '\n')],
    ['data/obras.js', b64(arquivoJs('HERMES_OBRAS', obras, 'Para editar as obras, use o painel.'))],
    ['data/agenda.json', b64(JSON.stringify(agenda, null, 1) + '\n')],
    ['data/agenda.js', b64(arquivoJs('HERMES_AGENDA', agenda, 'Para editar exposições e matérias, use o painel.'))],
  );
  const resumo = texto(p.mensagem, 90, false, 'mensagem').replace(/[\r\n]+/g, ' ') || 'atualização';
  const versao = await armazem.gravar(base, novos, apagar, `painel: ${resumo}`);
  return { versao };
}

async function lerCorpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let dados = '';
  for await (const parte of req) { dados += parte; if (dados.length > 6e6) throw new Erro(413, 'Envio grande demais'); }
  return JSON.parse(dados || '{}');
}
function responder(res, codigo, corpo) {
  res.statusCode = codigo;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(JSON.stringify(corpo));
}

module.exports = async function painel(req, res) {
  try {
    if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST' });
    if (!SENHA || (!TOKEN && !LOCAL)) return responder(res, 503, { erro: 'O painel ainda não foi configurado (senha e token na Vercel).' });
    const p = await lerCorpo(req);
    if (p.acao === 'entrar') {
      if (!senhaConfere(p.senha)) { await new Promise(r => setTimeout(r, 900)); return responder(res, 401, { erro: 'Senha incorreta.' }); }
      return responder(res, 200, { token: emitirToken() });
    }
    if (!tokenValido(req.headers['x-painel'])) return responder(res, 401, { erro: 'Sessão expirada. Entre de novo.' });
    if (p.acao === 'dados') return responder(res, 200, await lerDados(await armazem.versao()));
    if (p.acao === 'salvar') return responder(res, 200, await salvar(p));
    return responder(res, 400, { erro: 'Ação desconhecida' });
  } catch (e) {
    const codigo = e instanceof Erro ? e.codigo : 500;
    const msg = codigo === 409 ? 'Os dados mudaram desde que você abriu o painel. Recarregue a página e faça a mudança de novo.'
      : e instanceof Erro ? e.message : 'Erro inesperado no servidor.';
    if (!(e instanceof Erro)) console.error('[painel]', e);
    return responder(res, codigo, { erro: msg });
  }
};
// a Vercel lê o corpo JSON até 4,5 MB; fotos são reduzidas no navegador antes de enviar
module.exports.config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };
