"""Provider-neutral source metadata. Standard library only; never executes a model."""
import json
from pathlib import PurePosixPath, PureWindowsPath
from typing import Literal

SourceType = Literal["external-reviewed-edit", "manual-edit", "local-generation", "hosted-generation"]

SOURCE_TYPES: tuple[SourceType, ...] = ("external-reviewed-edit", "manual-edit", "local-generation", "hosted-generation")
IMPORT_BACKEND = "source-image-import"


def is_source_import(meta):
    return (meta.get("sourceType") in SOURCE_TYPES
            or meta.get("backend") in (*SOURCE_TYPES, IMPORT_BACKEND)
            or meta.get("provenance", {}).get("origin") in SOURCE_TYPES)


def authoring_metadata(value=None):
    """Unknown facts stay null/absent. Tool/provider/model never determine eligibility."""
    value = {} if value is None else value
    if not isinstance(value, dict):
        raise ValueError("Authoring metadata must be an object")
    allowed = {"authoringTool", "provider", "modelFamily", "model", "revision", "checkpointSha256",
               "license", "sourceUrl", "seed", "settings", "environment", "manualEdits"}
    if set(value) - allowed:
        raise ValueError("Unknown authoring fields: " + ", ".join(sorted(set(value) - allowed)))
    for key in allowed - {"seed", "settings", "environment", "manualEdits"}:
        if value.get(key) is not None and (not isinstance(value[key], str) or not value[key].strip()):
            raise ValueError(f"Authoring {key} must be a nonempty string or null")
    if value.get("seed") is not None and type(value["seed"]) is not int:
        raise ValueError("Authoring seed must be an integer or null")
    for key in ("settings", "environment"):
        if value.get(key) is not None and not isinstance(value[key], dict):
            raise ValueError(f"Authoring {key} must be an object or null")
    edits = value.get("manualEdits", [])
    if not isinstance(edits, list) or any(not isinstance(e, dict) or not all(
            isinstance(e.get(k), str) and e[k].strip() for k in ("editor", "tool", "notes")) for e in edits):
        raise ValueError("Manual edit history requires editor, tool and notes for each operation")
    sha = value.get("checkpointSha256")
    if sha is not None and (len(sha) != 64 or any(c not in "0123456789abcdef" for c in sha)):
        raise ValueError("Checkpoint hash must be lowercase SHA-256")
    try:
        return json.loads(json.dumps(value, allow_nan=False))
    except (TypeError, ValueError) as error:
        raise ValueError("Authoring metadata must be finite JSON") from error


def workflow_bytes(data):
    """Reject obvious nonportable paths/secrets before retaining a workflow copy.

    This is a guard, not a substitute for reviewing workflow JSON and custom nodes.
    """
    value = json.loads(data)
    if not isinstance(value, dict):
        raise ValueError("Workflow JSON must be an object")
    def visit(node):
        if isinstance(node, dict):
            for key, item in node.items():
                if key.lower().replace("-", "_") in ("api_key", "apikey", "token", "access_token", "password", "authorization", "credentials") and item:
                    raise ValueError("Workflow must not contain credentials")
                visit(item)
        elif isinstance(node, list):
            for item in node:
                visit(item)
        elif isinstance(node, str):
            if (PurePosixPath(node).is_absolute() or PureWindowsPath(node).drive
                    or ".." in PureWindowsPath(node).parts or node.startswith("~")):
                raise ValueError("Workflow must use portable relative paths")
    visit(value)
    return data
