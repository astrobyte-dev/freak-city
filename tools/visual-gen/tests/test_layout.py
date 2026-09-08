import contextlib
import copy
import io
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from adapter import arguments, generate, reference_settings
from generator import SDXLTurbo, display_upscale, fixture_image
from layout_reference import render_bundle, write_bundle, load_reference, validate_layout, digest, encoded
from promote import promote
from test_roles import role_manifest

ROOT = Path(__file__).resolve().parents[3]


def layout_manifest():
    source = json.loads((ROOT / "docs/visuals/velvet-bar-layout/layout.json").read_text(encoding="utf-8"))
    m = {**role_manifest(), **source["worldFacts"], "layoutBlueprint": source["blueprint"]}
    ids = [f["entityId"] for group in ("staticArchitecture", "fixedFurniture") for f in m[group] if f.get("entityId")]
    m["canonicalEntities"] = [{"id": id, "kind": "Scenery", "portable": False} for id in ids]
    m["bakedEntities"] = [{"id": id, "location": "bar"} for id in ids]
    m["generationPresets"]["canonical-room"]["displayWidth"] = 640
    return m


def options(*args):
    return arguments(["--manifest", "unused", "--role", "canonical-room", "--steps", "4", "--seed", "19421", *args])


class LayoutTests(unittest.TestCase):
    def test_deterministic_reference_matches_committed_pixels_and_facts(self):
        m = layout_manifest()
        first = render_bundle(m)
        self.assertEqual(first, render_bundle(copy.deepcopy(m)))
        self.assertEqual(first["reference.png"], (ROOT / "docs/visuals/velvet-bar-layout/reference.png").read_bytes())
        bundle = json.loads(first["layout.json"])
        self.assertEqual(bundle["worldFactsSha256"], digest(encoded(bundle["worldFacts"])))
        self.assertEqual(bundle["reference"]["sha256"], digest(first["reference.png"]))
        self.assertEqual(bundle["reviewStatus"], "pending-human-layout-review")

    def test_exactly_one_staircase_with_upstairs_and_adjacent_salon(self):
        for alteration in ("duplicate", "missing", "wrong-upstairs", "distant-salon"):
            with self.subTest(alteration=alteration):
                m = layout_manifest(); l = m["layoutBlueprint"]
                if alteration == "duplicate": l["elements"].append({**l["elements"][0], "id": "extra-stairs"})
                if alteration == "missing": l["elements"].pop(0)
                if alteration == "wrong-upstairs": l["elements"][0]["route"] = "archive"
                if alteration == "distant-salon": next(r for r in l["routes"] if r["to"] == "salon")["span"] = [270,310]
                with self.assertRaises(ValueError): validate_layout(m)

    def test_missing_invented_duplicate_and_cardinal_exits_are_rejected(self):
        for alteration in ("missing", "invented", "duplicate", "cardinal"):
            m = layout_manifest(); routes = m["layoutBlueprint"]["routes"]
            if alteration == "missing": routes.pop()
            if alteration == "invented": routes[0]["to"] = "balcony"
            if alteration == "duplicate": routes.append(copy.deepcopy(routes[0]))
            if alteration == "cardinal": next(r for r in routes if r["to"] == "kitchen")["wall"] = "east"
            with self.subTest(alteration=alteration), self.assertRaises(ValueError): validate_layout(m)

    def test_permanent_fact_coverage_fixed_ids_high_window_and_dynamic_exclusion(self):
        for alteration in ("uncovered", "fixed-id", "dynamic", "low-window", "swapped-fixed", "wrong-fact"):
            m = layout_manifest()
            if alteration == "uncovered": m["staticArchitecture"].append({"text": "New reviewed permanent fact"})
            if alteration == "fixed-id": m["layoutBlueprint"]["elements"][1]["entityId"] = "fake-counter"
            if alteration == "dynamic": m["dynamicObjects"].append("counter")
            if alteration == "low-window": next(e for e in m["layoutBlueprint"]["elements"] if e["kind"] == "window")["bottom"] = 12
            if alteration == "swapped-fixed":
                m["layoutBlueprint"]["elements"][1]["entityId"], m["layoutBlueprint"]["elements"][2]["entityId"] = "detail_bar_shelves", "counter"
            if alteration == "wrong-fact": m["layoutBlueprint"]["elements"][1]["facts"] = ["fixedFurniture:1"]
            with self.subTest(alteration=alteration), self.assertRaises(ValueError): validate_layout(m)

    def test_stale_and_tampered_reference_rejected_before_model_load(self):
        with tempfile.TemporaryDirectory() as directory:
            m = layout_manifest(); path = write_bundle(m, directory)
            image, conditioning, _ = load_reference(m, path, 640, 448)
            self.assertEqual(image.size, (640,448))
            self.assertEqual(conditioning["mode"], "img2img")
            write_bundle(m, directory)  # Identical repeat is safe.
            with self.assertRaisesRegex(ValueError, "dimensions"): load_reference(m, path, 512, 384)
            changed = copy.deepcopy(m); changed["canonicalArchitecture"] += " Updated geometry."
            with self.assertRaisesRegex(ValueError, "Stale"): load_reference(changed, path, 640,448)
            (Path(directory)/"reference.png").write_bytes(b"changed")
            with patch("adapter.SDXLTurbo") as loader, self.assertRaisesRegex(ValueError, "pixels"):
                generate(m, options("--reference", str(path), "--output", str(Path(directory)/"drafts")))
            loader.assert_not_called()
            with self.assertRaisesRegex(ValueError, "differs"): write_bundle(m, directory)

    def test_strength_validation_and_effective_steps(self):
        valid = options("--reference", "unused", "--strengths", "0.25,0.5,0.75,1")
        self.assertEqual(reference_settings(valid), [.25,.5,.75,1])
        for args in (("--strength", "0.5"), ("--reference", "x", "--strength", "nan"), ("--reference", "x", "--strength", "0.1"), ("--reference", "x", "--strength", "1.1"), ("--reference", "x", "--strengths", "0.25,0.5"), ("--reference", "x", "--strengths", ".25,.5,.75,.9"), ("--reference", "x", "--strengths", ".25,.5,.75,1", "--strength", ".5")):
            with self.subTest(args=args), self.assertRaises(ValueError): reference_settings(options(*args))
        with self.assertRaises(ValueError): reference_settings(arguments(["--manifest","unused","--reference","x"]))

    def test_matrix_shared_seed_settings_reference_sidecars_and_exact_upscale(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            m = layout_manifest(); root=Path(directory); reference=write_bundle(m,root/"layout")
            def run(folder, extra=()):
                return generate(m, options("--reference",str(reference),"--strengths",".25,.5,.75,1","--backend","fixture","--output",str(root/folder),*extra))
            first=run("a"); second=run("b")
            self.assertEqual([c["seed"] for c in first], [19421]*4)
            self.assertEqual([c["metadata"]["generationSettings"]["effectiveSteps"] for c in first],[1,2,3,4])
            self.assertEqual([c["metadata"]["sha256"] for c in first],[c["metadata"]["sha256"] for c in second])
            for c in first:
                meta=c["metadata"]; stage=Path(c["path"]).parent
                self.assertFalse(meta["modelExecuted"])
                self.assertFalse(meta["authoritativeArchitecture"])
                self.assertEqual(meta["reviewStatus"], "draft")
                self.assertTrue(meta["referenceGeometryReviewRequired"])
                for key in ("reference", "layout"):
                    record=meta["conditioning"][key]
                    self.assertEqual(digest((stage/record["file"]).read_bytes()),record["sha256"])
                with Image.open(c["path"]) as display, Image.open(stage/meta["pixelSource"]["file"]) as pixels:
                    self.assertEqual(display.size,(640,448))
                    self.assertEqual(pixels.size,(320,224))
                    master = [pixels.getpixel((x,y)) for y in range(224) for x in range(320)]
                    for dy in (0,1):
                        for dx in (0,1):
                            self.assertEqual([display.getpixel((2*x+dx,2*y+dy)) for y in range(224) for x in range(320)], master)
            self.assertEqual(len(list(Path(first[0]["path"]).parent.glob("*.png"))),4)
            self.assertTrue((root/"a/review"/first[0]["metadata"]["runId"]/"contact-sheet.webp").exists())
            compact=run("compact",("--display-width","512"))
            self.assertEqual(compact[0]["metadata"]["dimensions"],{"width":512,"height":358})

    def test_nonmatrix_reference_keeps_incrementing_seeds(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            m=layout_manifest(); ref=write_bundle(m,Path(directory)/"layout")
            result=generate(m,options("--reference",str(ref),"--strength",".5","--count","2","--backend","fixture","--output",str(Path(directory)/"drafts")))
            self.assertEqual([c["seed"] for c in result],[19421,19422])

    def test_real_backend_call_uses_reference_strength_and_cpu_seed_generator(self):
        # Exercise the actual call binding without loading a model in unit tests.
        backend=SDXLTurbo.__new__(SDXLTurbo)
        backend.reference=fixture_image(2,640,448)
        backend.torch=Mock(); backend.torch.inference_mode.return_value=contextlib.nullcontext()
        backend.torch.cuda.OutOfMemoryError=RuntimeError
        backend.pipeline=Mock(spec=[])
        backend.pipeline.return_value=SimpleNamespace(images=["output"])
        self.assertEqual(backend.generate({"modelPrompt":"short prompt"},{"steps":4,"strength":.5},19421),"output")
        args=backend.pipeline.call_args.kwargs
        self.assertEqual(args["image"].tobytes(),backend.reference.tobytes())
        self.assertEqual(args["strength"],.5)
        self.assertEqual(args["num_inference_steps"],4)
        self.assertEqual(args["guidance_scale"],0)
        self.assertNotIn("width",args)
        backend.torch.Generator.assert_called_once_with(device="cpu")
        backend.torch.Generator.return_value.manual_seed.assert_called_once_with(19421)

    def test_guided_promotion_needs_separate_layout_and_geometry_attestation(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            m=layout_manifest(); root=Path(directory); ref=write_bundle(m,root/"layout")
            c=generate(m,options("--reference",str(ref),"--count","1","--backend","fixture","--output",str(root/"drafts")))[0]
            repo=root/"repo"; (repo/"src/content/visuals").mkdir(parents=True); (repo/"src/content/visuals/assets.json").write_text("[]")
            kwargs={"approve_architecture":True,"non_explicit":True,"composition":c["metadata"]["reviewContract"]["composition"]}
            with self.assertRaisesRegex(ValueError,"Reference geometry approval"):
                promote(c["path"],"test","test only",repo,True,**kwargs)
            result=promote(c["path"],"test","test only",repo,True,approve_reference_geometry=True,**kwargs)
            self.assertTrue(result["asset"]["review"]["referenceGeometryChecked"])
            self.assertEqual(result["asset"]["width"],640)
            (Path(c["path"]).parent/"reference/reference.png").write_bytes(b"tampered")
            with self.assertRaisesRegex(ValueError,"provenance"):
                promote(c["path"],"test","test only",repo,True,approve_reference_geometry=True,**kwargs)


if __name__ == "__main__":
    unittest.main()
