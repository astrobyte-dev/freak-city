import contextlib
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from adapter import arguments, generate, seed_for
from generator import model_load_options, retro_crunch, fixture_image
from prompt_builder import build_prompt, safe_id
from promote import promote
from optimizer import optimize


def manifest():
    return {"roomId":"bar", "roomIdentity":"Velvet / the bar", "canonicalArchitecture":"A counter. A single staircase.",
            "timeVariants":["early","late","dawn"], "requiredVisualFacts":["Empty texture plate"], "forbiddenVisualFacts":["No baked doors or NPCs"],
            "styleGuide":{"core":"restrained neo-noir","family":"aged brass"}, "sceneConcept":"velvet texture", "lighting":"amber",
            "state":{"timeBand":"early","weather":"rain","npcPresence":["mara"],"canonicalObjects":["counter"]}}


class PipelineTests(unittest.TestCase):
    def test_safe_identifiers(self):
        for value in ("../secret", "foo/bar", "BAR", "", "a;echo"):
            with self.assertRaises(ValueError): safe_id(value)
        self.assertEqual(safe_id("loading-bay"),"loading-bay")

    def test_prompt_preserves_facts_but_keeps_model_plate_empty(self):
        spec=build_prompt(manifest(),"late")
        self.assertIn("single staircase",spec["prompt"])
        self.assertIn("No baked doors",spec["prompt"])
        self.assertIn("mara",spec["prompt"])
        self.assertNotIn("mara",spec["modelPrompt"])
        self.assertIn("Background texture only",spec["modelPrompt"])
        self.assertEqual(spec["state"]["lighting"],"low")
        with self.assertRaises(ValueError):build_prompt(manifest(),"invented")

    def test_seeds_are_explicit_stable_and_bounded(self):
        self.assertEqual([seed_for(2741,i) for i in range(3)],[2741,2742,2743])
        self.assertEqual(seed_for(2**32-1,1),0)
        with self.assertRaises(ValueError):seed_for(-1,0)

    def test_cpu_does_not_request_fp16_variant(self):
        torch=Mock(float16="half",float32="full")
        self.assertNotIn("variant",model_load_options("cpu",torch))
        self.assertEqual(model_load_options("cuda",torch)["variant"],"fp16")
        self.assertEqual(model_load_options("cpu",torch)["torch_dtype"],"full")

    def test_dry_run_imports_no_model(self):
        with tempfile.TemporaryDirectory() as directory, patch("adapter.SDXLTurbo") as model, contextlib.redirect_stdout(io.StringIO()):
            opts=arguments(["--manifest","unused","--output",directory,"--dry-run"])
            self.assertEqual(generate(manifest(),opts),[]);model.assert_not_called()
            data=json.loads(next(Path(directory).rglob("dry-run.json")).read_text())
            self.assertFalse(data["modelExecuted"])
            self.assertFalse(list(Path(directory).rglob("*.png")))

    def test_fixture_metadata_contact_sheet_reproducibility_and_promotion(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            root=Path(directory)
            args=["--manifest","unused","--backend","fixture","--count","3","--seed","74"]
            first=generate(manifest(),arguments([*args,"--output",str(root/"a")]))
            second=generate(manifest(),arguments([*args,"--output",str(root/"b")]))
            self.assertEqual([c["metadata"]["sha256"] for c in first],[c["metadata"]["sha256"] for c in second])
            self.assertEqual(len(list((root/"a").rglob("*.png"))),3)
            self.assertEqual(len(list((root/"a").rglob("contact-sheet.webp"))),1)
            self.assertEqual(first[0]["metadata"]["reviewStatus"],"draft")
            self.assertFalse(first[0]["metadata"]["modelExecuted"])
            with self.assertRaises(ValueError):generate(manifest(),arguments([*args,"--output",str(root/"a")]))
            repo=root/"repo";(repo/"src/content/visuals").mkdir(parents=True)
            (repo/"src/content/visuals/assets.json").write_text("[]")
            with self.assertRaises(ValueError):promote(first[0]["path"],"reviewer","test",repo)
            promoted=promote(first[0]["path"],"test reviewer","Fixture plate inspected for test",repo,allow_fixture=True)
            self.assertLess(promoted["optimization"]["optimizedBytes"],150000)
            self.assertEqual(promoted["asset"]["status"],"canonical")
            self.assertTrue(Path(first[0]["path"]).exists())
            self.assertEqual(json.loads(Path(first[0]["path"]).with_suffix(".json").read_text())["reviewStatus"],"draft")
            shipped=repo/"public"/promoted["asset"]["file"]
            self.assertEqual(hashlib.sha256(shipped.read_bytes()).hexdigest(),promoted["asset"]["sha256"])
            with self.assertRaises(ValueError):promote(second[0]["path"],"reviewer","test",repo,True)

    def test_modified_candidate_cannot_inherit_review(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            candidate=generate(manifest(),arguments(["--manifest","unused","--backend","fixture","--count","1","--output",directory]))[0]
            Path(candidate["path"]).write_bytes(b"modified")
            with self.assertRaisesRegex(ValueError,"differs"):
                promote(candidate["path"],"reviewer","test",directory,True)

    def test_crunch_and_optimizer_preserve_grid_and_reject_crop(self):
        image=retro_crunch(fixture_image(1,640,448))
        self.assertEqual(image.size,(320,224));self.assertLessEqual(len(image.getcolors(1000)),48)
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/"square.png";image.resize((320,320)).save(source)
            with self.assertRaisesRegex(ValueError,"aspect ratio"):optimize(source,Path(directory)/"a.webp")

    def test_invalid_options_fail_before_model_loading(self):
        for flags in (["--count","0"],["--steps","8"],["--seed","-1"],["--colors","999"],["--guidance-scale","7.5"],["--width","513"]):
            with self.assertRaises(ValueError),patch("adapter.SDXLTurbo") as model:
                generate(manifest(),arguments(["--manifest","unused",*flags]))
            model.assert_not_called()


if __name__ == "__main__":unittest.main()
