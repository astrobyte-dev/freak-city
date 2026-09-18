"""Read-only source replay, layer containment and gameplay-composite pixel checks."""
from pathlib import Path
import json
import hashlib
import math
from PIL import Image, ImageChops, ImageDraw
from import_external import validate_external_provenance

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/visuals/reviewed-sources/vestibule/draft-v1'
REVIEW=OUT/'review'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def compare(a,b,regions):
    first,second=[Image.open(REVIEW/name).convert('RGB') for name in (a,b)]
    assert first.size==second.size
    channels=ImageChops.difference(first,second).split()
    diff=ImageChops.lighter(ImageChops.lighter(channels[0],channels[1]),channels[2]).point(lambda v:255 if v else 0)
    mask=Image.new('L',first.size);draw=ImageDraw.Draw(mask);scale=first.width/320
    for x0,y0,x1,y1 in regions:draw.rectangle((math.floor(x0*scale)-1,math.floor(y0*scale)-1,math.ceil(x1*scale)+1,math.ceil(y1*scale)+1),fill=255)
    outside=ImageChops.subtract(diff,mask)
    assert outside.getbbox() is None,(a,b,outside.getbbox())
    assert diff.getbbox() is not None,(a,b,'no state change visible')
    return {'before':a,'after':b,'changedPixels':diff.histogram()[255],'outsideOwnerRegions':0,'regions':regions}

def main():
    metadata=json.loads((OUT/'candidate/vestibule__canonical-room__canonical__64-colours.json').read_text())
    expected=validate_external_provenance(OUT/'candidate',metadata)
    actual=Image.open(OUT/'candidate/vestibule__canonical-room__canonical__64-colours.png').convert('RGB')
    assert expected.size==actual.size and expected.convert('RGB').tobytes()==actual.tobytes()
    composition=json.loads((OUT/'composition.json').read_text());bounds=composition['ownerBounds']
    mapping={'door-open':'side_door','door-closed':'side_door','door-open-effect':'side_door','ledge':'ledge','bench':'detail_vestibule_bench','notice':'detail_vestibule_notice','heater':'detail_vestibule_heater','book':'detail_vestibule_book','bag':'detail_vestibule_bag','envelope-floor-effect':'envelopeFloor','envelope-ledge-effect':'envelopeLedge'}
    layers=[]
    for name in sorted((OUT/'layers').glob('*.png')):
        if name.stem=='envelope':continue
        im=Image.open(name).convert('RGBA');assert im.size==(320,224)
        key=mapping.get(name.stem,mapping.get(name.stem.removesuffix('-effect')))
        limit=bounds[key];bbox=im.getchannel('A').getbbox();assert bbox
        assert all([bbox[0]>=limit[0],bbox[1]>=limit[1],bbox[2]<=limit[2],bbox[3]<=limit[3]]),(name.stem,bbox,limit)
        layers.append({'name':name.stem,'owner':key,'alphaBounds':bbox,'sha256':digest(name)})
    envelope=OUT/'layers/envelope.png'
    assert Image.open(envelope).size==(10,6)
    assert digest(envelope)==digest(ROOT/'public/visuals/velvet-overlay/sprites/envelope.png')
    pairs=[]
    for size in ('desktop','mobile'):
        suffix=f'-{size}-viewport.png'
        for presence in ('present','absent'):
            for placement in ('floor','ledge'):
                pairs.append(compare(f'open-{presence}-{placement}{suffix}',f'closed-{presence}-{placement}{suffix}',[bounds['side_door']]))
        for door in ('open','closed'):
            pairs.append(compare(f'{door}-present-floor{suffix}',f'{door}-present-ledge{suffix}',[bounds['envelopeFloor'],bounds['envelopeLedge']]))
            pairs.append(compare(f'{door}-present-floor{suffix}',f'{door}-absent-floor{suffix}',[[186,103,229,187]]))
    for room in ('street','bar'):
        for size in ('desktop','mobile'):assert digest(REVIEW/f'{room}-{size}-before.png')==digest(REVIEW/f'{room}-{size}-after.png')
    protected=json.loads((OUT/'protected-files.json').read_text())
    for name,sha in protected.items():assert digest(ROOT/name)==sha,name
    assert not metadata['bakedEntities']
    layout=json.loads((OUT/'layout.json').read_text());assert not layout['chairResolution']['rendered'];assert not layout['chairResolution']['newEntity']
    report={'status':'passed-draft-unactivated','sourceReplay':'exact','sourceCrop':metadata['framing']['crop'],'paletteMaster':[320,224],'display':[640,448],'layerBounds':layers,'statePixelChecks':pairs,'envelopeMasterUnchanged':True,'protectedShippingFiles':len(protected),'approvedRoomPixelMatches':4,'chair':'explicit off-camera prose detail; no visual asset or entity','limitation':'Readability and final composition remain subject to owner visual review.'}
    (REVIEW/'pixel-validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print(f'Source replay, {len(layers)} layer bounds, {len(pairs)} state pixel comparisons, envelope identity, 4 approved-room captures and {len(protected)} shipping hashes passed.')

if __name__=='__main__':main()
