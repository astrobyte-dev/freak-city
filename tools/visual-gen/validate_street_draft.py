"""Replay import and measure state-local image differences; never edits image pixels."""
from pathlib import Path
from PIL import Image, ImageChops
import hashlib
import json
from import_external import validate_external_provenance

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/visuals/reviewed-sources/street/draft-v1'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    meta=json.loads((OUT/'candidate/street__canonical-room__canonical__64-colours.json').read_text())
    replayed=validate_external_provenance(OUT/'candidate',meta)
    with Image.open(OUT/'candidate/street__canonical-room__canonical__64-colours.png') as im:
        assert replayed.tobytes()==im.convert('RGB').tobytes(), 'Retained display differs from source replay'
    comparisons=[]
    for a,b,allowed in [
        ('01-open-door-viewport.png','02-closed-door-viewport.png',(358,128,484,372)),
        ('03-dropped-envelope-viewport.png','05-retaken-envelope-viewport.png',(312,344,344,384)),
    ]:
        aa=Image.open(OUT/'review'/a).convert('RGB');bb=Image.open(OUT/'review'/b).convert('RGB')
        difference=ImageChops.difference(aa,bb);box=difference.getbbox()
        assert box, 'A state change must affect the image'
        assert allowed[0]<=box[0] and allowed[1]<=box[1] and box[2]<=allowed[2] and box[3]<=allowed[3], (a,box,allowed)
        comparisons.append({'before':a,'after':b,'differenceBounds':box,'allowedBounds':allowed,'outsideOwnedRegionUnchanged':True})
    with Image.open(OUT/'candidate/pixels/64-colours.png') as im:
        colors=len(im.getcolors(65536));assert colors<=64;assert im.size==(320,224)
    provenance=json.loads((OUT/'layer-provenance.json').read_text())
    for p in (OUT/'layers').glob('*.png'):
        with Image.open(p) as im:
            assert im.mode=='RGBA';assert im.getchannel('A').getextrema()[0]==0
            if p.stem!='envelope':assert im.size==(320,224)
        record=provenance['assets'][p.stem]
        if p.stem!='envelope':assert digest(OUT/record['file'])==record['sha256']
        record['raster']={'file':p.relative_to(OUT).as_posix(),'sha256':digest(p),'method':'headless Chromium SVG screenshot at native 320x224' if p.stem!='envelope' else 'exact unchanged approved PNG'}
    assert digest(OUT/'layers/envelope.png')==digest(ROOT/'public/visuals/velvet-overlay/sprites/envelope.png')
    (OUT/'layer-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
    refs=['public/velvet-exterior.png','docs/visuals/velvet-architecture-cleanup/candidate/sources/original.png','docs/visuals/reviewed-sources/street/draft-v1/layout-guide.png']
    record={'status':'passed-draft-unactivated','importReplay':'source/framing/master/display hashes and pixels verified after copying into retained evidence','masterColors':colors,'display':[640,448],'master':[320,224],'comparisons':comparisons,'references':[{'file':f,'sha256':digest(ROOT/f)} for f in refs]}
    (OUT/'review/art-validation.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(record,indent=2))


if __name__=='__main__':main()
