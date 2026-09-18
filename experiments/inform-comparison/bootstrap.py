"""Optional reproducible acquisition. Requires Windows, 7-Zip, Git, WSL GCC/make.
No installers run; no package-manager or global configuration changes.
"""
from pathlib import Path
import urllib.request, hashlib, subprocess, shutil
root=Path(__file__).resolve().parent
t=root/'tooling';t.mkdir(exist_ok=True)
url='https://github.com/ganelson/inform/releases/download/v10.1.2/Inform_10_1_2_Windows.zip'
expected='b489af19ab0986fb8f5e006b894cc8590bec46422bb265f9673a6ef3323eb087'
archive=t/'inform.zip'
if not archive.exists():
    with urllib.request.urlopen(url) as response, archive.open('wb') as output:
        shutil.copyfileobj(response,output)
if hashlib.sha256(archive.read_bytes()).hexdigest()!=expected:
    raise SystemExit('Inform archive checksum differs; retained for inspection.')
seven=shutil.which('7z') or 'C:/Program Files/7-Zip/7z.exe'
def run(args): subprocess.run(args,cwd=root,check=True)
if not (t/'portable/Compilers/inform7.exe').exists():
    run([seven,'x',str(archive),'-o'+str(t/'inform'),'-y'])
    run([seven,'x',str(t/'inform/Inform_10_1_2_Windows.exe'),'-o'+str(t/'portable'),'-y'])
for repo,rev in [('glulxe','56ab8743bab565de307bd892c555d8d8897ed517'),('cheapglk','14d8aaf6e4150669762bd4646a5368e75c1eeee6')]:
    path=t/repo
    if not path.exists(): run(['git','clone','https://github.com/erkyrath/'+repo+'.git',str(path)])
    run(['git','-C',str(path),'checkout','--detach',rev])
run(['wsl','--exec','make','-C','tooling/cheapglk'])
run(['wsl','--exec','make','-C','tooling/glulxe','OPTIONS=-O2 -DOS_UNIX -DUNIX_RAND_GETRANDOM'])
for name in ['build','external','evidence']: (root/name).mkdir(exist_ok=True)
print('Portable tools ready. Run build.py, make-web.py, then serve.py.')
