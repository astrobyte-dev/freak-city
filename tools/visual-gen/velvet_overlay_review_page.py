"""Portable focused review of the completed, still-unapproved overlay pilot."""
import json
from pathlib import Path
from html import escape

root=Path(__file__).resolve().parents[2]/'docs/visuals/velvet-overlay-pilot'
art=json.loads((root/'art-provenance.json').read_text())
runtime=json.loads((root/'review/runtime.json').read_text())
sprite_bytes=sum(a['bytes'] for a in art['assets'].values())
reflection_bytes=sum(a['reflection']['bytes'] for a in art['assets'].values())
cards=[]
for name,a in art['assets'].items():
    source=f'<a href="../sources/{name}.png">Retained reference</a> · <a href="../sources/{name}-cutout.png">Alpha cutout</a>' if name in ('mara','patron-a','patron-b') else 'Manually authored native pixel clusters'
    cards.append(f'<article><div class="sprite"><img src="../{a["file"]}" width="{a["width"]*4}" height="{a["height"]*4}" alt="{name} draft sprite"></div><h3>{name}</h3><p>{a["width"]} × {a["height"]} · {a["colors"]} colours · {a["bytes"]:,} B<br>Reflection {a["reflection"]["bytes"]:,} B</p><small>{source}</small></article>')
