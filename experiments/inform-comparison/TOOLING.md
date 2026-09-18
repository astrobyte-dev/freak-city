# Tooling and browser verification

All executable acquisition and compilation occurred inside this experiment. The Windows installer was extracted as an archive with existing 7-Zip 26.01; it was never run. Existing WSL Ubuntu GCC/make were used without installing OS packages.

| Component | Exact tested version / revision | Source |
|---|---|---|
| Python / Node | Python 3.14.3 / Node 24.14.0 (existing workstation tools) | No installation |
| GCC | Ubuntu 13.3.0, existing WSL | No installation |
| Inform 7 | 10.1.2 Krypton | https://github.com/ganelson/inform/releases/tag/v10.1.2 |
| Inform 6 | 6.41, 22 July 2022 | Bundled Compilers/inform6.exe |
| Windows bundle | Inform_10_1_2_Windows.zip; 116,349,204 bytes | https://github.com/ganelson/inform/releases/download/v10.1.2/Inform_10_1_2_Windows.zip |
| Glulxe | README identifies 0.6.1; exact commit 56ab8743bab565de307bd892c555d8d8897ed517 | https://github.com/erkyrath/glulxe |
| CheapGlk | 1.0.7 / Glk 0.7.6; exact commit 14d8aaf6e4150669762bd4646a5368e75c1eeee6 | https://github.com/erkyrath/cheapglk |
| Quixe | 2.2.1 bundled Inform template | https://eblong.com/zarf/glulx/quixe/ |
| GlkOte / Glk JS | 2.3.2 as reported in bundled code | Bundled interpreter assets |
| jQuery | 1.12.4, bundled with that template | Bundled interpreter assets, isolated from production |
| Inform extensions | Basic Inform, English Language, Standard Rules, all bundled | No optional/third-party Inform extension installed |

The official release asset metadata is preserved in `evidence/inform-release-asset.json`. Its SHA-256 is `b489af19ab0986fb8f5e006b894cc8590bec46422bb265f9673a6ef3323eb087`; the downloaded archive matches. Exact binary/source hashes are in `evidence/build-hashes.json`. Glulxe/CheapGlk license files remain in their source packages; the original Inform archive and bundled browser assets are retained unchanged. Minified files do not all include license headers. This experiment has not performed production redistribution packaging.

## Compilation and replay

`build.py` invokes the portable inform7 compiler with explicit local internal/external directories, then inform6 `-G -wxE2`. Compiler output is retained under `evidence/`. No project-level package or global Inform configuration is consulted for optional extensions. The I6 logs include thousands of suppressed generated-code warnings; the compilers exit successfully and the produced binary was executed. This does not claim a warning-free port.

`bootstrap.py` records repeatable acquisition and build commands at pinned revisions. `make-web.py` copies the bundled interpreter assets and base64-encodes the compiled story using the template's GiLoad loader. It does not run a second world model. No release/publishing tool was invoked.

## Actual connected Chrome session

Fresh localhost port 52745 was bound only to 127.0.0.1; only `web/` was served. Existing localhost:5181 was never accessed. Browser interaction used the installed CUA browser API and its local-development guidance. No external Playwright/browser driver, debugging endpoint, personal storage inspection or storage clearing was used.

Sequence: CHECK LEDGER; STATE; SAVE as `comparison-pending`; YES VERY THREATENING; actual page reload; RESTORE, select `comparison-pending`, Load; STATE; NORTH; WAIT; WAIT; STATE; SOUTH; ASK ROWAN ABOUT LEDGER. Saved world restored to tick 1, pending complaint, opinion 0, deadline 4 and completion false. In Yard it reached tick 4 and completion true. The later ledger report remained attributed and limited.

Then Scene/help opened the static SVG overlay and Export visible transcript downloaded a text file. The actual downloaded synthetic file was copied to `evidence/browser-export.txt`; the original is still in Downloads. AX snapshots are `browser-restored.txt` and `browser-completion-overlay.txt`; screenshot is `browser-completion-overlay.png`. Browser reload correctly lost the visible pre-reload transcript: the downloadable wrapper export is NOT a persistent branch archive.

An initial Load click without selecting the entry did nothing; selecting it then loading succeeded. One immediate screenshot preceded the overlay's painted frame; the retained screenshot was replaced after visual confirmation that the image and overlay were visible. The first CLI save harness failure and its corrected checks are disclosed in REPORT.md.

This verifies desktop browser execution, explicit save/reload/restore, delayed off-screen state, static shell image/overlay and visible transcript download. It does not verify mobile layout, accessibility conformance, state-driven art, native Glk graphics, sound, React embedding, autosave, save compatibility across builds, or a structured VM/React bridge.
