"""Verify approved source pixels, shipping copies and retained compositor evidence."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/visuals/street-activation'
REVIEW = ROOT / 'docs/visuals/reviewed-sources/street/draft-v2-polish/review'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    approval = json.loads((OUT/'human-approval.json').read_text())
    for file, sha in approval['reviewedFiles'].items():
        assert digest(ROOT/file) == sha, file
    registry = json.loads((ROOT/'src/content/visuals/assets.json').read_text())
    plate = next(a for a in registry if a['roomId'] == 'street')
    shipping = json.loads((ROOT/'src/content/visuals/street-overlay.json').read_text())
    assert plate['sha256'] == shipping['plateSha256']
    for name, asset in shipping['layers'].items():
        assert digest(ROOT/'public'/asset['file']) == asset['sha256']
        parent = ROOT/f'docs/visuals/reviewed-sources/street/draft-v2-polish/layers/{name}.png'
        assert digest(parent) == asset['sha256']
    first = Image.open(ROOT/'public'/plate['file']).convert('RGB')
    second = Image.open(ROOT/'docs/visuals/reviewed-sources/street/draft-v1/candidate/street__canonical-room__canonical__64-colours.png').convert('RGB')
    assert first.size == second.size and first.tobytes() == second.tobytes()
    results = []
    for size in ('desktop', 'mobile'):
        for state in ('open', 'closed', 'dropped'):
            first = Image.open(REVIEW/f'{state}-{size}-after-viewport.png').convert('RGB')
            second = Image.open(OUT/f'approved-match-{state}-{size}.png').convert('RGB')
            assert first.size == second.size
            assert ImageChops.difference(first, second).getbbox() is None, (state, size)
            results.append({'state': state, 'size': size, 'pixelsIdentical': True})
    baseline = json.loads((OUT/'baseline.json').read_text())
    assert next(a for a in registry if a['roomId'] == 'bar') == baseline['bar']
    for file, sha in baseline['hashes'].items():
        assert digest(ROOT/file) == sha, file
    for size in ('desktop', 'mobile'):
        for band in ('early', 'late', 'dawn'):
            assert digest(OUT/f'velvet-{band}-{size}-before.png') == digest(OUT/f'velvet-{band}-{size}-after.png')
    result = {'status': 'passed', 'approvedComposites': results,
              'losslessPromotedPlateMatchesReviewedPNG': True,
              'shippingOverlaysByteIdentical': True,
              'velvetIdenticalViewports': 6, 'preservedFileHashes': len(baseline['hashes'])}
    (OUT/'pixel-validation.json').write_text(json.dumps(result, indent=2)+'\n')
    print('Approved street pixels, all shipping hashes, 188 protected files and six Velvet viewport pairs match.')


if __name__ == '__main__':
    main()
