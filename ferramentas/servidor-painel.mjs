// Servidor de teste do painel: serve uma CÓPIA do site e grava as mudanças nela (nada vai para o GitHub).
// Uso (PowerShell):
//   $env:PAINEL_SENHA = 'uma-senha-de-teste'; $env:PAINEL_LOCAL_DIR = 'C:\caminho\da\copia'
//   node ferramentas/servidor-painel.mjs C:\caminho\da\copia 3097
// Depois abra http://127.0.0.1:3097/painel/
import http from 'node:http';
import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const raiz = path.resolve(process.argv[2] || process.env.PAINEL_LOCAL_DIR || '.');
const porta = +(process.argv[3] || 3097);
process.env.PAINEL_LOCAL_DIR = process.env.PAINEL_LOCAL_DIR || raiz;
const painel = require(path.join(raiz, 'api', 'painel.js'));
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8',
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  if (url.pathname === '/api/painel') return painel(req, res);
  let arq = path.join(raiz, decodeURIComponent(url.pathname));
  if (!arq.startsWith(raiz)) { res.statusCode = 403; return res.end(); }
  try {
    if ((await stat(arq)).isDirectory()) arq = path.join(arq, 'index.html');
    const dados = await readFile(arq);
    res.setHeader('Content-Type', TIPOS[path.extname(arq)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(dados);
  } catch (e) { res.statusCode = 404; res.end('não encontrado'); }
}).listen(porta, '127.0.0.1', () => console.log(`painel de teste em http://127.0.0.1:${porta}/painel/`));
