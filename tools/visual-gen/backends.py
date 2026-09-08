"""Explicit local backend registry. Adding a model is a reviewed code/config change."""
from dataclasses import dataclass
from typing import Callable
from generator import MODEL


def sdxl_factory(*args, **kwargs):
    from generator import SDXLTurbo
    return SDXLTurbo(*args, **kwargs)


@dataclass(frozen=True)
class BackendDefinition:
    model: str
    factory: Callable | None
    modes: tuple[str, ...]
    max_steps: int
    guidance: float | None


BACKENDS = {
    "sdxl": BackendDefinition(MODEL, sdxl_factory, ("text-only", "img2img", "regional-inpaint"), 4, 0),
    "fixture": BackendDefinition("procedural-fixture (NOT SDXL)", None, ("text-only", "img2img", "regional-inpaint"), 4, 0),
}


def register_backend(identifier, definition):
    from prompt_builder import safe_id
    safe_id(identifier)
    if identifier in BACKENDS or not isinstance(definition, BackendDefinition) or definition.max_steps < 1:
        raise ValueError("Register a new, explicit backend definition; existing backends cannot be replaced")
    BACKENDS[identifier] = definition


def backend_definition(identifier):
    if identifier not in BACKENDS:
        raise ValueError("Unknown backend; no model substitution or automatic download is allowed")
    return BACKENDS[identifier]
