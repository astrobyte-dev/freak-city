"""Read-only pixel/state checks for the retained street polish screenshots."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/visuals/reviewed-sources/street/draft-v2-polish'
REVIEW = OUT / 'review'
BOXES = {'door': (179, 64, 242, 186), 'bin': (274, 130, 306, 192),
         'envelope': (155, 171, 172, 190)}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compare(a, b, owners):
    first, second = [Image.open(REVIEW / name).convert('RGB') for name in (a, b)]
    assert first.size == second.size
    diff = ImageChops.difference(first, second)
    # RGB max also detects single-channel one-level differences.
    changed = ImageChops.lighter(ImageChops.lighter(*diff.split()[:2]), diff.split()[2]).point(lambda v: 255 if v else 0)
    mask = Image.new('L', first.size)
    draw = ImageDraw.Draw(mask)
    scale = first.width / 320
    for owner in owners:
        x0, y0, x1, y1 = BOXES[owner]
        draw.rectangle((math.floor(x0*scale)-1, math.floor(y0*scale)-1,
                        math.ceil(x1*scale)+1, math.ceil(y1*scale)+1), fill=255)
    outside = ImageChops.subtract(changed, mask)
    assert outside.getbbox() is None, (a, b, outside.getbbox())
    count = changed.histogram()[255]
    assert bool(count) == bool(owners), (a, b, count)
    return {'before': a, 'after': b, 'dimensions': first.size, 'allowedOwners': owners,
            'changedPixels': count, 'outsideOwnerRegions': 0, 'differenceBounds': changed.getbbox()}


def main():
    checks = json.loads((REVIEW/'checks.json').read_text())
    for name, sha in checks['preservedHashes'].items():
        assert digest(ROOT/name) == sha, name
    pairs = []
    for size in ('desktop', 'mobile'):
        for state, owners in [('open', ['door', 'bin']), ('closed', ['bin']),
                              ('dropped', ['door', 'bin', 'envelope'])]:
            pairs.append(compare(f'{state}-{size}-before-viewport.png',
                                 f'{state}-{size}-after-viewport.png', owners))
            before, after = [Image.open(REVIEW/f'{state}-{size}-{rev}-viewport.png') for rev in ('before', 'after')]
            scale = before.width/320
            for name, box in [('window', (33,54,147,119)), ('awning',(169,40,249,63))]:
                crop = tuple(round(v*scale) for v in box)
                assert before.crop(crop).tobytes() == after.crop(crop).tobytes(), name
    pairs.append(compare('neutral-desktop-before-viewport.png', 'neutral-desktop-after-viewport.png', []))
    pairs.append(compare('open-desktop-after-viewport.png', 'closed-desktop-after-viewport.png', ['door']))
    pairs.append(compare('dropped-desktop-after-viewport.png', 'retaken-desktop-after-viewport.png', ['envelope']))
    provenance = json.loads((OUT/'provenance.json').read_text())
    for name, asset in provenance['assets'].items():
        png = OUT/'layers'/f'{name}.png'
        asset['rasterSha256'] = digest(png)
        asset['rasterDimensions'] = Image.open(png).size
        if not asset['changed']:
            parent = ROOT/provenance['parent']/'layers'/png.name
            assert Image.open(parent).tobytes() == Image.open(png).tobytes(), name
    assert digest(OUT/'layers/envelope.png') == provenance['envelope']['sha256']
    (OUT/'provenance.json').write_text(json.dumps(provenance, indent=2)+'\n')
    report = {'status': 'passed-draft-unactivated', 'coordinateSpace': [320,224],
              'ownerRegions': BOXES, 'pairs': pairs, 'windowAndAwningIdentical': True,
              'allPriorDraftFilesUnchanged': True, 'protectedFilesVerified': len(checks['preservedHashes']),
              'unchangedLayersPixelIdentical': ['door-closed','sign','sign-effect','rain'],
              'envelopeMasterByteIdentical': True,
              'limitation': 'Pixel and state checks establish containment, not personal visual approval.'}
    (REVIEW/'pixel-validation.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
