"""Baixa as fotos das obras do site atual (WordPress) e gera WebP em dois tamanhos.

Saída: assets/obras/<slug>-<n>-g.webp (até 1800 px) e -p.webp (até 760 px),
e data/obras.json com os dados de cada obra apontando para os arquivos locais.
Uso: python ferramentas/baixar_obras.py <dados.json extraído>
"""
import io, json, os, re, sys, unicodedata, urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'assets', 'obras')
os.makedirs(SAIDA, exist_ok=True)
os.makedirs(os.path.join(RAIZ, 'data'), exist_ok=True)
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'


def slug(t):
    t = unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def baixar(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    return urllib.request.urlopen(req, timeout=90).read()


def salvar(url, base):
    destino_g = os.path.join(SAIDA, base + '-g.webp')
    if os.path.exists(destino_g):
        im = Image.open(destino_g)
        return {'g': f'assets/obras/{base}-g.webp', 'p': f'assets/obras/{base}-p.webp', 'w': im.width, 'h': im.height}
    im = Image.open(io.BytesIO(baixar(url)))
    im = ImageOps.exif_transpose(im).convert('RGB')
    g = im.copy(); g.thumbnail((1800, 1800), Image.LANCZOS); g.save(destino_g, 'WEBP', quality=84, method=5)
    p = im.copy(); p.thumbnail((760, 760), Image.LANCZOS); p.save(os.path.join(SAIDA, base + '-p.webp'), 'WEBP', quality=80, method=5)
    return {'g': f'assets/obras/{base}-g.webp', 'p': f'assets/obras/{base}-p.webp', 'w': g.width, 'h': g.height}


def main():
    dados = json.load(open(sys.argv[1], encoding='utf-8'))
    tarefas, obras, vistos = [], [], {}
    for o in dados['obras']:
        if o['titulo'].isupper() and len(o['titulo']) > 3:  # "ZONA NEUTRA" -> "Zona Neutra"
            o['titulo'] = ' '.join(p.capitalize() if len(p) > 1 else p for p in o['titulo'].split())
        s = slug(o['titulo']) or 'obra'
        vistos[s] = vistos.get(s, 0) + 1
        if vistos[s] > 1:
            s = f'{s}-{vistos[s]}'
        urls = list(dict.fromkeys([o['imagem']] + o['galeria']))
        obras.append({**{k: o[k] for k in ('titulo', 'ano', 'tecnica', 'dimensoes', 'material')}, 'id': s, 'urls': urls})
        for i, u in enumerate(urls):
            tarefas.append((u, f'{s}-{i + 1}'))
    resultados = {}
    def fazer(t):
        u, base = t
        try:
            resultados[(u, base)] = salvar(u, base)
            print('ok', base, flush=True)
        except Exception as e:
            print('FALHOU', base, u, e, flush=True)
    with ThreadPoolExecutor(max_workers=6) as ex:
        list(ex.map(fazer, tarefas))
    final = []
    for o in obras:
        fotos = [resultados[(u, f"{o['id']}-{i + 1}")] for i, u in enumerate(o['urls']) if (u, f"{o['id']}-{i + 1}") in resultados]
        if not fotos:
            continue
        o = {k: v for k, v in o.items() if k != 'urls'}
        o['tecnica'] = o['tecnica'].replace('Pìntura', 'Pintura')
        o['fotos'] = fotos
        final.append(o)
    json.dump(final, open(os.path.join(RAIZ, 'data', 'obras.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('obras salvas:', len(final), 'fotos:', sum(len(o['fotos']) for o in final))


if __name__ == '__main__':
    main()
