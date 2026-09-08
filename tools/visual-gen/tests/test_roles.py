import contextlib
import copy
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from adapter import arguments, generate
from generator import display_upscale, fixture_image, retro_crunch
from prompt_builder import build_prompt
from promote import promote
from test_pipeline import manifest


def role_manifest(role="canonical-room"):
    return {**manifest(), "role": role, "staticArchitecture": [{"text": "One staircase"}],
            "fixedFurniture": [{"text": "Fixed bar counter", "entityId": "counter"}],
            "canonicalEntities": [{"id": "counter", "kind": "Container", "open": True, "portable": False, "properties": {"surface": True}}],
            "bakedEntities": [{"id": "counter", "location": "bar", "open": True}],
            "dynamicObjects": ["glass"], "dynamicDoors": ["door"],
            "canonicalVisualAnchors": {"door": {"x": 10, "y": 10, "width": 20, "height": 40, "glyph": "door"}},
            "npcZones": [{"x": 40 + i * 40, "y": 140} for i in range(4)],
            "atmosphereZones": [{"x": 0, "y": 90, "width": 320, "height": 60}],
            "foregroundZones": [{"x": 0, "y": 180, "width": 320, "height": 44}],
            "sceneIllustrationHints": ["Anonymous adult patrons at the bar, distant performer silhouette, non-explicit"],
            "requiredFacts": ["Keep one staircase and reserve dynamic overlay zones"],
            "forbiddenFacts": ["No named NPCs or evidence in room plate"],
            "generationPresets": {role: {"pixelWidth": 320, "displayWidth": 512, "colors": 48, "contrast": 1.15}},
            "weatherCompatibility": "inside"}


