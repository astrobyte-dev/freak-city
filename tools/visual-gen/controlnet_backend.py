"""Pinned SDXL Base + small Canny ControlNet. CUDA inference with explicit offload."""
import importlib.metadata
import json
from pathlib import Path

MODELS=json.loads(Path(__file__).with_name("controlnet-models.json").read_text())
BASE_MODEL,BASE_REVISION=MODELS[0]["repo"],MODELS[0]["revision"]
CONTROL_MODEL,CONTROL_REVISION=MODELS[1]["repo"],MODELS[1]["revision"]
PRODUCTION_PROMPT=("PS1 pixel art, empty underground bar interior, worn plaster and dark wood, "
    "magenta ambient light, cyan contrast, black shadows, reflective floor. "
    "One staircase beside salon opening, bare counter, empty shelves, high street window, distant small stage. "
    "Quiet open floor for sprites, restrained texture, fixed architecture.")
NEGATIVE_PROMPT="people, figures, stools, chairs, glasses, bottles, lamps, bins, props, text, logos, extra stairs, extra doors, balconies, galleries, ornate furniture"


class SDXLControlNet:
    def __init__(self,device="cuda",allow_cpu=False,revision=None,offline=False,reference=None,inpaint=False):
        import torch
        from diffusers import ControlNetModel, StableDiffusionXLControlNetInpaintPipeline
        if device!="cuda" or not torch.cuda.is_available():
            raise RuntimeError("SDXL ControlNet requires working CUDA; CPU generation is never selected")
        if reference is None or not inpaint:
            raise ValueError("Production backend requires validated reference plus mask")
        if revision and revision!=BASE_REVISION: raise ValueError("Unapproved production model revision")
        self.torch=torch; self.reference=reference
        torch.cuda.reset_peak_memory_stats()
        print(f"Loading {BASE_MODEL} + {CONTROL_MODEL}; CUDA FP16, explicit model CPU offload, pinned safetensors only.")
        # Download is deliberately separate, even if the adapter's --offline was omitted.
        # No optional VAE/refiner/image encoder or alternative weights are downloaded.
        common=dict(torch_dtype=torch.float16,variant="fp16",use_safetensors=True,local_files_only=True)
        controlnet=ControlNetModel.from_pretrained(CONTROL_MODEL,revision=CONTROL_REVISION,**common)
        self.pipeline=StableDiffusionXLControlNetInpaintPipeline.from_pretrained(
            BASE_MODEL,revision=BASE_REVISION,controlnet=controlnet,add_watermarker=False,**common)
        self.pipeline.enable_model_cpu_offload()
        self.pipeline.enable_vae_tiling()
        self.environment={"device":"cuda","dtype":"float16","weightVariant":"fp16","torch":torch.__version__,
            "diffusers":importlib.metadata.version("diffusers"),"cuda":torch.version.cuda,"gpu":torch.cuda.get_device_name(0),
            "modelRevision":BASE_REVISION,"controlModel":CONTROL_MODEL,"controlRevision":CONTROL_REVISION,
            "pipeline":type(self.pipeline).__name__,"scheduler":type(self.pipeline.scheduler).__name__,
            "timestepSpacing":self.pipeline.scheduler.config.timestep_spacing,"memoryPolicy":"model-cpu-offload; CUDA inference; VAE tiling",
            "offlineLoad":True,"vaePolicy":"base model VAE with native force_upcast", "selectedWeightBytes":sum(f['bytes'] for m in MODELS for f in m['files'] if f['file'].endswith('.safetensors'))}

    def metrics(self):
        return {"peakAllocatedMiB":round(self.torch.cuda.max_memory_allocated()/1024**2,1),
                "peakReservedMiB":round(self.torch.cuda.max_memory_reserved()/1024**2,1),"unetChannels":self.pipeline.unet.config.in_channels}

    def generate(self,spec,options,seed,*,reference=None,mask=None,control=None):
        if mask is None or control is None: raise ValueError("ControlNet needs both explicit structural control and mask")
        for name in ("tokenizer","tokenizer_2"):
            tokenizer=getattr(self.pipeline,name)
            for prompt in (spec["modelPrompt"],spec["negativeModelPrompt"]):
                if len(tokenizer(prompt).input_ids)>tokenizer.model_max_length: raise ValueError("Production prompt exceeds CLIP context")
        try:
            with self.torch.inference_mode():
                result=self.pipeline(prompt=spec["modelPrompt"],negative_prompt=spec["negativeModelPrompt"],
                    image=reference if reference is not None else self.reference,mask_image=mask,control_image=control,
                    width=options["width"],height=options["height"],strength=options["strength"],num_inference_steps=options["steps"],
                    guidance_scale=options["guidanceScale"],controlnet_conditioning_scale=float(options["controlnetConditioningScale"]),
                    control_guidance_start=0.0,control_guidance_end=1.0,
                    generator=self.torch.Generator(device="cpu").manual_seed(seed)).images[0]
            self.torch.cuda.synchronize()
            return result
        except self.torch.cuda.OutOfMemoryError as error:
            raise RuntimeError("ControlNet exhausted GPU memory; no CPU fallback or automatic parameter change") from error
