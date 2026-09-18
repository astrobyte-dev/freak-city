"""Run from any directory; no writes outside this experiment."""
from pathlib import Path
import subprocess, sys
ROOT = Path(__file__).resolve().parent
label = sys.argv[1] if len(sys.argv) > 1 else 'build'
commands = [
    ['tooling/portable/Compilers/inform7.exe', '-internal', 'tooling/portable/Internal', '-external', 'external', '-source', 'source/story.ni', '-o', 'build/auto.inf', '-no-index', '-no-progress'],
    ['tooling/portable/Compilers/inform6.exe', '-G', '-wxE2', 'build/auto.inf', 'build/story.ulx'],
]
for i, command in enumerate(commands):
    command[0] = str(ROOT / command[0])
    result = subprocess.run(command, cwd=ROOT, capture_output=True)
    (ROOT / f'evidence/{label}-compiler-{i+1}.txt').write_bytes(result.stdout + result.stderr)
    print((result.stdout + result.stderr).decode(errors='replace'))
    if result.returncode: sys.exit(result.returncode)
