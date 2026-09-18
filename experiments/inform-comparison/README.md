# Inform comparison — runnable local experiment

**Decision and evidence: [REPORT.md](REPORT.md). Shared contract: [SPEC.md](SPEC.md).**

The sample has compiled and executed in Glulxe and in connected Chrome using Quixe. All synthetic content, tools, saves and evidence live here. Production code and existing saves are unchanged.

## Play

The evaluation server is currently at **http://localhost:52745/**. Its tab has been left open. For a fresh isolated origin, from the repository root:

```powershell
python experiments/inform-comparison/serve.py
```

Open the exact localhost URL it prints. The prebuilt `web/` contains everything needed; browser play does **not** require Inform, Node or WSL. `Ctrl+C` stops your server. A new port has separate browser saves. To resume an experiment save, serve this directory again on its original port (`--port 52745`, if free). Never serve the production trial on that port or use port 5181 for this experiment.

Try these commands individually:

```text
take cup
examine it
take another sip of coffee
finish cup
put down the cup
no it dosen't sound threatening
ask for another drink
yes ill have another coffee
take photograph
show photograph to Rowan
give photograph to Kit
state
ask Kit about complaint
check ledger
save
north
wait
wait
state
south
ask Kit about ledger
```

`SAVE` opens a named-save dialog. `RESTORE` requires selecting a saved entry before pressing Load. Reloading the page starts fresh; explicitly restore to resume. The Scene/help button opens a static image overlay. Export downloads only the currently displayed transcript, including diagnostic STATE output if requested. It is not a branch-preserving archive. Known failures are documented in the report; this is an evaluation build.

## Rebuild and reproduce

Already acquired tools are under ignored `tooling/`. Requirements to rebuild here: Windows Python, portable Inform compiler; to run terminal tests: existing WSL Ubuntu with GCC/make. No changes to the project's npm dependencies.

```powershell
# Only if the portable tools need to be reacquired (also requires Git and 7-Zip):
python experiments/inform-comparison/bootstrap.py

python experiments/inform-comparison/build.py rebuild
python experiments/inform-comparison/make-web.py
python experiments/inform-comparison/check-inform.py
python experiments/inform-comparison/audit-inform.py
node --import tsx experiments/inform-comparison/check-sable.ts
```

Inform runs create timestamped evidence directories. An optional first argument sets the directory name (must be unused); a second selects the story binary. Replay the frozen initial build:

```powershell
python experiments/inform-comparison/check-inform.py replay-initial evidence/initial.ulx
```

Sable's runner imports the **current working tree** reducer, validation and save API. It uses synthetic in-memory storage, writes JSON/text evidence inside this directory, and never connects to browser storage. `SABLE_EVAL_LABEL` can select a new output directory; the default is timestamped. The retained baseline is `evidence/sable-verified/`.

Interactive terminal play, from this directory:

```powershell
wsl --exec ./tooling/glulxe/glulxe build/story.ulx
```

CheapGlk resolves relative save filenames beside the story file (`build/`); browser saves are separate. The test harness passes LF bytes to WSL and absolute synthetic save paths. CRLF input produced misleading parser failures in the first harness attempt; that evidence is retained but excluded from conclusions.

No commits, pushes, deployment, production parser expansion or campaign migration were performed.
