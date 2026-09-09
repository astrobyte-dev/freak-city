# Portable optional ComfyUI workflows

Reserved for reviewed workflow JSON. No executable workflow has been tested or adopted in this task. See [the integration and bake-off plan](../../../docs/COMFYUI-VISUAL-WORKFLOW.md).

For each future `<purpose>-v1.json`, retain a companion `<purpose>-v1.md` with purpose, contract link, input/output names, ComfyUI commit/version, custom-node URLs/revisions, model basenames and source/licence/component inventory. Keep actual workflow exports rather than screenshots alone; retain API-format execution JSON separately if used. A candidate stores its own immutable workflow copy and SHA-256.

Use portable relative filenames. Never include user-specific absolute paths, credentials, API tokens, weights, environments, downloads or caches. Review widget/prompt values and node configuration manually before committing. Model weights stay outside the repository. Do not add ComfyUI or node packages to game dependencies or CI. Installation, custom-node changes and model downloads belong to a separately approved workstation experiment.
