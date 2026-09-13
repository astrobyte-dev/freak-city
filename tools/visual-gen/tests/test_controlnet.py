import contextlib
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
import sys
from unittest.mock import Mock, patch
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from adapter import generate
from backends import backend_definition
from controlnet_backend import SDXLControlNet, BASE_MODEL, BASE_REVISION, CONTROL_MODEL, CONTROL_REVISION, PRODUCTION_PROMPT, NEGATIVE_PROMPT
from layout_reference import write_bundle, digest
from structural_control import control_bundle, validate_control_provenance
from test_layout import layout_manifest, options
from promote import promote
from review import role_review
from review_page import review_page
from import_edit import import_edit


class ControlNetTests(unittest.TestCase):
    def setUp(self):
        self.temporary=tempfile.TemporaryDirectory(); self.addCleanup(self.temporary.cleanup)
        self.root=Path(self.temporary.name); self.manifest=layout_manifest()
        self.reference=write_bundle(self.manifest,self.root/'layout')

    def opts(self,*extra):
        return options('--backend','sdxl-controlnet','--reference',str(self.reference),'--regions','walls,floor,counter,shelves,stairs',
            '--steps','30','--strength','.85','--guidance-scale','5','--count','3','--control-scales','.35,.65,1',
            '--output',str(self.root/'batch'),*extra)

    def batch(self):
        backend=Mock(); backend.environment={'device':'cuda','modelRevision':BASE_REVISION,'controlModel':CONTROL_MODEL,'controlRevision':CONTROL_REVISION}
        backend.generate.return_value=Image.new('RGB',(640,448),'purple'); backend.metrics.return_value={}
        with patch('controlnet_backend.SDXLControlNet',return_value=backend) as factory,contextlib.redirect_stdout(io.StringIO()):
            result=generate(self.manifest,self.opts())
        return result,backend,factory

    def test_registered_backend_keeps_turbo_contract(self):
        self.assertEqual(backend_definition('sdxl-controlnet').model,BASE_MODEL)
        self.assertEqual(backend_definition('sdxl-controlnet').modes,('controlnet-inpaint',))
        self.assertEqual(backend_definition('sdxl').max_steps,4)
        self.assertEqual(backend_definition('sdxl').guidance,0)

    def test_dry_run_builds_control_without_loading_model(self):
        with patch('controlnet_backend.SDXLControlNet') as factory,contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(generate(self.manifest,self.opts('--dry-run')),[])
            factory.assert_not_called()
        plan=next((self.root/'batch/plans').glob('*/dry-run.json'))
        meta=json.loads(plan.read_text()); self.assertFalse(meta['modelExecuted'])
        validate_control_provenance(plan.parent,meta['spec']['conditioning'])

    def test_control_map_is_deterministic_and_contains_only_reference_edges(self):
        reference=Image.open(self.reference.parent/'reference.png').convert('RGB')
        record={'sha256':digest((self.reference.parent/'reference.png').read_bytes())}
        a,metadata,files=control_bundle(reference,record); b,again,other=control_bundle(reference,record)
        self.assertEqual(a.tobytes(),b.tobytes()); self.assertEqual(metadata,again); self.assertEqual(files,other)
        self.assertEqual(set(a.getdata()),{(0,0,0),(255,255,255)})
        self.assertFalse(metadata['dynamicEntitiesEncoded']); self.assertEqual(a.size,(640,448))
        # Low contrast walls/routes must survive, not just the bright stairs/window.
        for box in [(195,98,290,105),(340,139,380,150),(20,235,32,330),(453,144,502,205)]:
            self.assertIsNotNone(a.crop(box).getbbox())

    def test_matrix_shares_seed_denoising_prompt_reference_control_and_masks(self):
        result,backend,factory=self.batch()
        factory.assert_called_once(); self.assertEqual(backend.generate.call_count,3)
        for index,(candidate,call) in enumerate(zip(result,backend.generate.call_args_list)):
            meta=candidate['metadata']; settings=meta['generationSettings']
            self.assertEqual(meta['seed'],19421); self.assertEqual(settings['strength'],.85)
            self.assertEqual(settings['controlnetConditioningScale'],[.35,.65,1][index])
            self.assertEqual(meta['model'],BASE_MODEL); self.assertEqual(settings['revision'],BASE_REVISION)
            self.assertEqual(meta['backend'],'sdxl-controlnet'); self.assertEqual(meta['conditioning']['mode'],'controlnet-inpaint')
            self.assertEqual(call.args[0]['modelPrompt'],PRODUCTION_PROMPT); self.assertEqual(call.args[0]['negativeModelPrompt'],NEGATIVE_PROMPT)
            self.assertEqual(meta['structurePreservation']['sourceChangedProtectedPixels'],0)
            self.assertEqual(meta['structurePreservation']['masterChangedProtectedPixels'],0)
            self.assertEqual(meta['pixelDimensions'],{'width':320,'height':224}); self.assertEqual(meta['dimensions'],{'width':640,'height':448})
            self.assertIs(call.kwargs['reference'],backend.generate.call_args_list[0].kwargs['reference'])
            self.assertIs(call.kwargs['control'],backend.generate.call_args_list[0].kwargs['control'])
            self.assertEqual(call.kwargs['mask'].tobytes(),backend.generate.call_args_list[0].kwargs['mask'].tobytes())

    def test_invalid_matrix_or_cpu_or_mixed_denoising_is_rejected(self):
        for extra in [('--control-scales','nan,.65,1'),('--control-scales','.3,.3,1'),('--control-scales','3,.65,1'),
                      ('--control-scales','.3,.6'),('--device','cpu','--allow-cpu'),('--strengths','.5,.7,.9'),
                      ('--guidance-scale','nan'),('--guidance-scale','0'),('--display-width','512'),('--revision','unapproved')]:
            with self.subTest(extra=extra),self.assertRaises(ValueError),contextlib.redirect_stdout(io.StringIO()):
                generate(self.manifest,self.opts(*extra,'--dry-run'))
        with self.assertRaises(ValueError),contextlib.redirect_stdout(io.StringIO()):
            generate(self.manifest,self.opts('--backend','sdxl','--steps','4','--guidance-scale','0','--dry-run'))

    def test_backend_forwards_actual_control_scale_negative_prompt_mask_and_seed(self):
        backend=SDXLControlNet.__new__(SDXLControlNet); backend.reference=Image.new('RGB',(640,448))
        backend.torch=Mock(); backend.torch.inference_mode.return_value=contextlib.nullcontext(); backend.torch.cuda.OutOfMemoryError=RuntimeError
        backend.pipeline=Mock(); backend.pipeline.return_value.images=['result']
        for name in ('tokenizer','tokenizer_2'):
            tokenizer=Mock(); tokenizer.return_value.input_ids=[1,2]; tokenizer.model_max_length=77; setattr(backend.pipeline,name,tokenizer)
        mask=Image.new('L',(640,448),255); control=Image.new('RGB',(640,448))
        settings={'width':640,'height':448,'strength':.85,'steps':30,'guidanceScale':5,'controlnetConditioningScale':.65}
        result=backend.generate({'modelPrompt':'room','negativeModelPrompt':'people'},settings,51863,mask=mask,control=control)
        args=backend.pipeline.call_args.kwargs
        self.assertEqual(result,'result'); self.assertIs(args['control_image'],control); self.assertIs(args['mask_image'],mask)
        self.assertEqual(args['controlnet_conditioning_scale'],.65); self.assertEqual(args['negative_prompt'],'people')
        self.assertEqual(args['guidance_scale'],5); backend.torch.Generator.return_value.manual_seed.assert_called_once_with(51863)

    def test_loader_is_pinned_offline_and_never_falls_back_from_cuda(self):
        from types import SimpleNamespace
        torch=Mock(); torch.__version__='test'; torch.cuda.is_available.return_value=False
        pipeline_type=Mock(); control_type=Mock()
        modules={'torch':torch,'diffusers':SimpleNamespace(ControlNetModel=control_type,StableDiffusionXLControlNetInpaintPipeline=pipeline_type)}
        with patch.dict(sys.modules,modules),patch('importlib.metadata.version',return_value='test'):
            with self.assertRaisesRegex(RuntimeError,'requires working CUDA'): SDXLControlNet(reference=Image.new('RGB',(640,448)),inpaint=True)
            pipeline_type.from_pretrained.assert_not_called(); control_type.from_pretrained.assert_not_called()
            torch.cuda.is_available.return_value=True
            with contextlib.redirect_stdout(io.StringIO()): backend=SDXLControlNet(reference=Image.new('RGB',(640,448)),inpaint=True,offline=False)
            for factory,model,revision in [(pipeline_type,BASE_MODEL,BASE_REVISION),(control_type,CONTROL_MODEL,CONTROL_REVISION)]:
                args=factory.from_pretrained.call_args
                self.assertEqual(args.args[0],model); self.assertEqual(args.kwargs['revision'],revision)
                self.assertTrue(args.kwargs['local_files_only']); self.assertTrue(args.kwargs['use_safetensors'])
                self.assertEqual(args.kwargs['variant'],'fp16')
            backend.pipeline.enable_model_cpu_offload.assert_called_once(); backend.pipeline.to.assert_not_called()

    def test_promotion_requires_geometry_review_and_preserves_control_attestation(self):
        results,_,_=self.batch(); candidate=results[0]; meta=candidate['metadata']
        kwargs=dict(architecture=True,composition=meta['reviewContract']['composition'],non_explicit=True)
        with self.assertRaisesRegex(ValueError,'Reference geometry approval'): role_review(meta,**kwargs)
        _,review=role_review(meta,reference_geometry=True,**kwargs)
        self.assertTrue(review['structuralControlChecked']); self.assertEqual(review['controlSha256'],meta['conditioning']['control']['sha256'])
        for field,value in [('model','other'),('backend','sdxl'),('structuralControlReviewRequired',False)]:
            bad=copy.deepcopy(meta); bad[field]=value
            with self.assertRaises(ValueError): role_review(bad,reference_geometry=True,**kwargs)
        bad=copy.deepcopy(meta); bad['conditioning']['mode']='img2img'
        with self.assertRaises(ValueError): role_review(bad,reference_geometry=True,**kwargs)
        bad=copy.deepcopy(meta); bad['generationSettings']['controlRevision']='other'
        with self.assertRaises(ValueError): role_review(bad,reference_geometry=True,**kwargs)

    def test_promotion_rejects_reference_control_and_mask_tampering_before_writes(self):
        results,_,_=self.batch(); path=Path(results[0]['path']); meta=results[0]['metadata']
        repo=self.root/'repo'; (repo/'src/content/visuals').mkdir(parents=True); (repo/'src/content/visuals/assets.json').write_text('[]')
        for record in [meta['conditioning'][k] for k in ('reference','layout','control')]+[meta['conditioning']['mask']['regions'][0]]:
            file=path.parent/record['file']; original=file.read_bytes(); file.write_bytes(b'tampered')
            with self.assertRaises(ValueError):
                promote(path,'test','test',repo,approve_architecture=True,approve_reference_geometry=True,non_explicit=True,composition=meta['reviewContract']['composition'])
            file.write_bytes(original)
        self.assertFalse((repo/'public').exists())
        self.assertEqual((repo/'src/content/visuals/assets.json').read_text(),'[]')

    def test_rehashed_control_still_cannot_change_deterministic_pixels_or_source(self):
        results,_,_=self.batch(); meta=copy.deepcopy(results[0]['metadata']); root=Path(results[0]['path']).parent
        record=meta['conditioning']['control']; path=root/record['file']
        image=Image.open(path).convert('RGB'); image.putpixel((0,0),(255,255,255)); image.save(root/'altered.png')
        path.write_bytes((root/'altered.png').read_bytes()); record['sha256']=digest(path.read_bytes()); record['pixelSha256']=digest(image.tobytes())
        with self.assertRaisesRegex(ValueError,'Control pixels'): validate_control_provenance(root,meta['conditioning'])
        record['sourceReferenceSha256']='other'
        with self.assertRaisesRegex(ValueError,'source reference hash'): validate_control_provenance(root,meta['conditioning'])

    def test_review_page_and_manual_import_retain_control_provenance(self):
        results,_,_=self.batch(); parent=Path(results[0]['path']); root=parent.parent
        page=review_page(root,self.root/'review'); html=page.read_text(encoding='utf-8')
        for value in ('control/canny.png','Authoritative reference','Control / generation settings','Canonical facts','Runtime composite pending'):
            self.assertIn(value,html)
        edited=root/results[0]['metadata']['sourceImage']['file']
        imported=import_edit(parent,edited,self.root/'edited','Test','Aseprite','Cleaned texture')
        candidate=Path(imported['candidate']); meta=json.loads(candidate.with_suffix('.json').read_text())
        validate_control_provenance(candidate.parent,meta['conditioning'])
        record=meta['uncompositedModelOutput']
        self.assertEqual(digest((candidate.parent/record['file']).read_bytes()),record['sha256'])
        self.assertTrue(meta['structuralControlReviewRequired']); self.assertFalse(meta['modelExecuted']); self.assertEqual(meta['reviewStatus'],'draft')
