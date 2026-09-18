from pathlib import Path
import shutil, base64
root=Path(__file__).resolve().parent
web=root/'web'
web.mkdir(exist_ok=True)
assets=web/'interpreter'
assets.mkdir(exist_ok=True)
for p in (root/'tooling/portable/Internal/Templates/Quixe').iterdir():
    if p.suffix in ['.js','.css','.gif']: shutil.copy2(p,assets/p.name)
story=base64.b64encode((root/'build/story.ulx').read_bytes()).decode()
(assets/'story.js').write_text("$(document).ready(function(){GiLoad.load_run(null,'"+story+"','base64');});")