options=''.join(f'<option value="{r["label"]}">{r["label"]}</option>' for r in runtime['records'])
contacts=''.join(f'<circle cx="{c["x"]}" cy="{c["y"]}" r="2" fill="#eff3cd"/><text x="{c["x"]+3}" y="{c["y"]-3}">{escape(name.replace("detail_bar_",""))}</text>' for name,c in runtime['contacts'].items())
captions={
 'early-640':'23:55 · Mara + five anonymous placements. Exact 640 × 448 composition.',
 'early-320':'23:55 · Native 320 × 224 composition. Assess actual pixel-scale identity.',
 'late-anonymous':'02:40 · No named NPCs; two anonymous patrons from existing sparse occupancy.',
 'dawn-empty':'05:15 · No named or anonymous occupants. Existing scenery remains.',
 'envelope-present':'Actual parser drop in the bar. Existing envelope and its floor reflection present.',
 'envelope-retaken':'Actual parser take. Envelope and its owned reflection both disappear.',
 'behind-counter':'Same early state and same Mara image. Alternate art placement behind traced counter mask, hidden feet have no floor double.',
 'mara-low-light-study':'Art lighting study only: early-state Mara under the existing low-light override. No schedule change.',
 'mara-morning-light-study':'Art lighting study only: early-state Mara under the existing morning-light override. Actual dawn has no Mara.',
 'mobile-390':'390-pixel viewport, 358-pixel composition. Shared nearest-neighbour scaling, no horizontal overflow.',
 'canonical-runtime':'Ordinary feature runtime. Approved plate is active; unapproved pilot sprites are disabled.'}
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Velvet overlay pilot review</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#100d15;color:#ddcfdc;font:15px/1.6 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:36px 24px 80px}h1{font-size:clamp(30px,5vw,54px);line-height:1.08;margin:12px 0 18px}h2{margin:44px 0 14px}h3{font-size:16px;margin:8px 0}p{max-width:850px}a{color:#72bdc9}small,.muted{color:#aa94aa}.kicker{color:#ee78b2;font:12px monospace;letter-spacing:.14em}.pill{display:inline-block;border:1px solid #674054;padding:4px 10px;font:12px monospace;color:#ed9cbc}img{max-width:100%;height:auto;image-rendering:pixelated}figure{margin:0;background:#17131e;padding:18px;border:1px solid #382737}figcaption{color:#b49aad;margin-top:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}article{background:#191420;padding:18px;border:1px solid #382737}.sprite{height:215px;display:flex;align-items:flex-end;justify-content:center;background:linear-gradient(#16121d,#1e1626)}.sprite img{max-height:208px}select{font:inherit;padding:10px;background:#231929;color:#ead5e6;border:1px solid #6d445e;max-width:100%;margin-bottom:14px}.gallery{text-align:center}.gallery figcaption{text-align:left}.diagram{width:640px;max-width:100%;height:auto;image-rendering:pixelated}.diagram text{font:5px monospace;fill:#fff;stroke:#15121d;stroke-width:.8;paint-order:stroke}.facts{border-left:3px solid #ba4886;padding-left:18px}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:9px;border-bottom:1px solid #382737}.checks{color:#92c5b1}
</style><main>
<div class="kicker">FREAK//CITY · ART REVIEW 01</div><h1>Velvet has a room.<br>Now review its inhabitants.</h1>
<span class="pill">PLATE APPROVED</span> <span class="pill">OVERLAYS DRAFT · HUMAN REVIEW PENDING</span>
<p>One Mara identity, two anonymous figures, five existing objects. Real simulation decides presence. These are review-only sprite bindings in the actual LocationVisual compositor; ordinary feature play already uses the approved room.</p>
<p><a href="../../../VELVET-OVERLAY-PILOT.md">Full report</a> · <a href="../art-provenance.json">Art provenance / hashes</a> · <a href="../prompts.json">Exact generation prompts</a> · <a href="runtime.json">Runtime records</a></p>
<h2>Approved empty architecture</h2><figure><img src="../../../../public/visuals/generated/bar--canonical-room--canonical--8b5c100cebc6.webp" width="640" height="448" alt="Approved empty Velvet canonical architecture"><figcaption>Plate-only reference, not an empty gameplay state. 320 master → 64-colour treatment → exact 640 display. 52,040-byte lossless WebP. Room locked; no regeneration.</figcaption></figure>
<h2>The native sprite candidates</h2><p>Mara: rolled sleeves, pencil behind an ear and practical work boots from existing authored content. One image and fixed palette across lighting/staging. Unspecified appearance is a provisional art choice; it is not new biography. The small sprite, not the large source alone, needs approval.</p>
<div class="grid">CARDS</div>
<p class="muted">Sources contained baked RGB checkerboards. Retained originals and deterministic cutouts make that correction explicit. All final sprites have true binary alpha. Small props are hand-authored pixels. No portrait, new character, gameplay object or model download.</p>
<h2>Actual runtime composites</h2><label for="capture">Review state / proof</label><br><select id="capture">OPTIONS</select>
<figure class="gallery"><img id="composite" src="early-640.png" width="640" alt="Actual runtime pilot composite"><figcaption id="caption">CAPTION</figcaption></figure>
<p class="facts">Envelope proof uses real commands: take envelope → walk outside → inside → bar → drop envelope → take envelope. Glass and stool cannot be carried in current simulation; no fabricated pickup is shown. Low/morning Mara studies retain the early state and explicitly change only the existing visual-light override.</p>
<h2>Contacts and occlusion</h2><svg class="diagram" viewBox="0 0 320 224" role="img" aria-label="Master-grid floor and counter masks with sprite contacts">
<image href="../../../../public/visuals/generated/bar--canonical-room--canonical--8b5c100cebc6.webp" width="320" height="224" opacity=".45"/>
<polygon points="COUNTER" fill="#ef62aa" fill-opacity=".17" stroke="#ef62aa" stroke-width=".6"/>
<polygon points="FLOOR" fill="#74c4cc" fill-opacity=".08" stroke="#74c4cc" stroke-width=".6"/>CONTACTS</svg>
<p>Pink: counter foreground mask, applied only behind it. Cyan: floor grounding clip. Countertop objects use a separate surface clip. Mara's old feet at zone y + 16 migrate explicitly to (174,167). Behind-bar staging uses (77,134). Both use the same sprite; these are alternative art placements, not new simulation poses.</p>
<p>Depth bands sort before foot-contact y. Hanging and raised contacts do not cast floor doubles. No stair/stage actor placement is invented for this pilot. The traced counter is the required foreground occluder.</p>
<h2>Restrained reflections</h2><p>Each reflection is owned by its source entity: vertically compressed, below 25% alpha, faded and broken into bands, clipped to its surface. The image, shadow and reflection disappear together when the entity leaves or is taken. Hidden feet have no exposed-floor reflection. Mara lighting changes RGB by no more than 12% and keeps her source alpha and identity unchanged.</p>
<h2>Budget and checks</h2><table><tr><th>Asset group</th><th>Bytes</th></tr><tr><td>Approved canonical plate</td><td>52,040</td></tr><tr><td>Eight native draft sprites</td><td>SPRITEBYTES</td></tr><tr><td>Eight draft reflection rasters</td><td>REFLECTIONBYTES</td></tr></table>
<p class="checks">Runtime passed: parser movement/custody, actual schedules, present/absent reflections, 320/640 sizing, pixelated rendering, mobile overflow, Off, Reduced and failed sprite cleanup. Exact records are linked above.</p>
<h2>What still needs your eye</h2><p>The pencil weakens on mobile; Mara is small and her reference has more detail than survives at 24 × 52. Two anonymous figures repeat across five busy slots, with limited perspective variation. Some prop clusters remain cleaner than the room. Reflections are subtle approximations. Existing baked neon remains bright at dawn.</p>
<p><strong>Next: review this bounded identity, sprite, placement and grounding proposal.</strong> No automatic library expansion or normal-runtime sprite activation. PR #1 stays draft; no merge or public deployment.</p>
</main><script>
const captions=CAPTIONS;const select=document.getElementById('capture');select.addEventListener('change',()=>{const key=select.value;const img=document.getElementById('composite');img.src=key+'.png';img.width=key==='early-320'?320:key==='mobile-390'?358:640;document.getElementById('caption').textContent=captions[key];});
</script></html>'''
for key,value in [('CARDS',''.join(cards)),('OPTIONS',options),('CAPTIONS',json.dumps(captions)),('CAPTION',captions['early-640']),
                  ('CONTACTS',contacts),('COUNTER',runtime['counterPolygon']),('FLOOR',runtime['floorPolygon']),
                  ('SPRITEBYTES',f'{sprite_bytes:,}'),('REFLECTIONBYTES',f'{reflection_bytes:,}')]:
    html=html.replace(key,value)
(root/'review/index.html').write_text(html,encoding='utf-8')
print(f'Review page written. Sprites: {sprite_bytes}; reflections: {reflection_bytes}; total: {sprite_bytes+reflection_bytes} bytes.')