class RoleTests(unittest.TestCase):
    def test_roles_have_distinct_prompts_and_authority(self):
        for role in ("texture", "canonical-room", "scene-illustration", "overlay"):
            spec = build_prompt(role_manifest(role), role=role)
            self.assertEqual(spec["role"], role)
            self.assertFalse(spec["authoritativeArchitecture"])
            self.assertFalse(spec["authoritativeGeometry"])
            self.assertEqual(spec["modelPrompt"].startswith("Empty abstract texture plate"), role == "texture")
        canonical = build_prompt(role_manifest(), role="canonical-room")
        self.assertIn("One staircase", canonical["modelPrompt"])
        self.assertIn("Fixed bar counter", canonical["modelPrompt"])
        self.assertNotIn("glass", canonical["modelPrompt"])
        scene = build_prompt(role_manifest("scene-illustration"), role="scene-illustration")
        self.assertIn("patrons", scene["modelPrompt"])
        self.assertEqual(scene["bakedEntities"], [])

    def test_canonical_identity_is_independent_of_clock(self):
        early = role_manifest()
        late = copy.deepcopy(early)
        late["state"].update(timeBand="late", time=1600, npcPresence=[])
        self.assertEqual(build_prompt(early, role="canonical-room"), build_prompt(late, role="canonical-room"))
        with self.assertRaisesRegex(ValueError, "time band"):
            build_prompt(early, "late", "canonical-room")

    def test_role_and_manifest_validation(self):
        with self.assertRaises(ValueError): build_prompt(manifest(), role="invented")
        with self.assertRaises(ValueError): build_prompt(role_manifest(), role="overlay")
        for missing in ("staticArchitecture", "dynamicDoors", "requiredFacts"):
            m = role_manifest(); del m[missing]
            with self.assertRaises(ValueError): build_prompt(m, role="canonical-room")
        m = role_manifest(); m["conditioning"] = {"mode": "img2img", "reference": "layout.png"}
        with self.assertRaisesRegex(ValueError, "not implemented"):
            build_prompt(m, role="canonical-room")

    def test_mutable_entities_cannot_be_declared_fixed(self):
        for changes in ({"portable": True}, {"kind": "Door"}, {"kind": "Evidence"}, {"owner": "mara"}, {"properties": {}}):
            m = role_manifest(); m["canonicalEntities"][0].update(changes)
            with self.assertRaisesRegex(ValueError, "Unsafe permanent"):
                build_prompt(m, role="canonical-room")
        m = role_manifest(); m["dynamicObjects"].append("counter")
        with self.assertRaisesRegex(ValueError, "separation"):
            build_prompt(m, role="canonical-room")

    def test_nearest_upscale_preserves_palette_and_rounded_aspect(self):
        pixels = retro_crunch(fixture_image(44, 640, 448))
        display = display_upscale(pixels, 512)
        self.assertEqual(display.size, (512, 358))
        self.assertEqual({c for _, c in display.getcolors(256)}, {c for _, c in pixels.getcolors(256)})
        self.assertEqual(display.getpixel((0, 0)), pixels.getpixel((0, 0)))
        for width in (319, 4096):
            with self.assertRaises(ValueError): display_upscale(pixels, width)

    def test_preset_override_and_asset_metadata(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            opts = arguments(["--manifest", "unused", "--role", "canonical-room", "--backend", "fixture", "--count", "1", "--output", directory])
            result = generate(role_manifest(), opts)[0]
            meta = result["metadata"]
            self.assertEqual(meta["dimensions"], {"width": 512, "height": 358})
            self.assertEqual(meta["pixelDimensions"], {"width": 320, "height": 224})
            self.assertTrue((Path(result["path"]).parent / meta["pixelSource"]["file"]).exists())
            self.assertEqual(meta["generationSettings"]["contrast"], 1.15)
            self.assertEqual(meta["reviewStatus"], "draft")
            custom = arguments(["--manifest", "unused", "--role", "canonical-room", "--display-width", "640", "--dry-run", "--output", directory])
            generate(role_manifest(), custom)
            self.assertEqual(custom.display_width, 640)

    def test_invalid_upscale_fails_before_loading(self):
        with patch("adapter.SDXLTurbo") as loader, self.assertRaises(ValueError):
            generate(role_manifest(), arguments(["--manifest", "unused", "--role", "canonical-room", "--display-width", "128"]))
        loader.assert_not_called()

    def test_canonical_promotion_needs_architecture_and_composition_review(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            root = Path(directory); repo = root / "repo"
            (repo / "src/content/visuals").mkdir(parents=True)
            (repo / "src/content/visuals/assets.json").write_text("[]")
            candidate = generate(role_manifest(), arguments(["--manifest", "unused", "--role", "canonical-room", "--backend", "fixture", "--count", "1", "--output", str(root / "drafts")]))[0]
            args = (candidate["path"], "test reviewer", "Inspected geometry and overlays", repo, True)
            with self.assertRaises(ValueError): promote(*args)
            with self.assertRaises(ValueError): promote(*args, non_explicit=True, approve_architecture=True)
            composition = candidate["metadata"]["reviewContract"]["composition"]
            invalid = copy.deepcopy(composition); invalid["anchors"] = {}
            with self.assertRaises(ValueError): promote(*args, non_explicit=True, approve_architecture=True, composition=invalid)
            invalid = copy.deepcopy(composition); invalid["npcZones"][0]["x"] = 400
            with self.assertRaises(ValueError): promote(*args, non_explicit=True, approve_architecture=True, composition=invalid)
            result = promote(*args, non_explicit=True, approve_architecture=True, composition=composition)
            self.assertTrue(result["asset"]["authoritativeArchitecture"])
            self.assertEqual((result["asset"]["width"], result["asset"]["height"]), (512, 358))
            self.assertFalse(json.loads(Path(candidate["path"]).with_suffix(".json").read_text())["authoritativeArchitecture"])
            with self.assertRaises(ValueError): promote(*args, non_explicit=True, approve_architecture=True, composition=composition)

    def test_overlay_studies_cannot_be_promoted(self):
        from review import role_review
        with self.assertRaisesRegex(ValueError, "Overlay studies"):
            role_review(build_prompt(role_manifest("overlay"), role="overlay"))

    def test_illustration_review_requires_binding_and_no_geometry_authority(self):
        from review import role_review
        source = build_prompt(role_manifest("scene-illustration"), role="scene-illustration")
        with self.assertRaises(ValueError): role_review(source, non_explicit=True)
        cue = {"sceneId": "floor", "caption": "A slow shift at Velvet", "timeBands": ["late"], "requiredNPCs": [], "themes": []}
        fields, review = role_review(source, non_explicit=True, illustration=cue)
        self.assertFalse(fields["authoritativeGeometry"])
        self.assertTrue(review["nonExplicit"])
        source["authoritativeGeometry"] = True
        with self.assertRaises(ValueError): role_review(source, non_explicit=True, illustration=cue)

    def test_modified_pixel_source_cannot_be_promoted(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            candidate = generate(role_manifest(), arguments(["--manifest", "unused", "--role", "canonical-room", "--backend", "fixture", "--count", "1", "--output", directory]))[0]
            meta = candidate["metadata"]
            (Path(candidate["path"]).parent / meta["pixelSource"]["file"]).write_bytes(b"changed")
            with self.assertRaisesRegex(ValueError, "Pixel source"):
                promote(candidate["path"], "reviewer", "test", directory, True, non_explicit=True, approve_architecture=True, composition=meta["reviewContract"]["composition"])
