"""Reproduce the bounded Velvet draft sprites; no inference or room edits.

The three retained RGB imagegen references contain baked checkerboards.
Explicit neutral-background removal and largest-component extraction create
alpha, followed by nearest reduction, local palette mapping and pixel cleanup.
Small props are manually authored on their native integer grid below.
"""
from collections import deque
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/visuals/velvet-overlay-pilot'
PALETTE = ['#110d19', '#211625', '#342335', '#473047', '#69404f', '#98535c',
           '#c27b77', '#706078', '#244455', '#387486', '#97305e', '#dca45f']


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def figure(name, height, canvas_width, colors):
    src = Image.open(OUT / 'sources' / f'{name}.png').convert('RGB')
    w, h = src.size
    # Only neutral light background is removed. Preserve coloured skin/pencil.
    binary = bytearray(0 if min(p) > 115 and max(p)-min(p) < 42 else 1 for p in src.getdata())
    largest = []
    for start in range(w*h):
        if not binary[start]:
            continue
        group, queue = [], deque([start]); binary[start] = 0
        while queue:
            i = queue.popleft(); group.append(i)
            for j in (i-w, i+w, i-1 if i % w else -1, i+1 if i % w < w-1 else -1):
                if 0 <= j < w*h and binary[j]:
                    binary[j] = 0; queue.append(j)
        if len(group) > len(largest):
            largest = group
    mask = Image.new('L', src.size)
    mp = mask.load()
    for i in largest:
        mp[i % w, i // w] = 255
    rgba = src.convert('RGBA'); rgba.putalpha(mask)
    bounds = mask.getbbox(); cutout = rgba.crop(bounds)
    cutout.save(OUT / 'sources' / f'{name}-cutout.png')
    size = (round(cutout.width*height/cutout.height), height)
    small = cutout.resize(size, Image.Resampling.NEAREST)
    palette = Image.new('P', (1, 1)); pal = []
    for c in PALETTE[:colors]:
        pal.extend(bytes.fromhex(c[1:]))
    palette.putpalette((pal*256)[:768])
    quant = small.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    quant.putalpha(small.getchannel('A'))
    canvas = Image.new('RGBA', (canvas_width, height))
    canvas.alpha_composite(quant, ((canvas_width-size[0])//2, 0))
    return canvas, {'source': f'sources/{name}.png', 'sourceSha256': digest(OUT/'sources'/f'{name}.png'),
                    'sourceMode': 'RGB (baked checkerboard)', 'alphaMethod': 'neutral threshold + largest four-connected component',
                    'crop': list(bounds), 'reduction': 'nearest', 'palette': PALETTE[:colors]}


def props():
    result = {}
    im = Image.new('RGBA', (18, 24)); d = ImageDraw.Draw(im)
    d.polygon([(3,6),(6,7),(4,23),(1,23)], fill='#201728')
    d.polygon([(12,6),(15,6),(17,23),(14,23)], fill='#311e32')
    d.line([(4,18),(14,18)], fill='#63314b', width=2)
    d.line([(4,8),(3,21)], fill='#386273'); d.line([(14,8),(16,21)], fill='#883151')
    d.ellipse((0,1,17,8), fill='#211325'); d.ellipse((1,0,16,5), fill='#65324d')
    d.line([(3,1),(12,1)],fill='#b65676');d.line([(1,4),(5,5)],fill='#437180')
    d.point((11,3),fill='#331f33'); d.point((7,2),fill='#985367')
    result['stool'] = im
    im=Image.new('RGBA',(9,10)); d=ImageDraw.Draw(im)
    d.polygon([(0,8),(7,7),(8,9),(1,9)],fill='#665363')
    d.line([(2,2),(2,7),(6,7),(6,2)],fill='#567486')
    d.line([(2,1),(6,1)],fill='#aa8eab');d.point((3,2),fill='#d8a6b6')
    d.point((5,1),fill='#483447');d.line([(3,7),(5,7)],fill='#a17b99')
    d.point((4,4),fill='#4d344c');result['glass']=im
    im=Image.new('RGBA',(14,24));d=ImageDraw.Draw(im)
    d.line([(7,0),(7,12)],fill='#413548');d.point((7,3),fill='#73505c')
    d.polygon([(4,11),(9,11),(13,19),(0,19)],fill='#513047')
    d.polygon([(5,12),(8,12),(11,18),(2,18)],fill='#875140')
    d.line([(3,13),(1,18)],fill='#416171');d.line([(9,13),(11,18)],fill='#c16b64')
    d.ellipse((1,18,12,21),fill='#6d4440');d.line([(3,19),(10,19)],fill='#d3a16e')
    result['lamp']=im
    im=Image.new('RGBA',(14,18));d=ImageDraw.Draw(im)
    d.polygon([(1,3),(12,3),(11,16),(3,17)],fill='#302738')
    d.line([(3,5),(4,15)],fill='#3f5965');d.line([(11,5),(10,14)],fill='#65354c')
    d.ellipse((0,0,13,6),fill='#615068');d.ellipse((2,1,11,4),fill='#160f20')
    d.line([(3,2),(9,2)],fill='#39303e');d.point((7,10),fill='#4b374a');result['bin']=im
    im=Image.new('RGBA',(10,6));d=ImageDraw.Draw(im)
    d.polygon([(1,1),(8,0),(9,4),(1,5),(0,2)],fill='#16111d')
    d.line([(1,1),(5,3),(8,0)],fill='#634258')
    d.line([(1,5),(9,4)],fill='#3b6674');result['envelope']=im
    return result


def main():
    (OUT/'sprites').mkdir(parents=True, exist_ok=True)
    records = {}
    for name, h, w, colors in [('mara',52,24,12),('patron-a',40,18,11),('patron-b',40,18,11)]:
        im, provenance = figure(name,h,w,colors)
        if name == 'mara':
            # Keep authored pencil and rolled cuffs readable on the final grid.
            d=ImageDraw.Draw(im);d.line([(8,4),(10,3)],fill=PALETTE[11])
        records[name] = {'method':'imagegen reference + deterministic alpha/pixel cleanup', **provenance}
        im.save(OUT/'sprites'/f'{name}.png')
    for name,im in props().items():
        im.save(OUT/'sprites'/f'{name}.png')
        records[name]={'method':'manually authored native pixel clusters', 'source':'tools/visual-gen/velvet_overlay_art.py'}
    for name, record in records.items():
        path=OUT/'sprites'/f'{name}.png';im=Image.open(path)
        record.update(file=f'sprites/{name}.png',width=im.width,height=im.height,bytes=path.stat().st_size,sha256=digest(path),
                      colors=len({p[:3] for p in im.getdata() if p[3]}),alpha='binary 0/255',humanReviewStatus='pending')
        assert set(im.getchannel('A').getdata()) == {0,255}
        # Entity-owned, raster-authored floor echo: compressed, striped and faded.
        rh=max(3,im.height//3)
        reflected=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM).resize((im.width,rh),Image.Resampling.NEAREST)
        rp=reflected.load()
        for y in range(rh):
            for x in range(im.width):
                red,green,blue,alpha=rp[x,y]
                a=round(alpha*.24*(1-y/rh)*(0.35 if y%3==2 else 1))
                rp[x,y]=(red,green,blue,a)
        reflected.save(OUT/'sprites'/f'{name}-reflection.png')
        record['reflection']={'file':f'sprites/{name}-reflection.png','width':im.width,'height':rh,
            'bytes':(OUT/'sprites'/f'{name}-reflection.png').stat().st_size,
            'sha256':digest(OUT/'sprites'/f'{name}-reflection.png')}
    (OUT/'art-provenance.json').write_text(json.dumps({'model':None,'modelVersion':None,'seed':None,
        'tool':'built-in image_gen (three figure references); no room regeneration',
        'artStatus':'draft; pending human identity, sprite and placement review',
        'authoredMara':'Rolled sleeves. A pencil behind one ear. Always halfway through a task.',
        'identityScope':'Only existing description is story authority; unspecified reference appearance is a provisional visual choice, not biography.',
        'assets':records},indent=2)+'\n',encoding='utf-8')
    sheet=Image.new('RGB',(400,100),'#16121d')
    d=ImageDraw.Draw(sheet);x=8
    for name in records:
        im=Image.open(OUT/'sprites'/f'{name}.png');sheet.paste(im,(x,64-im.height),im)
        d.text((x,72),name,fill='#b49aaa');x+=48
    sheet.resize((1200,300),Image.Resampling.NEAREST).save(OUT/'sprite-sheet.png')
    print(json.dumps(records,indent=2))


if __name__ == '__main__':
    main()
