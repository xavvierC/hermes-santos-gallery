"""Folha de contato com a capa de cada obra (para escolher destaques). Uso: python folha_obras.py <saida.jpg>"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
obras = json.load(open(os.path.join(RAIZ, 'data', 'obras.json'), encoding='utf-8'))
L, A, COL = 200, 230, 8
linhas = (len(obras) + COL - 1) // COL
folha = Image.new('RGB', (COL * L, linhas * A), '#111')
g = ImageDraw.Draw(folha)
try:
    fonte = ImageFont.truetype('arial.ttf', 13)
except OSError:
    fonte = ImageFont.load_default()
for i, o in enumerate(obras):
    im = Image.open(os.path.join(RAIZ, o['fotos'][0]['p'])).convert('RGB')
    im.thumbnail((L - 6, A - 30))
    x, y = (i % COL) * L, (i // COL) * A
    folha.paste(im, (x + (L - im.width) // 2, y + 3))
    g.text((x + 4, y + A - 24), f"{i + 1}. {o['titulo'][:22]} ({len(o['fotos'])})", fill='#ddd', font=fonte)
folha.save(sys.argv[1], quality=85)
print(folha.size)
