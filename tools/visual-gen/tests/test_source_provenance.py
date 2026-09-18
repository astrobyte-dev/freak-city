import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from import_external import import_external, validate_external_provenance
from source_provenance import SOURCE_TYPES, authoring_metadata, workflow_bytes
from export_art import export_art
from layout_reference import digest
from promote import promote
from review_page import review_page
from test_roles import role_manifest


class SourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "source.png"
        Image.new("RGB", (400, 280), "purple").save(self.source)
        self.manifest = self.root / "world.json"
        self.manifest.write_text(json.dumps(role_manifest()))

    def imported(self, **kwargs):
        return import_external(self.manifest, self.source, self.root / "drafts", "artist",
                               notes="Specific test edit", framing_notes="Keep entire 10:7 frame",
                               colors=[64], **kwargs)[0]

    def test_all_sources_share_processing_and_promotion_without_provider(self):
        original = self.source.read_bytes()
        pixels = []
        for source_type in SOURCE_TYPES:
            candidate = self.imported(source_type=source_type)
            path, meta = Path(candidate["path"]), candidate["metadata"]
            pixels.append(path.read_bytes())
            self.assertEqual((path.parent / meta["originalSource"]["file"]).read_bytes(), original)
            self.assertEqual(meta["originalSource"]["sha256"], digest(original))
            self.assertEqual(meta["provenance"]["authoring"], {})
            self.assertFalse(meta["modelExecuted"])
            repo = self.root / source_type
            registry = repo / "src/content/visuals/assets.json"
            registry.parent.mkdir(parents=True)
            registry.write_text("[]")
            with self.assertRaises(ValueError):
                promote(path, "reviewer", "review", repo)
            result = promote(path, "reviewer", "review", repo, approve_architecture=True,
                             non_explicit=True, composition=meta["reviewContract"]["composition"])
            self.assertNotIn("provider", result["asset"])
            self.assertNotIn("backend", result["asset"])
            content = review_page(path.parent, self.root / (source_type + "-review")).read_text()
            self.assertNotIn("seed None", content)
        self.assertTrue(all(p == pixels[0] for p in pixels))

    def test_local_model_workflow_contract_and_manual_cleanup_are_retained(self):
        workflow = self.root / "workflow.json"
        workflow.write_text('{"nodes":[],"extra":{"input":"source.png"}}')
        contract = self.root / "contract.md"
        contract.write_text("# Intent\nPreserve the room")
        authoring = {"authoringTool": "ComfyUI", "modelFamily": "Example edit model",
                     "model": "test/model", "revision": "test-revision", "seed": 42,
                     "settings": {"steps": 20, "offload": True},
                     "manualEdits": [{"editor": "artist", "tool": "Krita", "notes": "Restore one edge"}]}
        result = self.imported(source_type="local-generation", authoring=authoring,
                               workflow=workflow, art_contract=contract, parent_source=self.source)
        path, meta = Path(result["path"]), result["metadata"]
        self.assertEqual(meta["provenance"]["authoring"], authoring)
        self.assertIsNone(meta["model"])
        for key, original in (("workflow", workflow), ("artContract", contract), ("parentSource", self.source)):
            r = meta["provenance"][key]
            retained = path.parent / r["file"]
            self.assertEqual(retained.read_bytes(), original.read_bytes())
            raw = retained.read_bytes()
            retained.write_bytes(b"changed")
            with self.assertRaises(ValueError):
                validate_external_provenance(path.parent, meta)
            retained.write_bytes(raw)
        changed = copy.deepcopy(meta)
        changed["sourceType"] = "manual-edit"
        with self.assertRaises(ValueError):
            validate_external_provenance(path.parent, changed)

    def test_manual_edit_reimports_without_parent_model(self):
        parent = self.source.read_bytes()
        edited = self.root / "edited.png"
        with Image.open(self.source) as image:
            image.putpixel((3, 3), (255, 0, 0))
            image.save(edited)
        result = import_external(self.manifest, edited, self.root / "edits", "artist",
                                 notes="Change one test pixel", framing_notes="Full frame",
                                 source_type="manual-edit", parent_source=self.source,
                                 authoring={"authoringTool": "Aseprite"})[0]
        self.assertEqual(result["metadata"]["provenance"]["parentSource"]["sha256"], digest(parent))
        self.assertEqual(self.source.read_bytes(), parent)

    def test_legacy_imports_remain_valid_without_rewriting_evidence(self):
        root = Path(__file__).resolve().parents[3]
        stage = root / "docs/visuals/velvet-architecture-cleanup/candidate"
        sidecar = stage / "bar__canonical-room__canonical__64-colours.json"
        before = sidecar.read_bytes()
        validate_external_provenance(stage, json.loads(before))
        self.assertEqual(before, sidecar.read_bytes())

    def test_bad_metadata_and_nonportable_workflow_rejected_before_writes(self):
        for metadata in ({"seed": "unknown"}, {"settings": {"steps": float("nan")}},
                         {"manualEdits": [{"tool": "Krita"}]}, {"provider": ""}, {"invented": 1}):
            with self.subTest(metadata=metadata), self.assertRaises(ValueError):
                self.imported(authoring=metadata)
        self.assertFalse((self.root / "drafts").exists())
        for value in ({"file": "C:\\Users\\artist\\source.png"}, {"file": "/home/artist/source.png"},
                      {"file": "../source.png"}, {"api_key": "secret"}):
            with self.assertRaises(ValueError):
                workflow_bytes(json.dumps(value).encode())

    def test_export_is_portable_byte_preserving_and_refuses_overwrite(self):
        contract = self.root / "brief.md"
        contract.write_text("# Art intent\nPreserve identity")
        output = self.root / "bundle"
        bundle = export_art(self.source, contract, output, self.manifest)
        self.assertEqual((output / "source.png").read_bytes(), self.source.read_bytes())
        self.assertEqual(bundle["files"]["source"]["sha256"], digest(self.source.read_bytes()))
        self.assertNotIn(str(self.root), json.dumps(bundle))
        with self.assertRaises(FileExistsError):
            export_art(self.source, contract, output)

    def test_import_and_promotion_modules_do_not_import_ml_packages(self):
        code = """
import importlib.abc, sys
class BlockML(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.split('.')[0] in {'torch','diffusers','transformers','comfy','openai','anthropic'}:
            raise AssertionError('Unexpected authoring dependency: ' + fullname)
sys.meta_path.insert(0, BlockML())
import import_external, promote, export_art
"""
        subprocess.run([sys.executable, "-c", code], cwd=Path(__file__).resolve().parents[1], check=True)


if __name__ == "__main__":
    unittest.main()
