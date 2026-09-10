import contextlib
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock
from PIL import Image, ImageChops
from adapter import generate
from backends import BackendDefinition, BACKENDS, register_backend, backend_definition
from generator import SDXLTurbo, retro_crunch
from import_edit import import_edit
from layout_reference import write_bundle, load_reference, digest, encoded
from regions import region_masks, union_mask, composite_region, protected_difference, restore_pixel_structure
from test_layout import layout_manifest, options
from promote import promote


class RegionTests(unittest.TestCase):
    def test_masks_are_deterministic_disjoint_binary_and_protect_routes(self):
        m=layout_manifest(); names=["walls","floor","counter","shelves","stairs"]
        masks=region_masks(m,names); again=region_masks(m,names)
        union=Image.new("L",(640,448))
        for name,mask in masks.items():
            self.assertEqual(mask.tobytes(),again[name].tobytes())
            self.assertEqual(set(mask.getcolors()),{(mask.histogram()[0],0),(mask.histogram()[255],255)})
            self.assertIsNone(ImageChops.multiply(union,mask).getbbox())
            union=ImageChops.lighter(union,mask)
        from layout_reference import geometry
        owners=Image.new("L",(320,224)); from PIL import ImageDraw
        draw=ImageDraw.Draw(owners)
        for points,_,region in geometry(m["layoutBlueprint"],with_regions=True):
            draw.polygon(points,fill=255 if region=="protected" else 0)
        self.assertIsNone(ImageChops.multiply(owners.resize((640,448),Image.Resampling.NEAREST),union).getbbox())
        for names in ([],["floor","floor"],["ceiling"]):
            with self.assertRaises(ValueError): region_masks(m,names)

    def test_protected_pixels_survive_palette_and_contrast_with_palette_cap(self):
        m=layout_manifest(); mask=union_mask(region_masks(m,["walls","floor","stairs"]))
        base=Image.open(io.BytesIO(__import__('layout_reference').render_bundle(m)["reference.png"])).convert("RGB")
        generated=Image.new("RGB",base.size,(255,0,200))
        raw=composite_region(generated,base,mask)
        self.assertEqual(protected_difference(raw,base,mask),0)
        pixels=restore_pixel_structure(retro_crunch(raw,colors=24),retro_crunch(base,colors=24),mask,24)
        self.assertEqual(protected_difference(pixels,retro_crunch(base,colors=24),mask.resize(pixels.size,Image.Resampling.NEAREST)),0)
        self.assertLessEqual(len(pixels.getcolors(256)),24)
        with self.assertRaises(ValueError): composite_region(generated,base,Image.new("L",base.size,128))

    def test_regional_fixture_records_masks_pass_seeds_and_protected_counts(self):
        with tempfile.TemporaryDirectory() as directory,contextlib.redirect_stdout(io.StringIO()):
            m=layout_manifest(); ref=write_bundle(m,Path(directory)/"layout")
            def run(folder):
                return generate(m,options("--reference",str(ref),"--regions","walls,floor,counter","--count","2","--strengths",".5,.75","--backend","fixture","--output",str(Path(directory)/folder)))
            results=run("a"); repeated=run("b")
            self.assertEqual([c["metadata"]["sha256"] for c in results],[c["metadata"]["sha256"] for c in repeated])
            for c in results:
                meta=c["metadata"]; stage=Path(c["path"]).parent
                self.assertEqual(meta["conditioning"]["mode"],"regional-inpaint")
                self.assertEqual([r["seed"] for r in meta["regionPasses"]],[19421,20430,21439])
                self.assertEqual(meta["structurePreservation"]["sourceChangedProtectedPixels"],0)
                self.assertEqual(meta["structurePreservation"]["masterChangedProtectedPixels"],0)
                self.assertFalse(meta["structurePreservation"]["semanticGeometryApproved"])
                self.assertEqual(digest((stage/meta["sourceImage"]["file"]).read_bytes()),meta["sourceImage"]["sha256"])
            repo=Path(directory)/"repo"; (repo/"src/content/visuals").mkdir(parents=True); (repo/"src/content/visuals/assets.json").write_text("[]")
            c=results[0]; kwargs=dict(approve_architecture=True,composition=c["metadata"]["reviewContract"]["composition"],non_explicit=True)
            with self.assertRaisesRegex(ValueError,"Reference geometry approval"): promote(c["path"],"test","test",repo,True,**kwargs)
            maskpath=Path(c["path"]).parent/c["metadata"]["conditioning"]["mask"]["regions"][0]["file"]
            maskpath.write_bytes(b"tampered")
            with self.assertRaisesRegex(ValueError,"mask differs"): promote(c["path"],"test","test",repo,True,approve_reference_geometry=True,**kwargs)

    def test_inpaint_backend_passes_mask_and_current_composite(self):
        backend=SDXLTurbo.__new__(SDXLTurbo); backend.reference=Image.new("RGB",(640,448))
        backend.torch=Mock(); backend.torch.inference_mode.return_value=contextlib.nullcontext(); backend.torch.cuda.OutOfMemoryError=RuntimeError
        backend.pipeline=Mock(spec=[]); backend.pipeline.return_value=type('Output',(),{'images':['output']})()
        mask=Image.new("L",(640,448),255); current=Image.new("RGB",(640,448),"red")
        backend.generate({"modelPrompt":"test"},{"steps":4,"strength":.75,"width":640,"height":448},1,reference=current,mask=mask)
        args=backend.pipeline.call_args.kwargs
        self.assertIs(args["mask_image"],mask); self.assertEqual(args["image"].tobytes(),current.tobytes())

    def test_backend_registration_does_not_replace_or_download(self):
        definition=BackendDefinition("local-test",None,("text-only",),20,None)
        try:
            register_backend("test-local",definition)
            self.assertIs(backend_definition("test-local"),definition)
            with self.assertRaises(ValueError): register_backend("sdxl",definition)
            with self.assertRaises(ValueError): backend_definition("unapproved-model")
        finally: BACKENDS.pop("test-local",None)

    def test_reference_accepts_different_png_encoding_but_never_changed_pixels(self):
        with tempfile.TemporaryDirectory() as directory:
            m=layout_manifest(); path=write_bundle(m,directory); png=path.parent/"reference.png"
            with Image.open(png) as image: image.save(path.parent/"alternate.png",compress_level=0)
            png.write_bytes((path.parent/"alternate.png").read_bytes())
            bundle=json.loads(path.read_text()); bundle["reference"]["sha256"]=digest(png.read_bytes()); path.write_bytes(encoded(bundle))
            _,_,files=load_reference(m,path,640,448)
            self.assertEqual(files["reference.png"],png.read_bytes())
            with Image.open(png) as image:
                image.putpixel((10,10),(255,0,0)); image.save(path.parent/"altered.png")
            png.write_bytes((path.parent/"altered.png").read_bytes()); bundle["reference"]["sha256"]=digest(png.read_bytes()); path.write_bytes(encoded(bundle))
            with self.assertRaisesRegex(ValueError,"pixels"): load_reference(m,path,640,448)

    def test_manual_edit_preserves_parent_and_resets_approval_and_model_execution(self):
        with tempfile.TemporaryDirectory() as directory,contextlib.redirect_stdout(io.StringIO()):
            root=Path(directory); m=layout_manifest()
            c=generate(m,options("--count","1","--backend","fixture","--output",str(root/"parent")))[0]
            parent=Path(c["path"]); original=parent.read_bytes(); edited=root/"edited.png"
            image=Image.open(parent.parent/c["metadata"]["sourceImage"]["file"]).convert("RGB"); image.putpixel((10,10),(255,0,255)); image.save(edited)
            args=(parent,edited,root/"edits","Test editor","Aseprite","Removed stray material mark")
            result=import_edit(*args); path=Path(result["candidate"]); meta=json.loads(path.with_suffix(".json").read_text())
            self.assertEqual(parent.read_bytes(),original)
            self.assertEqual((path.parent/"provenance/parent.png").read_bytes(),original)
            self.assertFalse(meta["modelExecuted"]); self.assertFalse(meta["authoritativeArchitecture"])
            self.assertEqual(meta["reviewStatus"],"draft"); self.assertIsNone(meta["structurePreservation"])
            self.assertEqual(meta["provenance"]["manualEdits"][0]["tool"],"Aseprite")
            self.assertEqual(meta["backend"],"fixture")  # Editing cannot launder fixture provenance.
            with self.assertRaisesRegex(ValueError,"already exists"): import_edit(*args)
            with self.assertRaisesRegex(ValueError,"notes"): import_edit(parent,edited,root/"other","editor","tool","")
