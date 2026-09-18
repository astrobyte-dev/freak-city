"""Post-repair adversarial checks; intentionally no further game tuning."""
from pathlib import Path
import subprocess,json,datetime
root=Path(__file__).resolve().parent
out=root/'evidence'/('audit-rerun-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
out.mkdir()
cases=json.loads((root/'evidence/audit/commands.json').read_text())
for name,commands in cases.items():
    r=subprocess.run(['wsl','--exec','./tooling/glulxe/glulxe','-q','build/story.ulx'],cwd=root,input=('\n'.join(commands+['quit','yes'])+'\n').encode(),capture_output=True,check=True)
    (out/(name+'.txt')).write_bytes(r.stdout+r.stderr)
print(out)
