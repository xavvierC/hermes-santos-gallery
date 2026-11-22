"""Retrato do artista e favicon, do site atual. Também gera data/obras.js a partir de data/obras.json."""
import io, json, os, urllib.request
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'
BASE = 'https://hermessantos.com.br/wp-content/uploads/2025/11/'


def baixar(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=90).read()


for nome in ('HermesSantos.jpg', 'HermesSantos-scaled.jpg', 'HermesSantos-681x1024.jpg'):
    try:
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(baixar(BASE + nome)))).convert('RGB')
        im.thumbnail((900, 1350), Image.LANCZOS)
        im.save(os.path.join(RAIZ, 'assets', 'hermes-retrato.webp'), 'WEBP', quality=84)
        print('retrato', nome, im.size)
        break
    except Exception as e:
        print('sem', nome, e)

fav = Image.open(io.BytesIO(baixar(BASE + 'favHermesSantos-300x300.png'))).convert('RGBA')
fav.resize((192, 192), Image.LANCZOS).save(os.path.join(RAIZ, 'assets', 'favicon.png'))
print('favicon ok')

obras = json.load(open(os.path.join(RAIZ, 'data', 'obras.json'), encoding='utf-8'))
with open(os.path.join(RAIZ, 'data', 'obras.js'), 'w', encoding='utf-8') as f:
    f.write('/* Gerado por ferramentas/baixar_extras.py a partir de data/obras.json (fichas do site atual). */\n')
    f.write('window.HERMES_OBRAS = ' + json.dumps(obras, ensure_ascii=False, indent=1) + ';\n')
print('obras.js', len(obras))
