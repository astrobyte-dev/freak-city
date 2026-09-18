"""Editable native pixel layers for the unactivated vestibule draft (no raster edits)."""
from pathlib import Path
import json
import hashlib
import random
import shutil

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/visuals/reviewed-sources/vestibule/draft-v1'
LAYERS=OUT/'layers'
def rect(x,y,w,h,c,a=1):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" opacity="{a}"/>'
def path(d,c,a=1):return f'<path d="{d}" fill="{c}" opacity="{a}"/>'
def svg(body):return '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="224" viewBox="0 0 320 224" shape-rendering="crispEdges">'+body+'</svg>\n'
def write(name,body): (LAYERS/f'{name}.svg').write_text(svg(body),encoding='utf-8')
def specks(box,seed,colors,count):
    r=random.Random(seed);x,y,w,h=box
    return ''.join(rect(r.randrange(x,x+w),r.randrange(y,y+h),r.choice([1,1,2]),1,r.choice(colors),r.choice([.35,.55,.75])) for _ in range(count))

def main():
    LAYERS.mkdir(parents=True,exist_ok=True)
    c={'status':'draft','frame':[320,224], 'anchors':{
      'side_door':{'glyph':'door','x':0,'y':18,'width':27,'height':168},
      'ledge':{'glyph':'shelf','x':268,'y':156,'width':50,'height':18},
      'detail_vestibule_bench':{'glyph':'stool','x':49,'y':157,'width':53,'height':38},
      'detail_vestibule_notice':{'glyph':'sign','x':65,'y':68,'width':26,'height':20},
      'detail_vestibule_heater':{'glyph':'light','x':116,'y':138,'width':20,'height':27},
      'detail_vestibule_book':{'glyph':'table','x':298,'y':156,'width':15,'height':7},
      'detail_vestibule_bag':{'glyph':'bin','x':292,'y':179,'width':19,'height':26}},
      'npcZones':[{'x':206,'y':155},{'x':169,'y':145},{'x':233,'y':171},{'x':136,'y':164}],
      'atmosphereZones':[{'x':149,'y':118,'width':52,'height':27}],
      'foregroundZones':[{'x':0,'y':206,'width':320,'height':18}],
      'envelope':{'floor':{'x':165,'y':191,'width':10,'height':6,'contact':[170,197]},'ledge':{'x':278,'y':156,'width':10,'height':6,'contact':[283,162]}},
      'floorPolygon':[[0,189],[42,179],[101,135],[122,119],[217,119],[278,151],[320,171],[320,224],[0,224]],
      'ownerBounds':{'side_door':[0,13,68,218],'ledge':[264,153,320,180],'detail_vestibule_bench':[45,155,107,201],'detail_vestibule_notice':[64,67,93,91],'detail_vestibule_heater':[101,126,153,175],'detail_vestibule_book':[296,154,316,166],'detail_vestibule_bag':[289,177,314,209],'envelopeFloor':[162,189,178,201],'envelopeLedge':[275,154,291,167]}}
    (OUT/'composition.json').write_text(json.dumps(c,indent=2)+'\n')
    layout=json.loads((OUT/'layout-proposal.json').read_text())
    layout['alignment']='Measured on imported 320x224 master; the source followed route order but changed perspective and aperture sizes. Proposal remains retained separately.'
    layout['openings']={'side_door':[[0,18],[27,30],[27,185],[0,185]],'washroom':[[99,54],[110,62],[110,126],[99,137]],'bar':[[147,58],[188,58],[188,117],[147,117]],'cloakroom':[[253,46],[271,37],[271,143],[253,140]]}
    layout['reserved']=c['anchors'];layout['envelope']=c['envelope'];layout['npcZones']=c['npcZones']
    layout['chairResolution']['position']='Beyond the near-right camera edge, next to the book/ledge zone; no image, mask, effect, fixed fixture or new entity.'
    (OUT/'layout.json').write_text(json.dumps(layout,indent=2)+'\n')
    # Closed and open interior leaf live only inside the existing aperture. No fixture in plate.
    closed=path('M0 18L27 30V185H0Z','#25202b')
    closed+=path('M0 20L25 31V182H0Z','#3c2934')
    closed+=path('M2 29L22 37V177H2Z','#302531')
    closed+=specks((3,40,19,133),8,['#4e3540','#17212b','#5b424c'],115)
    closed+=path('M23 34h1v144h-1Z M1 180h23v1H1Z','#705360',.65)
    closed+=rect(6,105,2,7,'#7e7471')+rect(7,107,6,2,'#ae9a83')
    write('door-closed',closed)
    opened=path('M23 28L27 30V185L22 174Z','#241e29')+path('M24 32L26 33V179L24 174Z','#675060',.65)
    opened+=rect(22,99,2,5,'#95827c')+rect(23,25,4,2,'#4d454d')
    write('door-open',opened)
    # Dry threshold light is a soft opaque tint, never a mirrored wet reflection.
    doorfx=path('M0 185H27L64 209L28 215L0 199Z','#687282',.10)
    doorfx+=path('M0 185H26L43 198L17 201L0 194Z','#728893',.10)
    doorfx+=path('M0 185h28v2H0Z','#06090e',.7)
    write('door-open-effect',doorfx)
    bench=path('M50 168L89 155L102 161L63 176Z','#705253')
    bench+=path('M50 168L63 174L102 162V166L63 180L50 174Z','#473039')
    bench+=path('M52 174L56 176V192L52 194Z M94 168L98 167V186L94 188Z M62 179H65V195H62Z','#2c242d')
    bench+=path('M57 183L94 172V175L57 187Z','#4c343e')
    bench+=path('M52 167L89 156L99 160L62 172Z','#936b63',.45)
    bench+=path('M58 169L91 159 M62 171L95 161','#58434a')
    bench+=path('M51 194L58 192L60 195L52 197Z','#b09b7e')
    bench+=path('M54 194h4v1h-4Z','#debc92',.55)
    write('bench',bench)
    write('bench-effect',path('M47 194L94 183L106 191L62 200Z','#0b0e16',.45)+path('M51 195h9v2h-9Z M93 187h8v2h-8Z','#080c12',.65))
    ledge=path('M269 157L309 153L319 159L278 165Z','#735452')
    ledge+=path('M269 158L278 164L319 159V165L279 171L269 164Z','#392b32')
    ledge+=path('M272 157L309 154L314 157L279 162Z','#997468',.55)
    ledge+=path('M275 166L279 167V174L275 171Z M310 167L314 166V173L310 175Z','#362b33')
    write('ledge',ledge)
    write('ledge-effect',path('M269 166L279 171L319 165V173L278 179L266 171Z','#0e1119',.5))
    notice=path('M65 73L90 67L91 84L66 90Z','#181921',.65)+path('M65 71L89 67L90 83L66 88Z','#b7a58e')
    notice+='<g fill="#40333c" font-family="monospace" font-size="3.3" font-weight="bold" transform="matrix(1,-.15,0,1,0,0)"><text x="67" y="86">TOILETS</text><text x="66" y="90">ON THE LEFT</text><text x="66" y="94">CURRENTLY</text><path d="M67 95h19v.4H67Z M67 96h19v.4H67Z"/></g>'
    write('notice',notice)
    write('notice-effect',path('M66 87L91 81L92 84L67 90Z','#13121c',.5))
    heater=path('M116 143L132 138L136 142V161L120 166L116 163Z','#332c35')
    heater+=path('M119 144L132 141V158L119 162Z','#15151d')
    heater+=path('M121 148L130 145V155L121 158Z','#a96238')+path('M123 148L128 147V155L123 156Z','#dca66b',.65)
    for x in range(120,133,3):heater+=rect(x,144,1,16,'#5c5255',.8)
    heater+=path('M119 147L132 144M119 151L132 148M119 156L132 153','#3d353b')
    heater+=rect(119,163,2,3,'#817274')+rect(133,159,2,4,'#63555a')
    write('heater',heater)
    heaterfx=path('M114 160L135 157L149 169L117 174L104 168Z','#9f624b',.07)+path('M118 161L134 158L141 168L120 172Z','#cb8655',.10)+path('M117 164L134 160L139 164L121 169Z','#0a0e14',.5)
    write('heater-effect',heaterfx)
    book=path('M298 157L309 155L314 159L302 162Z','#15272d')+path('M298 158L302 162L314 159V162L302 165L298 161Z','#927c71')
    book+=path('M298 157L309 155L314 158L302 162Z','#344650')
    book+='<text x="301" y="159" fill="#bdac90" font-family="monospace" font-size="2.3">ENTRY</text>'
    write('book',book);write('book-effect',path('M298 163L313 160L315 163L302 166Z','#0b1018',.55))
    bag=path('M293 185L307 180L310 183L311 202L298 207L292 202Z','#927158')
    bag+=path('M293 185L298 188L310 183L307 180Z','#b59a77')+path('M298 189L310 185V201L299 204Z','#775643')
    bag+=path('M294 190L297 192V203L294 201Z','#c1a381',.6)+path('M297 182V178L301 177L305 178V183H303V179H299V184Z','#b49a7d')
    bag+=path('M294 199L299 202L310 198V201L299 206L294 203Z','#c6b69e',.45)
    bag+=specks((300,190,8,9),17,['#997352','#614c40'],20)
    write('bag',bag);write('bag-effect',path('M291 203L310 199L314 204L300 209L290 207Z','#0a1019',.5))
    shutil.copyfile(ROOT/'public/visuals/velvet-overlay/sprites/envelope.png',LAYERS/'envelope.png')
    for label,placement in c['envelope'].items():
        x,y=placement['x'],placement['y']
        fx=path(f'M{x-1} {y+3}h12v4h-12Z','#0a0e16',.57)+path(f'M{x+1} {y+6}h9v1h-9Z','#030910',.75)
        write(f'envelope-{label}-effect',fx)
    record={'status':'draft-unactivated','tool':'native SVG pixel-layer authoring, headless rasterization','chair':layout['chairResolution'],'envelopeSource':'public/visuals/velvet-overlay/sprites/envelope.png','envelopeSha256':hashlib.sha256((LAYERS/'envelope.png').read_bytes()).hexdigest(),'layers':{p.stem:{'svg':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(LAYERS.glob('*.svg'))}}
    (OUT/'layer-provenance.json').write_text(json.dumps(record,indent=2)+'\n')
    print('Authored vestibule layers, measured composition, unchanged envelope master and explicit off-camera chair resolution.')

if __name__=='__main__':main()
