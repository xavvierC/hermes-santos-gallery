"""Gera os ícones do site a partir do símbolo do logo oficial (assets/hermes-official-logo.png).

O símbolo fica em branco quente sobre preto, com um brilho verde-fósforo, como as obras pintadas com
aluminato de estrôncio no escuro. Para os tamanhos de aba (16 a 48 px) o símbolo fica maior e com traço
mais grosso, senão some.

Uso, na pasta do site:  python ferramentas/gerar_icones.py
Saída: favicon.ico (raiz), assets/favicon.ico (16/32/48), assets/favicon.png (192),
       assets/apple-touch-icon.png (180).
"""
from PIL import Image, ImageChops, ImageDraw, ImageFilter

FUNDO = (6, 6, 6, 255)
TRACO = (246, 243, 236)
FOSFORO = (180, 241, 204)

logo = Image.open('assets/hermes-official-logo.png').convert('RGBA')
alfa = logo.getchannel('A').point(lambda v: v if v > 10 else 0)
SIMBOLO = alfa.crop((221, 400, 981, 795))  # só o símbolo, sem o nome


def icone(n, largura=0.74, cantos=0.22, engrossar=0, brilho=1.0):
    """Ícone n x n. cantos=0 faz um quadrado cheio (o iPhone arredonda sozinho)."""
    base = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    mascara = Image.new('L', (n, n), 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, n - 1, n - 1), radius=int(n * cantos), fill=255)
    base.paste(Image.new('RGBA', (n, n), FUNDO), (0, 0), mascara)
    w = int(n * largura)
    h = int(SIMBOLO.height * w / SIMBOLO.width)
    simbolo = SIMBOLO.resize((w, h), Image.LANCZOS)
    if engrossar:
        simbolo = simbolo.filter(ImageFilter.MaxFilter(engrossar))
    camada = Image.new('L', (n, n), 0)
    camada.paste(simbolo, ((n - w) // 2, (n - h) // 2 + int(n * 0.015)))
    for raio, forca in ((n * 0.03, 1.0), (n * 0.09, 0.6)):
        g = camada.filter(ImageFilter.GaussianBlur(raio)).point(lambda v: min(255, int(v * forca * 2.4 * brilho)))
        verde = Image.new('RGBA', (n, n), FOSFORO + (0,))
        verde.putalpha(ImageChops.multiply(g, mascara))
        base.alpha_composite(verde)
    branco = Image.new('RGBA', (n, n), TRACO + (0,))
    branco.putalpha(ImageChops.multiply(camada, mascara))
    base.alpha_composite(branco)
    return base


if __name__ == '__main__':
    grande = icone(1024)
    grande.resize((192, 192), Image.LANCZOS).save('assets/favicon.png', optimize=True)
    icone(1024, cantos=0).convert('RGB').resize((180, 180), Image.LANCZOS).save('assets/apple-touch-icon.png', optimize=True)
    # aba do navegador: símbolo maior e mais grosso
    aba = icone(1024, largura=0.86, cantos=0.2, engrossar=17, brilho=0.8)
    tamanhos = [(16, 16), (32, 32), (48, 48)]
    aba.save('assets/favicon.ico', sizes=tamanhos)
    aba.save('favicon.ico', sizes=tamanhos)
    print('ícones gerados')
