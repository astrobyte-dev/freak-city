import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from import_external import import_external, validate_external_provenance, frame_source
from import_edit import import_edit
from layout_reference import digest
from promote import promote
from test_roles import role_manifest
from review_page import review_page


class ExternalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "external.png"
        image = Image.new("RGB", (400, 300))
        image.putdata([(x % 256, y % 256, (x + y) % 256) for y in range(300) for x in range(400)])
        image.save(self.source)
        self.manifest = self.root / "manifest.json"
        self.manifest.write_text(json.dumps(role_manifest()), encoding="utf-8")
        self.repo = self.root / "repo"
        (self.repo / "src/content/visuals").mkdir(parents=True)
        (self.repo / "src/content/visuals/assets.json").write_text("[]")

    def imported(self, **overrides):
        args = dict(manifest=self.manifest, source=self.source, output=self.root / "drafts",
                    editor="Supplied by user", service="External editor; exact model unknown",
                    notes="Test source only", framing_notes="Remove bottom test margin", crop=[0, 0, 400, 280])
        return import_external(**{**args, **overrides})

    def approved_args(self, candidate):
        return dict(approve_architecture=True, non_explicit=True,
                    composition=candidate["metadata"]["reviewContract"]["composition"])

    def test_retains_source_bytes_honest_draft_and_exact_48_64_grid(self):
        original = self.source.read_bytes()
        results = self.imported()
        for result, colors in zip(results, (48, 64)):
            meta = result["metadata"]
            stage = Path(result["path"]).parent
            self.assertEqual((stage / meta["originalSource"]["file"]).read_bytes(), original)
            self.assertEqual(meta["reviewStatus"], "draft")
            self.assertEqual(meta["architectureReviewState"], "pending-human-review")
            self.assertFalse(meta["authoritativeArchitecture"])
            self.assertFalse(meta["modelExecuted"])
            self.assertIsNone(meta["model"])
            self.assertIsNone(meta["seed"])
            self.assertIsNone(meta["prompt"])
            expected = validate_external_provenance(stage, meta)
            with Image.open(stage / meta["pixelSource"]["file"]) as master, Image.open(result["path"]) as display:
                self.assertEqual(master.size, (320, 224))
                self.assertLessEqual(len(master.getcolors(256)), colors)
                self.assertEqual(display.size, (640, 448))
                self.assertEqual(display.tobytes(), expected.tobytes())
                self.assertEqual(display.resize(master.size, Image.Resampling.NEAREST).tobytes(), master.tobytes())
        self.assertEqual(self.source.read_bytes(), original)
        self.assertEqual((self.repo / "src/content/visuals/assets.json").read_text(), "[]")

    def test_rejects_unreviewed_aspect_invalid_crop_alpha_and_settings_before_writes(self):
        for overrides in ({"crop": None}, {"crop": [0, 0, 401, 280]}, {"crop": [0, 0, 400, 281]},
                          {"crop": [0.0, 0, 400, 280]}, {"framing_notes": ""}, {"colors": [48, 48]},
                          {"colors": [32]}, {"contrast": float("nan")}, {"editor": ""}):
            with self.subTest(overrides=overrides), self.assertRaises(ValueError):
                self.imported(**overrides)
        Image.new("RGBA", (400, 300), (10, 10, 10, 0)).save(self.source)
        with self.assertRaisesRegex(ValueError, "opaque"):
            self.imported()
        self.assertFalse((self.root / "drafts").exists())

    def test_exact_ratio_requires_no_crop_and_duplicate_import_refuses_overwrite(self):
        self.assertEqual(frame_source(Image.new("RGB", (400, 280)), None)[1], [0, 0, 400, 280])
        result = self.imported()[0]
        original = Path(result["path"]).read_bytes()
        with self.assertRaises(FileExistsError):
            self.imported()
        self.assertEqual(Path(result["path"]).read_bytes(), original)

    def test_parent_source_is_retained_without_invented_generated_parent(self):
        parent = self.root / "parent.png"
        Image.new("RGB", (400, 300), "purple").save(parent)
        result = self.imported(parent_source=parent, edit_prompt="Remove test object")[0]
        meta = result["metadata"]
        self.assertEqual(meta["provenance"]["parentSource"]["sha256"], digest(parent.read_bytes()))
        self.assertEqual(meta["prompt"], "Remove test object")
        with self.assertRaisesRegex(ValueError, "import_external"):
            import_edit(result["path"], self.source, self.root / "other", "editor", "tool", "notes")

    def test_all_retained_files_are_checked_before_promotion_writes(self):
        result = self.imported(parent_source=self.source)[0]
        stage = Path(result["path"]).parent
        meta = result["metadata"]
        records = [meta[key] for key in ("originalSource", "sourceImage", "unquantizedMaster", "pixelSource", "worldManifest")]
        records += [meta["provenance"]["parentSource"]]
        for record in records:
            path = stage / record["file"]
            original = path.read_bytes()
            path.write_bytes(b"tampered")
            with self.subTest(file=path.name), self.assertRaisesRegex(ValueError, "provenance"):
                promote(result["path"], "test", "test", self.repo, **self.approved_args(result))
            path.write_bytes(original)
        self.assertFalse((self.repo / "public").exists())

    def test_rehashed_wrong_pixels_and_outside_paths_do_not_pass(self):
        result = self.imported()[0]
        stage = Path(result["path"]).parent
        for key in ("sourceImage", "unquantizedMaster", "pixelSource"):
            meta = copy.deepcopy(result["metadata"])
            path = stage / meta[key]["file"]
            original = path.read_bytes()
            with Image.open(path) as image:
                altered = image.copy()
            altered.putpixel((0, 0), (255, 255, 255))
            altered.save(path)
            meta[key]["sha256"] = digest(path.read_bytes())
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, "reproduce"):
                validate_external_provenance(stage, meta)
            path.write_bytes(original)
        meta = copy.deepcopy(result["metadata"])
        meta["originalSource"]["file"] = str(self.source)
        with self.assertRaisesRegex(ValueError, "provenance"):
            validate_external_provenance(stage, meta)

    def test_promotion_still_requires_human_architecture_composition_and_non_explicit_review(self):
        result = self.imported()[0]
        for kwargs in ({}, {"non_explicit": True}, {"non_explicit": True, "approve_architecture": True}):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                promote(result["path"], "test", "test", self.repo, **kwargs)
        self.assertFalse((self.repo / "public").exists())
        promoted = promote(result["path"], "test reviewer", "Fixture review only", self.repo, **self.approved_args(result))
        self.assertTrue(promoted["asset"]["review"]["architectureChecked"])
        draft = json.loads(Path(result["path"]).with_suffix(".json").read_text())
        self.assertEqual(draft["reviewStatus"], "draft")

    def test_review_page_discloses_external_source_and_pending_runtime(self):
        result = self.imported()[0]
        page = review_page(Path(result["path"]).parent, self.root / "review")
        content = page.read_text(encoding="utf-8")
        self.assertIn("48 colours / external edit", content)
        self.assertIn("64 colours / external edit", content)
        self.assertIn("High-resolution source; original bytes", content)
        self.assertIn("Runtime composite pending", content)
        self.assertIn("pending-human-review", content)
        self.assertNotIn("seed None", content)
        self.assertTrue(list((self.root / "drafts/review").glob("*/contact-sheet.webp")))

    def test_rehashed_display_and_fabricated_dimensions_or_model_are_rejected(self):
        result = self.imported()[0]
        candidate = Path(result["path"])
        meta = result["metadata"]
        for field, value in (("dimensions", {"width": 320, "height": 224}), ("model", "invented-model"), ("modelExecuted", True)):
            bad = {**meta, field: value}
            with self.subTest(field=field), self.assertRaises(ValueError):
                validate_external_provenance(candidate.parent, bad)
        with Image.open(candidate) as image:
            changed = image.copy()
        changed.putpixel((0, 0), (255, 255, 255))
        changed.save(candidate)
        meta["sha256"] = digest(candidate.read_bytes())
        candidate.with_suffix(".json").write_text(json.dumps(meta))
        with self.assertRaisesRegex(ValueError, "External display"):
            promote(candidate, "test", "test", self.repo, **self.approved_args(result))
        self.assertFalse((self.repo / "public").exists())


if __name__ == "__main__":
    unittest.main()
