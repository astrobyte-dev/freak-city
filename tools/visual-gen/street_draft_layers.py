"""Author native SVG pixel layers for the isolated street draft; never edits a source image.

Extends the existing code-authored door/sign/bin glyph approach. SVGs are editable
masters, rasterized by the headless review script. No model, shipping write or PIL edit.
"""
import hashlib
import json
from pathlib import Path
import random

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/visuals/reviewed-sources/street/draft-v1'
LAYER = OUT / 'layers'


def rect(x, y, w, h, color, opacity=1):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}" opacity="{opacity}"/>'


def path(d, color, opacity=1):
    return f'<path d="{d}" fill="{color}" opacity="{opacity}"/>'


def svg(body):
    return '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="224" viewBox="0 0 320 224" shape-rendering="crispEdges">' + body + '</svg>\n'


def main():
    LAYER.mkdir(parents=True, exist_ok=True)
    # The generated source preserved facts but moved the composition upward/left.
    # Coordinates below are measured on the imported master, never on gameplay geography.
    composition = {
        'status': 'draft', 'frame': [320, 224],
        'alignment': 'Measured against the explicitly cropped 320x224 candidate; generation guide remains retained as the prior composition proposal.',
        'anchors': {
            'detail_street_wall': {'glyph':'wall','x':0,'y':0,'width':320,'height':161},
            'detail_street_window': {'glyph':'window','x':33,'y':54,'width':114,'height':65},
            'detail_street_awning': {'glyph':'shelf','x':169,'y':40,'width':80,'height':23},
            'side_door': {'glyph':'door','x':183,'y':64,'width':48,'height':92},
            'detail_street_sign': {'glyph':'sign','x':171,'y':19,'width':82,'height':18},
            'detail_street_bin': {'glyph':'bin','x':278,'y':142,'width':23,'height':32},
        },
        'npcZones': [{'x':155,'y':161},{'x':270,'y':160},{'x':111,'y':170},{'x':305,'y':166}],
        'atmosphereZones': [{'x':0,'y':190,'width':320,'height':34}],
        'foregroundZones': [{'x':0,'y':190,'width':320,'height':34}],
        'contacts': {'side_door':[207,156], 'detail_street_bin':[290,174], 'envelope':[163,180]},
        'pavementPolygon': [[0,161],[320,161],[320,224],[0,224]],
        'shelterPolygon': [[169,61],[249,61],[255,173],[165,173]],
        'windowPolygon': [[37,57],[144,57],[144,115],[37,115]],
        'doorOpening': [183,64,231,156],
        'ownedEffectBounds': {'door-open':[179,155,242,186], 'sign':[166,14,258,210], 'bin':[274,169,306,192], 'envelope':[157,180,170,190]},
    }
    (OUT/'composition.json').write_text(json.dumps(composition,indent=2)+'\n',encoding='utf-8')
    layers = {}
    # Dark scuffed door: one leaf, its latch and panel relief. No invented padlock.
    door = rect(183,64,48,92,'#17141d') + rect(185,66,44,88,'#30232e')
    for x,y,w,h in [(189,71,16,34),(209,71,16,34),(189,111,36,38)]:
        door += rect(x-1,y-1,w+2,h+2,'#493039') + rect(x,y,w,h,'#16131c')
        door += rect(x+1,y+1,w-2,1,'#322432') + rect(x+w-1,y,1,h,'#4d3747')
    rng=random.Random(914)
    for _ in range(100):
        x,y=rng.randrange(186,229),rng.randrange(67,153)
        door+=rect(x,y,rng.randrange(1,3),1,rng.choice(['#352733','#271e2b','#40303e']))
    door += rect(183,65,1,89,'#603246') + rect(229,66,1,87,'#34525d')
    door += rect(224,109,2,8,'#80676a')+rect(220,111,6,2,'#ab8581')+rect(184,153,45,2,'#0e131a')
    layers['door-closed'] = door
    # Receding leaf is bounded inside the same opening; keep the portal dark.
    opened=path('M183 64L194 72V151L183 156Z','#28202b')
    opened+=path('M185 68L191 73V148L185 152Z','#15151c')
    opened+=path('M193 72H194V151H193Z','#67414f')+rect(189,109,2,3,'#947779')
    opened+=rect(183,155,48,1,'#493041')
    layers['door-open']=opened
    spill=''
    for y in range(157,182,3):
        inset=(y-157)//3
        spill+=rect(187-inset,y,40+2*inset,1,'#af5478',max(.025,.12-inset*.011))
    layers['door-open-effect']=spill
    # Authored 5x7 lettering. No generated/fake story text.
    letters={'V':['10001','10001','10001','10001','10001','01010','00100'],
             'E':['11111','10000','10000','11110','10000','10000','11111'],
             'L':['10000','10000','10000','10000','10000','10000','11111'],
             'T':['11111','00100','00100','00100','00100','00100','00100']}
    sign=rect(171,19,82,18,'#110f18')+rect(172,20,80,1,'#603148')+rect(172,35,80,1,'#304651')
    # Single-grid glyphs stretched to 2 horizontal pixels, with clear letter gaps.
    for index,c in enumerate('VELVET'):
        for y,row in enumerate(letters[c]):
            for x,v in enumerate(row):
                if v=='1':sign+=rect(177+index*12+x*2,24+y,2,1,'#e19ba9')
    for x,y in [(174,22),(249,22),(174,33),(249,33)]:sign+=rect(x,y,1,1,'#5f5663')
    layers['sign']=sign
    glow=rect(170,18,84,20,'#b32c65',.10)+rect(167,16,90,24,'#9b2858',.035)
    for y in range(165,211,4):
        inset=(y-165)//5
        glow+=rect(187-inset,y,50+inset*2,1,'#bd3e79',.12 if y%8 else .19)
    layers['sign-effect']=glow
    # Street bin includes its described folded umbrella; contents are not entities.
    binart=path('M279 145L300 144L299 171L282 174Z','#251f2a')
    binart+=path('M281 148L286 149L288 171L283 171Z','#3b3c47')
    binart+=path('M297 148L299 147L298 170L295 171Z','#563546')
    binart+=path('M278 144L291 142L301 144L300 147L286 149L278 146Z','#655261')
    binart+=path('M281 144L291 143L298 145L287 147Z','#10121c')
    binart+=path('M289 145L291 133L293 144Z','#57495b')
    binart+=rect(291,133,1,11,'#71818a')+path('M291 134V130H294V132H293V131H292V134Z','#716979')
    binart+=rect(294,156,2,1,'#6f5761')+rect(288,165,2,1,'#69525b')
    layers['bin']=binart
    effect=path('M276 172L300 170L305 176L280 178Z','#070a13',.55)
    for i in range(7):effect+=rect(282-i//2,178+i*2,18+i,1,'#59616c',.17-i*.015)
    layers['bin-effect']=effect
    env=ROOT/'public/visuals/velvet-overlay/sprites/envelope.png'
    # Reuse bytes without alteration; a separate fragmentary wet reflection is authored.
    (LAYER/'envelope.png').write_bytes(env.read_bytes())
    layers['envelope-effect']=path('M157 181h12v1h-12Z M160 184h7v1h-7Z M159 187h9v1h-9Z','#5a6c78',.22)
    rain=''
    # Renderer also clips the shelter polygon: these are background rain strokes,
    # not a claim that the source contains wet damage or changing weather.
    rng=random.Random(195)
    for _ in range(120):
        x,y=rng.randrange(320),rng.randrange(224)
        rain+=path(f'M{x} {y}h1v4h-1Z','#91b6c7',.15)
    layers['rain']=rain
    records={}
    for name,body in layers.items():
        data=svg(body).encode('utf-8');(LAYER/f'{name}.svg').write_bytes(data)
        records[name]={'file':f'layers/{name}.svg','sha256':hashlib.sha256(data).hexdigest(),'sourceType':'manual-edit','authoringTool':'code-authored SVG pixel shapes','frame':[320,224],'status':'draft'}
    records['envelope']={'file':'layers/envelope.png','sha256':hashlib.sha256(env.read_bytes()).hexdigest(),'parentFile':'public/visuals/velvet-overlay/sprites/envelope.png','sourceType':'retained approved sprite, new draft contact/effect','status':'draft-street-binding'}
    (OUT/'layer-provenance.json').write_text(json.dumps({'status':'draft-unactivated','notes':'Native SVG masters extend the existing procedural glyph style. No local model executed. Effects remain separate from architecture and primary objects.','assets':records},indent=2)+'\n',encoding='utf-8')
    print(f'Authored {len(layers)} isolated SVG layers and copied the exact envelope master. No source-image edits or shipping writes.')


if __name__=='__main__':main()
