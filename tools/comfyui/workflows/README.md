# Portable optional ComfyUI workflows

Portable workflow storage. The [Kontext v1 UI/API graph](velvet-kontext-dev-fp8-v1.md) is now prepared and statically checked against the shared workstation's core node schemas. It has not been executed or adopted as a production backend. Download and inference approvals remain pending. See [the exact proposal](../../../docs/KONTEXT-LOCAL-EVALUATION-PROPOSAL.md) and [the integration plan](../../../docs/COMFYUI-VISUAL-WORKFLOW.md).

For each future `<purpose>-v1.json`, retain a companion `<purpose>-v1.md` with purpose, contract link, input/output names, ComfyUI commit/version, custom-node URLs/revisions, model basenames and source/licence/component inventory. Keep actual workflow exports rather than screenshots alone; retain API-format execution JSON separately if used. A candidate stores its own immutable workflow copy and SHA-256.

Use portable relative filenames. Never include user-specific absolute paths, credentials, API tokens, weights, environments, downloads or caches. Review widget/prompt values and node configuration manually before committing. Model weights stay outside the repository. Do not add ComfyUI or node packages to game dependencies or CI. Installation, custom-node changes and model downloads belong to a separately approved workstation experiment.
