"""Gera data/rede.js: rede Voronoi (o mesmo desenho das esculturas vazadas do Hermes) em caminhos SVG 1600x1000.
Os caminhos saem ordenados do centro para fora, para o site desenhar a rede "crescendo"."""
import json, os
import numpy as np
from scipy.spatial import Voronoi

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1600, 1000
rng = np.random.default_rng(1503)


def rede(n, semente):
    r = np.random.default_rng(semente)
    # pontos com distância mínima (poisson simples) para células parecidas com as das esculturas
    pts = []
    while len(pts) < n:
        p = r.uniform([-120, -120], [W + 120, H + 120])
        if all((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 > 95 ** 2 for q in pts):
            pts.append(p)
    vor = Voronoi(np.array(pts))
    linhas = []
    for (a, b) in vor.ridge_vertices:
        if a < 0 or b < 0:
            continue
        p, q = vor.vertices[a], vor.vertices[b]
        if not (-60 < p[0] < W + 60 and -60 < p[1] < H + 60 and -60 < q[0] < W + 60 and -60 < q[1] < H + 60):
            continue
        # curva levemente as arestas (as esculturas têm traço orgânico)
        mx, my = (p + q) / 2
        dx, dy = q - p
        k = r.uniform(-.12, .12)
        cx, cy = mx - dy * k, my + dx * k
        d = np.hypot(mx - W / 2, my - H / 2)
        linhas.append((d, f'M{p[0]:.0f} {p[1]:.0f}Q{cx:.0f} {cy:.0f} {q[0]:.0f} {q[1]:.0f}'))
    linhas.sort()
    return [s for _, s in linhas]

dados = {'visita': rede(120, 63)}  # só a seção Visita usa a rede (o preloader agora é o anel)
with open(os.path.join(RAIZ, 'data', 'rede.js'), 'w', encoding='utf-8') as f:
    f.write('/* Gerado por ferramentas/gerar_rede.py: rede Voronoi das esculturas vazadas, 1600x1000. */\n')
    f.write('window.HERMES_REDE = ' + json.dumps(dados, separators=(',', ':')) + ';\n')
print({k: len(v) for k, v in dados.items()}, os.path.getsize(os.path.join(RAIZ, 'data', 'rede.js')))
