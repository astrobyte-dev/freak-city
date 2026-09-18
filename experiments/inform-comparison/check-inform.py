"""Fresh VM per case, LF bytes to WSL, actual VM state and text assertions.
Recorded failures are results; exit status 0 means the harness completed.
"""
from pathlib import Path
import subprocess, json, sys, re, hashlib, datetime
ROOT = Path(__file__).resolve().parent
label = sys.argv[1] if len(sys.argv)>1 else 'rerun-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
story = sys.argv[2] if len(sys.argv)>2 else 'build/story.ulx'
# Each tuple is: case, inputs, expected fragments, forbidden fragments.
cases = [
 ('vessel', ['take cup','inventory','examine cup','take another sip of coffee','finish cup','put down the cup','state'], ['2 portions remain','portions=0','cup-holder=Test Cafe'], []),
 ('negative', ["no it dosen't sound threatening",'state'], ['opinion=-1','not threatening','pending=none'], []),
 ('positive', ['yes very threatening','state'], ['opinion=1','pending=none'], []),
 ('uncertain', ['maybe yes','state'], ['opinion=0','pending=complaint','tick=0'], ['opinion=1']),
 ('interrupt', ['look','inventory','read photograph','state',"no it dosen't sound threatening",'state'], ['player-read=true','tick=0','opinion=-1'], []),
 ('topic-change', ['ask Rowan about music','tell me more','yes','state'], ['trumpet','Which question','opinion=0','topic=music','pending=none'], []),
 ('refill', ['finish cup','ask for another drink','yes ill have another coffee','state'], ['refills the same cup','portions=3','pending=none'], []),
 ('misplaced-drink-yes', ['yes ill have another coffee','state'], ['opinion=0','pending=complaint'], ['opinion=1']),
 ('misplaced-threat-yes', ['ask for another drink','yes very threatening','state'], ['pending=drink'], ['refills the same cup']),
 ('offer', ['I could come with you','state'], ['company=1','No accompaniment accepted','due=0'], []),
 ('decline', ["I can't come with you",'state'], ['company=-1','due=0'], ['company=1']),
 ('uncertain-company', ['I might come with you','state'], ['company=0','tick=0'], []),
 ('claim', ['tell Rowan about photograph','state'], ['claim=true','inspected=false','photo-holder=counter'], []),
 ('negative-claim', ["tell Rowan about no photograph",'state'], ['claim=false'], ['claim=true']),
 ('give', ['take photograph','give photograph to Rowan','state'], ['photo-holder=Rowan','inspected=false','player-read=false'], []),
 ('show', ['take photograph','show photograph to Rowan','state'], ['photo-holder=yourself','ACTOR Rowan: opinion=0; company=0; claim=false; inspected=true'], []),
 ('remote-show', ['take photograph','north','show photograph to Rowan','state'], ['inspected=false','photo-holder=yourself'], []),
 ('second-vessel', ['take cup','take mug','sip mug','finish cup','put mug on counter','state'], ['cup-holder=yourself; portions=0','VESSEL mug: holder=counter; portions=2'], []),
 ('ambiguous-vessel', ['take vessel','mug','state'], ['Which do you mean','VESSEL mug: holder=yourself','cup-holder=counter'], []),
 ('second-person', ['tell Kit about photograph','take photograph','show photograph to Kit','give photograph to Kit','ask Kit about complaint','no','state'], ['ACTOR Kit: opinion=-1; company=0; claim=true; inspected=true','ACTOR Rowan: opinion=0; company=0; claim=false; inspected=false','photo-holder=Kit'], []),
 ('absent-event', ['check ledger','north','wait','wait','state','south','ask Rowan about ledger'], ['room=Yard','completed=true','reports: I checked the ledger'], []),
 ('second-event', ['ask Kit about complaint','check ledger','north','wait','wait','state','south','ask Kit about ledger'], ['ACTOR Rowan: opinion=0; company=0; claim=false; inspected=false; due=0; completed=false','Kit reports: I checked'], []),
 ('save-pending', ['check ledger','state','save','evidence/pending.glksave','yes very threatening','north','wait','state','restore','evidence/pending.glksave','state','north','wait','wait','state','south','ask Rowan about ledger'], ['Ok.','pending=complaint','due=4; completed=false','room=Yard','due=4; completed=true'], []),
 ('failed-action-time', ['check ledger','take counter','state'], ['tick=1'], []),
]
heldback = [
 ('held-negative', ["no it doesn't sound threatening",'state'], ['opinion=-1'], []),
 ('held-sip', ['have another sip of coffee','state'], ['portions=2'], []),
 ('held-put', ['take cup','set the cup down','state'], ['cup-holder=Test Cafe'], []),
 ('held-followup', ['ask Rowan about music','what do you mean by that','state'], ['apologized twice'], []),
 ('held-refusal', ['I cannot accompany you','state'], ['company=-1'], []),
 ('held-qualified', ["yes but I am not sure",'state'], ['opinion=0','pending=complaint','tick=0'], []),
 ('held-typo', ['take coffe','state'], ['cup-holder=yourself'], []),
]
out = ROOT/'evidence'/label
out.mkdir(exist_ok=False)
(out/'build.json').write_text(json.dumps({'story':story,'sha256':hashlib.sha256((ROOT/story).read_bytes()).hexdigest()},indent=2))
results=[]
for name, commands, required, forbidden in cases+heldback:
    # Separate filename per run. SAVE/RESTORE use engine prompts, not a simulated snapshot.
    save = out/'pending.glksave'
    save_linux = '/mnt/'+save.drive[0].lower()+save.as_posix()[2:]
    commands=[c.replace('evidence/pending.glksave',save_linux) for c in commands]
    data=('\n'.join(commands+['quit','yes'])+'\n').encode()
    r=subprocess.run(['wsl','--exec','./tooling/glulxe/glulxe','-q',story], cwd=ROOT,input=data,capture_output=True,timeout=30)
    text=(r.stdout+r.stderr).decode(errors='replace')
    (out/f'{name}.txt').write_text(text,encoding='utf-8')
    missing=[x for x in required if x.lower() not in text.lower()]
    if r.returncode: missing.append('clean interpreter exit')
    unexpected=[x for x in forbidden if x.lower() in text.lower()]
    if name == 'save-pending':
        states=re.findall(r'STATE .*?(?=\n\n|\Z)',text,re.S)
        if len(states)!=4 or states[0] != states[2]: missing.append('exact restored world/context/actor snapshot')
        if 'Save failed' in text or 'Restore failed' in text: unexpected.append('save/restore failure')
        if not list(out.glob('pending.glksave*')): missing.append('physical save file')
    results.append(dict(case=name,held_back=name.startswith('held-'),commands=commands,required=required,forbidden=forbidden,missing=missing,unexpected=unexpected,passed=not missing and not unexpected,exit=r.returncode))
(out/'results.json').write_text(json.dumps(results,indent=2))
print('\n'.join(f"{'PASS' if r['passed'] else 'FAIL'} {r['case']}: {r['missing']} {r['unexpected']}" for r in results))
print(f"{sum(r['passed'] for r in results)}/{len(results)} fragment checks passed; inspect transcripts for relevance.")
