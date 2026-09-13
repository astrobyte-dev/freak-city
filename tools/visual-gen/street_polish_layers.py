"""One focused native-SVG polish pass. Keeps v1, source pixels and all placements intact."""
from pathlib import Path
import hashlib
import json
import random
import shutil

ROOT=Path(__file__).resolve().parents[2]
BEFORE=ROOT/'docs/visuals/reviewed-sources/street/draft-v1'
OUT=ROOT/'docs/visuals/reviewed-sources/street/draft-v2-polish'


def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rect(x,y,w,h,c,a=1):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" opacity="{a}"/>'
def path(d,c,a=1):return f'<path d="{d}" fill="{c}" opacity="{a}"/>'
def svg(s):return '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="224" viewBox="0 0 320 224" shape-rendering="crispEdges">'+s+'</svg>\n'


def main():
    (OUT/'layers').mkdir(parents=True,exist_ok=True)
    for p in (BEFORE/'layers').iterdir():
        if p.suffix in ('.svg','.png'):shutil.copyfile(p,OUT/'layers'/p.name)
    # Shading within the existing door void: no lines implying rooms/steps/fixtures.
    depth=''
    for x,w,c,a in [(194,4,'#301c2b',.30),(198,5,'#201d2a',.24),(203,20,'#14131b',.18),(223,5,'#172932',.20),(228,3,'#30404b',.24)]:
        depth+=rect(x,66,w,89,c,a)
    # Soft vertical falloff expressed as quiet pixel bands, not a new floor plane.
    for y,h,c,a in [(130,10,'#352635',.10),(140,7,'#493141',.16),(147,5,'#55404b',.22),(152,3,'#59606a',.24)]:
        depth+=rect(194,y,36,h,c,a)
    depth+=rect(194,65,35,4,'#06080f',.65)+rect(194,70,2,66,'#08090f',.46)
    depth+=path('M195 153h10v1h-10Z M211 154h12v1h-12Z M226 147h1v6h-1Z','#73727b',.30)
    rng=random.Random(9142)
    for _ in range(47):
        x,y=rng.randrange(196,229),rng.randrange(140,155)
        depth+=rect(x,y,1,1,rng.choice(['#523345','#31414b','#151723']),rng.choice([.12,.18,.22]))
    original=(BEFORE/'layers/door-open.svg').read_text(encoding='utf-8')
    body=original[original.index('>')+1:original.rindex('</svg>')]
    (OUT/'layers/door-open.svg').write_text(svg(depth+body),encoding='utf-8')
    # Contact darkening and restrained broken reflection follow the open door only.
    spill=path('M184 156h47v1h-47Z M186 157h41v1h-41Z','#080b14',.48)
    spill+=path('M193 159h12v1h-12Z M215 160h12v1h-12Z M189 163h9v1h-9Z M209 164h14v1h-14Z M196 168h17v1h-17Z M218 173h8v1h-8Z M190 178h11v1h-11Z','#9c657e',.13)
    spill+=path('M222 161h6v1h-6Z M218 167h9v1h-9Z','#657e8d',.13)
    (OUT/'layers/door-open-effect.svg').write_text(svg(spill),encoding='utf-8')
    # Same bin silhouette and umbrella. Break flat panels into subdued worn clusters.
    body=path('M279 145L300 144L299 171L282 174Z','#24202b')
    body+=path('M281 147L286 149L289 172L283 172Z','#3b3642')
    body+=path('M286 149L292 148L293 172L289 172Z','#302934')
    body+=path('M292 148L298 147L297 171L293 172Z','#201d27')
    body+=path('M298 148L299 147L298 169L296 172Z','#49303c')
    # Painted metal with irregular grime; all flecks stay on its existing body.
    rng=random.Random(20149)
    for _ in range(125):
        x,y=rng.randrange(283,297),rng.randrange(150,170)
        c=rng.choice(['#191b24','#463440','#3b3843','#52404a','#29313c'])
        body+=rect(x,y,rng.choice([1,1,2]),1,c,rng.choice([.55,.75,1]))
    body+=path('M283 153h1v8h-1Z M284 164h1v4h-1Z','#5d606a',.65)
    body+=path('M296 155h1v5h-1Z M294 168h2v1h-2Z','#79505e',.55)
    body+=path('M282 168L299 167L299 171L282 174Z','#12151e',.60)
    body+=path('M278 144L291 142L301 144L300 147L286 149L278 146Z','#4b3d49')
    body+=path('M281 144L291 143L298 145L287 147Z','#11121b')
    body+=path('M278 144h5v1h-5Z M286 143h7v1h-7Z M296 145h4v1h-4Z','#92727f',.65)
    body+=path('M281 147h5v1h-5Z M287 148h4v1h-4Z','#496570',.65)
    body+=path('M289 145L291 133L293 144Z','#4a3c4a')
    body+=rect(291,133,1,11,'#5c6872')+path('M291 134V130H294V132H293V131H292V134Z','#69616f')
    (OUT/'layers/bin.svg').write_text(svg(body),encoding='utf-8')
    shadow=path('M278 173L298 170L304 175L299 178L280 178Z','#0b0e17',.42)
    shadow+=path('M281 173L299 171L301 175L285 176Z','#060912',.82)
    shadow+=path('M283 177h14v1h-14Z M286 179h11v1h-11Z','#1b2430',.55)
    shadow+=path('M282 179h4v1h-4Z M292 180h7v1h-7Z M284 183h6v1h-6Z M293 185h5v1h-5Z M286 188h6v1h-6Z','#675462',.18)
    shadow+=path('M281 181h3v1h-3Z M283 185h4v1h-4Z','#536c78',.19)
    (OUT/'layers/bin-effect.svg').write_text(svg(shadow),encoding='utf-8')
    # Envelope master, native size and contact stay unchanged. A small low-saturation
    # pavement reflection under its face separates dark paper from busy wet stone;
    # tight dark contact replaces the old detached bright reflection fragments.
    env=path('M157 174L163 172L169 174L170 179L164 182L157 180Z','#61616a',.32)
    env+=path('M156 177L165 176L171 180L163 183L156 180Z','#080d16',.64)
    env+=path('M158 180h10v1h-10Z M160 181h7v1h-7Z','#0a101a',.85)
    env+=path('M159 183h4v1h-4Z M165 185h3v1h-3Z','#435565',.13)
    (OUT/'layers/envelope-effect.svg').write_text(svg(env),encoding='utf-8')
    changed=['bin','bin-effect','door-open','door-open-effect','envelope-effect']
    assets={}
    for p in sorted((OUT/'layers').glob('*.svg')):
        parent=BEFORE/'layers'/p.name
        assets[p.stem]={'file':p.relative_to(OUT).as_posix(),'sha256':digest(p),'parentFile':parent.relative_to(ROOT).as_posix(),'parentSha256':digest(parent),'changed':p.stem in changed,'authoringTool':'native SVG pixel-shape editing','status':'draft-unactivated'}
        if p.stem not in changed:assert p.read_bytes()==parent.read_bytes()
    assert (OUT/'layers/envelope.png').read_bytes()==(ROOT/'public/visuals/velvet-overlay/sprites/envelope.png').read_bytes()
    record={'status':'draft-unactivated','scope':'one focused polish pass; no new generation, source edits, placement changes or gameplay','parent':'docs/visuals/reviewed-sources/street/draft-v1','unchangedSource':{'file':(BEFORE/'candidate/street__canonical-room__canonical__64-colours.png').relative_to(ROOT).as_posix(),'sha256':digest(BEFORE/'candidate/street__canonical-room__canonical__64-colours.png')},'composition':{'file':(BEFORE/'composition.json').relative_to(ROOT).as_posix(),'sha256':digest(BEFORE/'composition.json')},'changedLayers':changed,'envelope':{'file':'layers/envelope.png','sha256':digest(OUT/'layers/envelope.png'),'nativeSize':[10,6],'contact':[163,180],'position':[158,174],'identityUnchanged':True},'assets':assets}
    (OUT/'provenance.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
    print('One polish revision authored: five changed SVG layers; v1, plate, composition, sign, rain, closed door and envelope master preserved.')


if __name__=='__main__':main()
